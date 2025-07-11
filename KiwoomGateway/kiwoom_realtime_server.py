import sys
import threading
import uvicorn
import asyncio
import json
import os
import time
import logging
from logging.handlers import RotatingFileHandler
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop, QTimer

# --- 로깅 설정 ---
log_dir = "KiwoomGateway/logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "security.log")

# 로거 설정
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)
handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
security_logger.addHandler(handler)


# --- 설정 ---
DATA_FILE_PATH = "./cached_company_data.json"
CACHE_DURATION_HOURS = 3

# --- 전역 변수 및 인스턴스 ---
real_data_queue: asyncio.Queue = asyncio.Queue()
connected_websockets: set[WebSocket] = set()
kiwoom_api_instance = None
limiter = Limiter(key_func=get_remote_address)

# --- 커스텀 예외 핸들러 ---
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Rate Limit 초과 시 로그를 남기는 커스텀 핸들러"""
    security_logger.warning(f"Rate limit exceeded for IP: {request.client.host} on path: {request.url.path}")
    return JSONResponse(
        status_code=429,
        content={"detail": f"Too Many Requests: {exc.detail}"}
    )

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
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler) # 커스텀 핸들러 등록

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 키움 API 클래스 (이하 동일) ---
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
        self.pending_tr_requests = {}
        self._screen_no_counter = 1000

    def qt_sleep(self, seconds):
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
            self.all_companies_data = []

    def login(self):
        self.ocx.dynamicCall("CommConnect()")
        self.login_event_loop.exec_()

    def login_event(self, err_code):
        self.is_connected = (err_code == 0)
        print(f"✅ 로그인 성공" if self.is_connected else f"🔥 로그인 실패: {err_code}")
        self.login_event_loop.exit()

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next_key):
        if rqname in self.pending_tr_requests:
            request_info = self.pending_tr_requests[rqname]
            def get(field, is_numeric=False):
                val = self.ocx.dynamicCall("GetCommData(QString,QString,int,QString)", trcode, rqname, 0, field).strip()
                if not is_numeric: return val
                try: return str(abs(int(val)))
                except (ValueError, TypeError): return "0"
            currentPrice = get("현재가", True)
            previousClose = get("전일종가", True)
            if currentPrice == "0" and previousClose != "0": currentPrice = previousClose
            tr_data = {"name": get("종목명"), "marketCap": get("시가총액"), "per": get("PER"), "volume": get("거래량", True), "currentPrice": currentPrice, "highPrice": get("고가", True), "lowPrice": get("저가", True), "openingPrice": get("시가", True), "change": get("전일대비", True), "changeRate": get("등락율"), "previousClose": previousClose}
            request_info['data'] = tr_data
            request_info['event'].set()
        else: pass

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
        screen_no = str(self._screen_no_counter).zfill(4)
        self._screen_no_counter = (self._screen_no_counter % 9999) + 1
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        max_retries = 3
        for attempt in range(max_retries):
            ret = self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", rqname, "OPT10001", 0, screen_no)
            if ret == 0: break
            self.qt_sleep(1.0)
        else:
            del self.pending_tr_requests[rqname]
            return None
        wait_start_time = time.time()
        while not tr_event.wait(timeout=0.1):
            if QApplication.instance(): QApplication.instance().processEvents(QEventLoop.AllEvents)
            if time.time() - wait_start_time > 20:
                del self.pending_tr_requests[rqname]
                return None
        result = self.pending_tr_requests[rqname]['data']
        del self.pending_tr_requests[rqname]
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
        print("모든 기업 정보 로딩을 시작합니다...")
        try:
            existing_codes = {item['stockCode'] for item in self.all_companies_data}
            if existing_codes: print(f"✅ {len(existing_codes)}개의 기존 데이터를 발견했습니다. 이어갑니다.")
            kospi_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "0")
            kosdaq_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "10")
            self.qt_sleep(3.6)
            all_codes_with_market = [(code, "KOSPI") for code in (kospi_codes_raw.split(';') if kospi_codes_raw else []) if code] + [(code, "KOSDAQ") for code in (kosdaq_codes_raw.split(';') if kosdaq_codes_raw else []) if code]
            codes_to_fetch = [item for item in all_codes_with_market if item[0] not in existing_codes]
            if not codes_to_fetch:
                print("✅ 모든 종목의 최신 정보가 이미 저장되어 있습니다.")
                self.data_loaded_event.set()
                return
            total_requests = len(codes_to_fetch)
            print(f"✅ 전체 {len(all_codes_with_market)}개 중 {total_requests}개의 신규/누락된 종목 정보를 가져옵니다.")
            batch_size = 200
            for i, (code, market) in enumerate(codes_to_fetch):
                stock_info = None
                for attempt in range(3):
                    print(f"  -> [{i+1}/{total_requests}] ({market}) {code} 정보 요청 중... (시도 {attempt+1}/3)")
                    stock_info = self.get_stock_basic_info(code)
                    if stock_info: break
                    self.qt_sleep(3.6)
                if not stock_info: continue
                self.all_companies_data.append({"stockCode": code, "market": market, **stock_info})
                if (i + 1) % batch_size == 0:
                    print(f"💾 배치 저장. 현재까지 총 {len(self.all_companies_data)}개 데이터를 파일에 저장합니다.")
                    self.save_data_to_file()
                self.qt_sleep(3.6)
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
        instance.load_data_from_file()
        print("ℹ️ API 안정화를 위해 20초 대기합니다...")
        instance.qt_sleep(20)
        instance.load_all_company_data()
    else:
        print("🔥 로그인 실패. 데이터 로딩을 진행할 수 없습니다.")
        instance.data_loaded_event.set()
    app_qt.exec_()

# --- FastAPI 엔드포인트 및 웹소켓 ---
@app.get("/api/all-companies")
@limiter.limit("100/minute")
async def get_all_companies(request: Request):
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
