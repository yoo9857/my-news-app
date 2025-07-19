import sys
import threading
import asyncio
import json
import os
import site
from PyQt5.QtCore import QCoreApplication

# --- Qt 플랫폼 플러그인 경로 설정 ---
venv_path = sys.prefix
plugin_path = os.path.join(venv_path, 'Lib', 'site-packages', 'PyQt5', 'Qt5', 'plugins', 'platforms')
QCoreApplication.addLibraryPath(plugin_path)

import time
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop, QTimer

import redis.asyncio as redis

# --- 로깅 설정 ---
log_dir = "KiwoomGateway/logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "kiwoom_realtime.log")

kiwoom_logger = logging.getLogger("kiwoom_realtime")
kiwoom_logger.setLevel(logging.INFO)
handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
kiwoom_logger.addHandler(handler)

# --- 전역 변수 및 인스턴스 ---
real_data_queue: asyncio.Queue = asyncio.Queue()
kiwoom_api_instance = None
redis_pub_client = None

# --- 키움 API 클래스 ---
class KiwoomAPI:
    def __init__(self, queue, loop, redis_client):
        self.ocx = None
        self.login_event_loop = None
        self.tr_received_event = threading.Event()
        self.tr_data = None
        self.is_connected = False
        self.all_companies_data = [] # This will be loaded from DB by stock_service
        self.current_rqname = ""
        self.real_data_queue = queue
        self.main_loop = loop
        self.pending_tr_requests = {}
        self._screen_no_counter = 1000
        self.redis_pub_client = redis_client

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
        kiwoom_logger.info("✅ OCX 컨트롤 및 이벤트 루프가 성공적으로 초기화되었습니다.")

    def login(self):
        self.ocx.dynamicCall("CommConnect()")
        self.login_event_loop.exec_()

    def login_event(self, err_code):
        self.is_connected = (err_code == 0)
        kiwoom_logger.info(f"✅ 로그인 성공" if self.is_connected else f"🔥 로그인 실패: {err_code}")
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
        if ret == 0: kiwoom_logger.info(f"✅ {len(stock_codes)}개 종목 실시간 시세 구독 성공")
        else: kiwoom_logger.error(f"🔥 {len(stock_codes)}개 종목 실시간 시세 구독 실패")
            
    def disconnect_all_realtime(self):
        self.ocx.dynamicCall("DisconnectRealData(QString)", "9001")
        kiwoom_logger.info("ℹ️ 모든 실시간 시세 구독 해제 완료.")

    def load_all_company_data(self):
        kiwoom_logger.info("모든 기업 정보 로딩을 시작합니다...")
        try:
            kospi_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "0")
            kosdaq_codes_raw = self.ocx.dynamicCall("GetCodeListByMarket(QString)", "10")
            self.qt_sleep(3.6)
            all_codes_with_market = [(code, "KOSPI") for code in (kospi_codes_raw.split(';') if kospi_codes_raw else []) if code] + [(code, "KOSDAQ") for code in (kosdaq_codes_raw.split(';') if kosdaq_codes_raw else []) if code]
            
            # Save all codes to Redis for stock_service to use
            if self.redis_pub_client:
                asyncio.run_coroutine_threadsafe(self.redis_pub_client.set("all_stock_codes", json.dumps(all_codes_with_market)), self.main_loop)
                kiwoom_logger.info(f"✅ {len(all_codes_with_market)}개 종목 코드를 Redis에 저장했습니다.")

        except Exception as e:
            import traceback
            kiwoom_logger.error(f"🔥 전체 데이터 로딩 중 심각한 오류 발생: {e}")
            traceback.print_exc()

# --- 비동기 및 스레드 관리 ---
def run_kiwoom_thread(instance: KiwoomAPI):
    app_qt = QApplication(sys.argv)
    instance.initialize_ocx()
    instance.login()
    if instance.is_connected:
        kiwoom_logger.info("✅ 로그인 성공 확인. 데이터 로딩 프로세스를 시작합니다.")
        instance.load_all_company_data()
    else:
        kiwoom_logger.error("🔥 로그인 실패. 데이터 로딩을 진행할 수 없습니다.")
    app_qt.exec_()

async def real_data_publisher(queue: asyncio.Queue, redis_client: redis.Redis):
    while True:
        data = await queue.get()
        msg = json.dumps({"type": "realtime", "data": data})
        if redis_client:
            try:
                await redis_client.publish("kiwoom_realtime_data", msg)
                kiwoom_logger.info(f"✅ Redis에 실시간 데이터 발행: {msg[:50]}...")
            except Exception as e:
                kiwoom_logger.error(f"🔥 Redis 발행 중 오류 발생: {e}")

# --- 메인 실행 ---
if __name__ == '__main__':
    print("🚀 Kiwoom Realtime Server 시작...")
    main_loop = asyncio.get_event_loop()
    redis_client = redis.from_url(
        f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}",
        decode_responses=True
    )
    kiwoom_api_instance = KiwoomAPI(real_data_queue, main_loop, redis_client)
    
    # Start the PyQt5 application in a separate thread
    kiwoom_thread = threading.Thread(target=run_kiwoom_thread, args=(kiwoom_api_instance,))
    kiwoom_thread.daemon = True
    kiwoom_thread.start()

    # Start the Redis publisher coroutine
    main_loop.create_task(real_data_publisher(real_data_queue, redis_client))

    try:
        main_loop.run_forever()
    except KeyboardInterrupt:
        kiwoom_logger.info("서버 종료 요청 수신.")
    finally:
        if redis_client:
            asyncio.run(redis_client.close())
        if QApplication.instance():
            QApplication.instance().quit()
        kiwoom_logger.info("🚀 Kiwoom Realtime Server 종료.")