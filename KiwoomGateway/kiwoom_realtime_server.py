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
from PyQt5.QtCore import QEventLoop

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

    print("🛑 서버를 종료합니다.")
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
        self.current_rqname = ""
        self.real_data_queue = queue
        self.data_loaded_event = asyncio.Event()
        self.main_loop = loop

    def initialize_ocx(self):
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.login_event_loop = QEventLoop()
        self.ocx.OnEventConnect.connect(self.login_event)
        self.ocx.OnReceiveTrData.connect(self.receive_tr_data)
        self.ocx.OnReceiveRealData.connect(self._on_receive_real_data)
        print("✅ OCX 컨트롤 및 이벤트 루프가 성공적으로 초기화되었습니다.")

    def save_data_to_file(self):
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
        if not os.path.exists(DATA_FILE_PATH): return False
        try:
            with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f: content = json.load(f)
            ts, data = content.get("timestamp"), content.get("data", [])
            if ts and data and datetime.now() - datetime.fromisoformat(ts) < timedelta(hours=CACHE_DURATION_HOURS):
                self.all_companies_data = data
                print(f"✅ 유효한 캐시를 로드했습니다. (총 {len(data)}개)")
                self.data_loaded_event.set()
                return True
        except Exception as e: print(f"🔥 캐시 로드 중 오류: {e}")
        return False

    def login(self):
        self.ocx.dynamicCall("CommConnect()")
        self.login_event_loop.exec_()

    def login_event(self, err_code):
        self.is_connected = (err_code == 0)
        print(f"✅ 로그인 성공" if self.is_connected else f"🔥 로그인 실패: {err_code}")
        self.login_event_loop.exit()

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next_key):
        if self.current_rqname in rqname:
            def get(field, is_numeric=False):
                val = self.ocx.dynamicCall("GetCommData(QString,QString,int,QString)", trcode, rqname, 0, field).strip()
                return str(abs(int(val))) if is_numeric and val and val.replace('-', '').isdigit() else val if not is_numeric else "0"
            
            currentPrice, previousClose = get("현재가", True), get("전일종가", True)
            if currentPrice == "0" and previousClose != "0": currentPrice = previousClose
            
            self.tr_data = {
                "name": get("종목명"), "marketCap": get("시가총액"), "per": get("PER"),
                "volume": get("거래량", True), "currentPrice": currentPrice, "highPrice": get("고가", True),
                "lowPrice": get("저가", True), "openingPrice": get("시가", True), "change": get("전일대비", True),
                "changeRate": get("등락율"), "previousClose": previousClose,
            }
            self.tr_received_event.set()

    def _on_receive_real_data(self, stock_code, real_type, real_data):
        if real_type == "주식체결":
            def get(fid): return self.ocx.dynamicCall("GetCommRealData(QString, int)", stock_code, fid).strip()
            price, change = get(10), get(11)
            info = {"stockCode": stock_code, "currentPrice": str(abs(int(price))) if price and price.replace('-', '').isdigit() else "0", "changeRate": get(12), "change": str(abs(int(change))) if change and change.replace('-', '').isdigit() else "0"}
            asyncio.run_coroutine_threadsafe(self.real_data_queue.put(info), self.main_loop)

    def get_stock_basic_info(self, stock_code):
        self.tr_data = None
        self.tr_received_event.clear()
        self.current_rqname = f"주식기본정보요청_{stock_code}"
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        if self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", self.current_rqname, "OPT10001", 0, "0101") != 0: return None
        return self.tr_data if self.tr_received_event.wait(timeout=5) else None
        
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
            kospi_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "0")
            kosdaq_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "10")
            kospi_codes = kospi_codes_raw.split(';') if kospi_codes_raw else []
            kosdaq_codes = kosdaq_codes_raw.split(';') if kosdaq_codes_raw else []
            all_codes = [code for code in kospi_codes + kosdaq_codes if code]
            
            if not all_codes:
                print("🔥 API로부터 종목 코드를 가져오는데 실패했습니다. API 상태를 확인해주세요.")
                return

            print(f"✅ 종목 '코드 목록' 수신 완료 (총 {len(all_codes)}개).")
            print(f"▶️ 이제 각 종목의 '상세 정보' 조회를 시작합니다. (약 15분 소요)")
            
            batch_size = 200
            for i, code in enumerate(all_codes):
                print(f"  -> [{i+1}/{len(all_codes)}] {code} 정보 요청 중...")
                stock_info = self.get_stock_basic_info(code)
                if stock_info:
                    self.all_companies_data.append({"stockCode": code, **stock_info})
                
                time.sleep(0.21)

                # --- ✨ 분할 저장 로직 ---
                if (i + 1) % batch_size == 0:
                    print(f"💾 배치 { (i + 1) // batch_size } 완료. 현재까지 {len(self.all_companies_data)}개 데이터를 파일에 저장합니다.")
                    self.save_data_to_file()
            
            # --- 마지막 남은 데이터 저장 ---
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
        if not instance.load_data_from_file():
            print("⌛ 유효한 캐시가 없어, API로부터 새 데이터를 로딩합니다.")
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
    return {"success": True, "data": kiwoom_api_instance.all_companies_data}

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