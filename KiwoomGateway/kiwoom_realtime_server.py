import sys
import threading
import uvicorn
import asyncio
import json
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop, QTimer

# --- 설정 ---
DATA_FILE_PATH = "./cached_company_data.json"
CACHE_DURATION_HOURS = 3

# --- 전역 변수 및 인스턴스 ---
real_data_queue: asyncio.Queue = asyncio.Queue()
connected_websockets: set[WebSocket] = set()
kiwoom_api_instance = None

# --- FastAPI Lifespan 관리자 ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global kiwoom_api_instance
    print("🚀 서버 시작 프로세스를 개시합니다.")
    
    main_loop = asyncio.get_running_loop()
    kiwoom_api_instance = KiwoomAPI(real_data_queue, main_loop)
    
    kiwoom_thread = threading.Thread(target=run_kiwoom_thread, args=(kiwoom_api_instance,))
    kiwoom_thread.daemon = True
    kiwoom_thread.start()

    asyncio.create_task(real_data_broadcaster())

    yield

    print("🛑 서버를 종료합니다. 최종 데이터 저장을 시도합니다.")
    if kiwoom_api_instance:
        kiwoom_api_instance.save_data_to_file()
    
    if QApplication.instance():
        QApplication.instance().quit()

# --- FastAPI 앱 및 미들웨어 설정 ---
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 키움 API 클래스 ---
class KiwoomAPI:
    def __init__(self, queue, loop):
        self.ocx = None
        self.login_event_loop = None
        self.tr_received_event = threading.Event()
        self.tr_data = None
        self.is_connected = False
        self.all_companies_data = []
        self.current_rqname = "" # 더 이상 단일 요청에 사용되지 않음
        self.real_data_queue = queue
        self.data_loaded_event = asyncio.Event()
        self.main_loop = loop
        self.pending_tr_requests = {} # {rqname: {'event': threading.Event(), 'data': None}}
        self._screen_no_counter = 1000 # 화면번호 카운터 시작 (0000-9999 범위)

    def qt_sleep(self, seconds):
        """Qt 이벤트 루프를 처리하는 논블로킹(non-blocking) sleep 함수."""
        loop = QEventLoop()
        QTimer.singleShot(int(seconds * 1000), loop.quit)
        loop.exec_()

    def initialize_ocx(self):
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.login_event_loop = QEventLoop()
        self.ocx.OnEventConnect.connect(self.login_event)
        self.ocx.OnReceiveTrData.connect(self.receive_tr_data)
        self.ocx.OnReceiveRealData.connect(self._on_receive_real_data)
        print("✅ OCX 컨트롤 및 이벤트 루프가 성공적으로 초기화되었습니다.")

    def save_data_to_file(self):
        print(f"DEBUG: save_data_to_file 호출됨. all_companies_data 길이: {len(self.all_companies_data) if self.all_companies_data else 0}")
        if not self.all_companies_data:
            print("⚠️ 저장할 데이터가 없어 캐시 파일을 생성하지 않습니다.")
            return
        try:
            with open(DATA_FILE_PATH, 'w', encoding='utf-8') as f:
                json.dump({"timestamp": datetime.now().isoformat(), "data": self.all_companies_data}, f, ensure_ascii=False, indent=4)
            print(f"💾 데이터를 {DATA_FILE_PATH}에 성공적으로 저장했습니다. (총 {len(self.all_companies_data)}개)")
        except Exception as e:
            print(f"🔥 데이터 저장 중 오류 발생: {e}")

    def load_data_from_file(self):
        """캐시 파일이 존재하면 데이터를 메모리로 로드합니다."""
        if not os.path.exists(DATA_FILE_PATH):
            print("ℹ️ 기존 캐시 파일이 없습니다.")
            return
        try:
            with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
                content = json.load(f)
            self.all_companies_data = content.get("data", [])
            print(f"✅ 기존 캐시에서 {len(self.all_companies_data)}개 데이터를 로드했습니다.")
        except Exception as e:
            print(f"🔥 캐시 로드 중 오류: {e}")
            self.all_companies_data = [] # 오류 발생 시 리스트 초기화

    def login(self):
        self.ocx.dynamicCall("CommConnect()")
        self.login_event_loop.exec_()

    def login_event(self, err_code):
        self.is_connected = (err_code == 0)
        print(f"✅ 로그인 성공" if self.is_connected else f"🔥 로그인 실패: {err_code}")
        self.login_event_loop.exit()

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next_key):
        print(f"DEBUG: OnReceiveTrData called for rqname: {rqname}, trcode: {trcode}")
        
        if rqname in self.pending_tr_requests: # 해당 rqname에 대한 요청이 대기 중인지 확인
            request_info = self.pending_tr_requests[rqname]
            
            # print(f"DEBUG: TR 데이터 파싱 시작 for {rqname}")
            
            def get(field, is_numeric=False):
                """부호(+, -)가 포함된 숫자 문자열도 안전하게 처리하는 파서"""
                val = self.ocx.dynamicCall("GetCommData(QString,QString,int,QString)", trcode, rqname, 0, field).strip()
                if not is_numeric:
                    return val
                
                # is_numeric인 경우, 부호를 처리하고 절대값을 문자열로 반환
                try:
                    return str(abs(int(val)))
                except (ValueError, TypeError):
                    return "0"

            currentPrice = get("현재가", True)
            previousClose = get("전일종가", True)
            
            # 현재가가 0이고 전일가가 0이 아닐 때, 현재가를 전일가로 보정
            if currentPrice == "0" and previousClose != "0":
                currentPrice = previousClose
            
            tr_data = {
                "name": get("종목명"), "marketCap": get("시가총액"), "per": get("PER"),
                "volume": get("거래량", True), "currentPrice": currentPrice, "highPrice": get("고가", True),
                "lowPrice": get("저가", True), "openingPrice": get("시가", True), "change": get("전일대비", True),
                "changeRate": get("등락율"), "previousClose": previousClose,
            }
            print(f"DEBUG: TR 데이터 파싱 완료 for {rqname}. Data: {tr_data}")
            
            request_info['data'] = tr_data # 데이터 저장
            request_info['event'].set() # 이벤트 설정
        else:
            print(f"DEBUG: 알 수 없는 rqname에 대한 TR 데이터 수신: {rqname}. 무시합니다.")
            pass

    def _on_receive_real_data(self, stock_code, real_type, real_data):
        if real_type == "주식체결":
            def get(fid): return self.ocx.dynamicCall("GetCommRealData(QString, int)", stock_code, fid).strip()
            price, change = get(10), get(11)
            info = {"stockCode": stock_code, "currentPrice": str(abs(int(price))) if price and price.replace('-', '').isdigit() else "0", "changeRate": get(12), "change": str(abs(int(change))) if change and change.replace('-', '').isdigit() else "0"}
            asyncio.run_coroutine_threadsafe(self.real_data_queue.put(info), self.main_loop)

    def get_stock_basic_info(self, stock_code):
        rqname = f"주식기본정보요청_{stock_code}"
        tr_event = threading.Event()
        self.pending_tr_requests[rqname] = {'event': tr_event, 'data': None}

        # 고유한 화면번호 생성
        screen_no = str(self._screen_no_counter).zfill(4)
        self._screen_no_counter = (self._screen_no_counter % 9999) + 1 # 0000-9999 범위 유지

        # --- 중요: SetInputValue 호출 추가 ---
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)

        # CommRqData 호출 및 재시도 로직 추가
        max_retries = 3
        for attempt in range(max_retries):
            # print(f"DEBUG: [{attempt+1}/{max_retries}] {stock_code} CommRqData 호출 시도 (화면번호: {screen_no})...")
            ret = self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", rqname, "OPT10001", 0, screen_no)
            
            if ret == 0:
                # print(f"DEBUG: CommRqData 호출 성공 (ret=0) for {stock_code}.")
                break
            
            print(f"DEBUG: CommRqData 호출 실패 (ret={ret}) for {stock_code}. 잠시 후 재시도합니다.")
            self.qt_sleep(1.0) # 재시도 전 대기 (논블로킹)
        else: # max_retries 모두 실패
            print(f"🔥 {stock_code} CommRqData 최종 실패. 다음 종목으로 넘어갑니다.")
            del self.pending_tr_requests[rqname] # 실패 시 딕셔너리에서 제거
            return None

        # TR 데이터 수신 대기 (타임아웃 20초로 증가)
        wait_start_time = time.time()
        while not tr_event.wait(timeout=0.1): # 해당 요청의 이벤트를 기다림
            if QApplication.instance():
                QApplication.instance().processEvents(QEventLoop.AllEvents)
            
            if time.time() - wait_start_time > 20:
                print(f"DEBUG: {stock_code} TR 데이터 수신 타임아웃 (20초 초과).")
                del self.pending_tr_requests[rqname] # 타임아웃 시 딕셔너리에서 제거
                return None
        
        result = self.pending_tr_requests[rqname]['data']
        del self.pending_tr_requests[rqname] # 성공적으로 데이터 수신 후 딕셔너리에서 제거
        return result
        
    def subscribe_realtime_data(self, stock_codes: list):
        codes_str = ";".join(stock_codes)
        fids = "10;11;12;15"
        ret = self.ocx.dynamicCall("SetRealReg(QString, QString, QString, QString)", "9001", codes_str, fids, "1")
        if ret == 0: print(f"✅ {len(stock_codes)}개 종목 실시간 시세 구독 성공")
        else: print(f"🔥 {len(stock_codes)}개 종목 실시간 시세 구독 실패")
            
    def disconnect_all_realtime(self):
        self.ocx.dynamicCall("DisconnectRealData(QString)", "9001")
        print("ℹ️ 모든 실시간 시세 구독 해제 완료.")

    def load_all_company_data(self):
        print("모든 기업 정보 로딩을 시작합니다 (전체 시장, 배치 처리 방식)...")
        try:
            # --- ✨ 이어가기 로직: 이미 저장된 종목 코드를 가져옵니다. ---
            existing_codes = {item['stockCode'] for item in self.all_companies_data}
            if existing_codes:
                print(f"✅ {len(existing_codes)}개의 기존 데이터를 발견했습니다. 중단된 지점부터 다운로드를 이어갑니다.")

            kospi_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "0")
            kosdaq_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "10")
            
            print("ℹ️ 종목 코드 목록 수신 완료. TR 요청 전 3.6초 대기합니다...")
            self.qt_sleep(3.6)

            all_codes_with_market = [(code, "KOSPI") for code in (kospi_codes_raw.split(';') if kospi_codes_raw else []) if code] + \
                                    [(code, "KOSDAQ") for code in (kosdaq_codes_raw.split(';') if kosdaq_codes_raw else []) if code]

            # --- ✨ 이어가기 로직: 전체 목록에서 이미 있는 코드를 제외합니다. ---
            codes_to_fetch = [item for item in all_codes_with_market if item[0] not in existing_codes]

            if not codes_to_fetch:
                print("✅ 모든 종목의 최신 정보가 이미 저장되어 있습니다. 데이터 로딩을 건너뜁니다.")
                self.data_loaded_event.set()
                return

            total_requests = len(codes_to_fetch)
            print(f"✅ 전체 {len(all_codes_with_market)}개 중 {total_requests}개의 신규/누락된 종목 정보를 가져옵니다.")
            estimated_minutes = (total_requests * 3.6) / 60
            print(f"▶️ 예상 소요 시간: 약 {estimated_minutes:.0f}분")
            
            batch_size = 200
            for i, (code, market) in enumerate(codes_to_fetch):
                stock_info = None
                for attempt in range(3):
                    print(f"  -> [{i+1}/{total_requests}] ({market}) {code} 정보 요청 중... (시도 {attempt+1}/3)")
                    stock_info = self.get_stock_basic_info(code)
                    if stock_info:
                        break
                    print(f"⚠️ [{code}] 정보 조회 실패. 3.6초 후 재시도합니다...")
                    self.qt_sleep(3.6)

                if not stock_info:
                    print(f"🔥 [{code}] 정보 조회 최종 실패. 다음 종목으로 건너뜁니다.")
                    continue
                
                self.all_companies_data.append({"stockCode": code, "market": market, **stock_info})
                
                if (i + 1) % batch_size == 0:
                    print(f"💾 배치 저장. 현재까지 총 {len(self.all_companies_data)}개 데이터를 파일에 저장합니다.")
                    self.save_data_to_file()

                # 다음 요청 전 3.6초 대기
                self.qt_sleep(3.6)
            
            print("💾 최종 데이터 저장 중...")
            self.save_data_to_file()

        except Exception as e:
            import traceback
            print(f"🔥 전체 데이터 로딩 중 심각한 오류 발생: {e}")
            traceback.print_exc()
        finally:
            self.data_loaded_event.set()
            print("✅ 모든 데이터 로딩 작업 완료.")

# --- 비동기 및 스레드 관리 ---
def run_kiwoom_thread(instance: KiwoomAPI):
    app_qt = QApplication(sys.argv)
    instance.initialize_ocx()
    instance.login()
    if instance.is_connected:
        print("✅ 로그인 성공 확인. 데이터 로딩 프로세스를 시작합니다.")
        
        # --- ✨ 이어가기 로직: 무조건 기존 캐시를 먼저 로드합니다. ---
        instance.load_data_from_file()

        # --- ✨ 이어가기 로직: 항상 데이터 로딩/완성 함수를 호출합니다. ---
        # 이 함수는 내부적으로 누락된 항목만 가져옵니다.
        print("ℹ️ API 안정화를 위해 20초 대기합니다...")
        instance.qt_sleep(20)
        instance.load_all_company_data()
    else:
        print("🔥 로그인 실패. 데이터 로딩을 진행할 수 없습니다.")
        instance.data_loaded_event.set()
    app_qt.exec_()

# --- FastAPI 엔드포인트 및 웹소켓 ---
@app.get("/api/all-companies")
async def get_all_companies():
    if not kiwoom_api_instance.data_loaded_event.is_set():
        await kiwoom_api_instance.data_loaded_event.wait()
    
    content = {"success": True, "data": kiwoom_api_instance.all_companies_data}
    return JSONResponse(content=content, media_type="application/json; charset=utf-8")

@app.websocket("/ws/realtime-price")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    print(f"✅ WebSocket 연결: {websocket.client}")
    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                if data.get("type") == "subscribe" and "codes" in data:
                    codes = data["codes"]
                    if codes:
                        print(f"📬 클라이언트로부터 {len(codes)}개 종목 구독 요청 수신")
                        kiwoom_api_instance.subscribe_realtime_data(codes)
            except json.JSONDecodeError:
                print("🔥 잘못된 형식의 WebSocket 메시지 수신")
    except WebSocketDisconnect:
        print(f"ℹ️ WebSocket 연결 해제: {websocket.client}")
    finally:
        connected_websockets.discard(websocket)
        if not connected_websockets:
            kiwoom_api_instance.disconnect_all_realtime()

async def real_data_broadcaster():
    while True:
        data = await real_data_queue.get()
        msg = json.dumps({"type": "realtime", "data": data})
        bcast = [sock.send_text(msg) for sock in connected_websockets]
        await asyncio.gather(*bcast, return_exceptions=True)

# --- 메인 실행 ---
if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)