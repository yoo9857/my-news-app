import sys
import threading
import time
import uvicorn
import asyncio
import json
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse

# --- FastAPI 앱 생성 ---
app = FastAPI()

# 데이터 캐싱 파일 경로
DATA_FILE_PATH = "./cached_company_data.json"
CACHE_DURATION_HOURS = 1 # 캐시 유효 시간 (1시간)

# ... (기존 코드)

@app.exception_handler(Exception)
async def universal_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled exception: {exc}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected server error occurred.",
            "detail": str(exc)
        },
    )
from fastapi.middleware.cors import CORSMiddleware
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop

# --- CORS 미들웨어 설정 ---
# 허용할 출처(origin) 목록입니다.
# 모든 출처를 허용하도록 변경 (테스트 목적)
origins = ["*"] # 모든 출처 허용

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origin_regex=r'https://.*\.vercel\.app', # 이 줄은 이제 필요 없습니다.
    allow_credentials=True, # 자격 증명(쿠키, HTTP 인증 등) 허용 여부
    allow_methods=["*"], # 모든 HTTP 메서드 (GET, POST, OPTIONS 등) 허용
    allow_headers=["*"], # 모든 헤더 허용
)

# --- 전역 변수 ---
real_data_queue: asyncio.Queue = asyncio.Queue()
connected_websockets: set[WebSocket] = set()
subscribed_real_codes: set[str] = set() # 실시간 등록된 종목 코드 관리

# --- 키움 API 클래스 ---
class KiwoomAPI:
    def __init__(self, real_data_queue: asyncio.Queue):
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.ocx.OnEventConnect.connect(self.login_event)
        self.ocx.OnReceiveTrData.connect(self.receive_tr_data)
        self.ocx.OnReceiveRealData.connect(self._on_receive_real_data) # 실시간 데이터 이벤트 연결
        
        self.login_event_loop = QEventLoop()
        self.tr_event_loop = QEventLoop()
        self.tr_received_event = threading.Event()
        
        self.tr_data = None
        self.is_connected = False
        self.all_companies_data = []
        self.current_rqname = ""
        self.real_data_queue = real_data_queue # 실시간 데이터를 전달할 큐
        self.data_loaded_event = asyncio.Event() # 데이터 로딩 완료 이벤트

    def save_data_to_file(self):
        try:
            with open(DATA_FILE_PATH, 'w', encoding='utf-8') as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "data": self.all_companies_data
                }, f, ensure_ascii=False, indent=4)
            print(f"데이터를 {DATA_FILE_PATH}에 성공적으로 저장했습니다.")
        except Exception as e:
            print(f"데이터 저장 중 오류 발생: {e}")

    def load_data_from_file(self):
        if os.path.exists(DATA_FILE_PATH):
            try:
                with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    timestamp_str = content.get("timestamp")
                    cached_data = content.get("data", [])

                    if timestamp_str:
                        cached_timestamp = datetime.fromisoformat(timestamp_str)
                        # 캐시 유효성 검사
                        if datetime.now() - cached_timestamp < timedelta(hours=CACHE_DURATION_HOURS):
                            self.all_companies_data = cached_data
                            print(f"데이터를 {DATA_FILE_PATH}에서 성공적으로 로드했습니다. (캐시 사용)")
                            self.data_loaded_event.set() # 캐시 로드 시 이벤트 설정
                            return True
                        else:
                            print("캐시가 만료되었습니다. 새 데이터를 로드합니다.")
                    else:
                        print("캐시 파일에 타임스탬프가 없습니다. 새 데이터를 로드합니다.")
            except json.JSONDecodeError:
                print("캐시 파일이 손상되었습니다. 새 데이터를 로드합니다.")
            except Exception as e:
                print(f"캐시 로드 중 오류 발생: {e}")
        print("캐시 파일이 없거나 유효하지 않습니다.")
        return False

    def login(self):
        ret = self.ocx.dynamicCall("CommConnect()")
        if ret == 0:
            print("로그인 요청 성공")
            self.login_event_loop.exec_() # 로그인 이벤트 루프 실행
        else:
            print("로그인 요청 실패")

    def login_event(self, err_code):
        if err_code == 0:
            print("로그인 성공")
            self.is_connected = True
        else:
            print(f"로그인 실패: {err_code}")
            self.is_connected = False
        self.login_event_loop.exit()

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next_key):
        if rqname == self.current_rqname:
            print(f" 올바른 TR 데이터 수신: {rqname}")
            def get_numeric_data(field_name):
                raw_data = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, field_name).strip()
                return str(abs(int(raw_data))) if raw_data and raw_data.replace('-', '').isdigit() else "0"

            currentPrice = get_numeric_data("현재가")
            highPrice = get_numeric_data("고가")
            lowPrice = get_numeric_data("저가")
            openingPrice = get_numeric_data("시가")
            change = get_numeric_data("전일대비")
            changeRate = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "등락율").strip()
            previousClose = get_numeric_data("전일종가") # 전일종가 추가

            self.tr_data = {
                "name": name,
                "marketCap": marketCap,
                "per": per,
                "currentPrice": currentPrice,
                "highPrice": highPrice,
                "lowPrice": lowPrice,
                "openingPrice": openingPrice,
                "change": change,
                "changeRate": changeRate,
                "previousClose": previousClose, # 전일종가 추가
            }
            self.tr_received_event.set()
            print(f"TR Data: {self.tr_data}")

    def get_stock_basic_info(self, stock_code):
        self.tr_data = None
        self.tr_received_event.clear()
        self.current_rqname = "주식기본정보요청"
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        ret = self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", self.current_rqname, "OPT10001", 0, "0101")
        
        if ret != 0:
            print(f"CommRqData for {stock_code} failed. ret: {ret}")
            return None

        if not self.tr_received_event.wait(timeout=5):
            print(f"Timeout waiting for TR data for {stock_code}")
            return None

        return self.tr_data

    def get_theme_group_list(self):
        themes_str = self.ocx.dynamicCall("GetThemeGroupList(int)", 1)
        themes_split = themes_str.split(';')
        return [{"theme_code": themes_split[i], "theme_name": themes_split[i+1]} for i in range(0, len(themes_split) - 1, 2)]

    def get_theme_group_code(self, theme_code):
        numeric_theme_code = theme_code.split('|')[0]
        stock_codes_str = self.ocx.dynamicCall("GetThemeGroupCode(QString)", numeric_theme_code)
        if stock_codes_str:
            return stock_codes_str.split('|')[:-1] # 마지막 빈 문자열 제거
        return []

    async def load_all_company_data(self):
        print("모든 기업 정보 로딩을 시작합니다...")
        if not self.is_connected:
            print("API가 연결되지 않아 데이터를 로드할 수 없습니다.")
            return
        try:
            themes = self.get_theme_group_list()
            for theme in themes[:10]:
                try:
                    theme_code = theme["theme_code"]
                    theme_name = theme["theme_name"]
                    print(f"Processing theme: {theme_name} ({theme_code})")
                    
                    stock_codes = self.get_theme_group_code(theme_code)
                    await asyncio.sleep(0.4) # TR 요청 간 딜레이 (0.2초 이상 권장)

                    for code in stock_codes:
                        try:
                            if any(company['stockCode'] == code for company in self.all_companies_data):
                                continue

                            print(f"  - Fetching info for stock: {code}")
                            stock_info = self.get_stock_basic_info(code)
                            await asyncio.sleep(0.4)
                            
                            if stock_info:
                                self.all_companies_data.append({
                                    "theme": theme_name,
                                    "stockCode": code,
                                    **stock_info
                                })
                        except Exception as e:
                            print(f"Error processing stock {code} in theme {theme_name}: {e}")
                            continue
                except Exception as e:
                    print(f"Error processing theme {theme.get('theme_name', 'N/A')}: {e}")
                    continue
            
            print(f"총 {len(self.all_companies_data)}개의 기업 정보 로딩 완료!")
            self.save_data_to_file() # 데이터 로딩 완료 후 파일에 저장
            self.data_loaded_event.set() # 데이터 로딩 완료 이벤트 설정

        except Exception as e:
            print(f"An unexpected error occurred during data loading: {e}")

    def _on_receive_real_data(self, stock_code, real_type, real_data):
        """키움 API로부터 실시간 데이터를 수신했을 때 호출됩니다."""
        if real_type == "주식체결": # 주식체결 데이터 (현재가, 등락률 등)
            current_price = self.ocx.dynamicCall("GetCommRealData(QString, int)", stock_code, 10).strip() # 현재가
            change_rate = self.ocx.dynamicCall("GetCommRealData(QString, int)", stock_code, 12).strip() # 등락률
            change_price = self.ocx.dynamicCall("GetCommRealData(QString, int)", stock_code, 11).strip() # 전일대비
            
            # 부호 제거 및 숫자 변환
            current_price = str(abs(int(current_price))) if current_price and current_price.replace('-', '').isdigit() else "0"
            change_price = str(abs(int(change_price))) if change_price and change_price.replace('-', '').isdigit() else "0"
            
            real_time_info = {
                "stockCode": stock_code,
                "currentPrice": current_price,
                "changeRate": change_rate,
                "change": change_price,
                "realType": real_type,
                "timestamp": time.time() # 데이터 수신 시간
            }
            
            # 큐에 데이터 추가 (FastAPI 스레드에서 처리할 수 있도록)
            asyncio.run_coroutine_threadsafe(self.real_data_queue.put(real_time_info), asyncio.get_event_loop())
            # print(f"Real-time data for {stock_code}: {real_time_info}")

    def set_real_reg(self, screen_no, stock_codes, real_type, opt_type):
        """실시간 시세 등록"""
        ret = self.ocx.dynamicCall("SetRealReg(QString, QString, QString, QString)", screen_no, stock_codes, real_type, opt_type)
        if ret == 0:
            print(f"실시간 시세 등록 성공: {stock_codes}")
        else:
            print(f"실시간 시세 등록 실패: {stock_codes}, ret: {ret}")

    def disconnect_real_data(self, screen_no, stock_codes):
        """실시간 시세 해제"""
        self.ocx.dynamicCall("DisconnectRealData(QString)", screen_no)
        print(f"실시간 시세 해제: {stock_codes}")


# --- 전역 키움 API 인스턴스 ---
kiwoom_api_instance: KiwoomAPI = None

# --- FastAPI 엔드포인트 정의 ---
@app.get("/")
def read_root():
    return {"message": "Kiwoom API Gateway is running."}

@app.get("/api/all-companies")
async def get_all_companies():
    # 먼저 캐시된 데이터를 로드 시도
    if kiwoom_api_instance.load_data_from_file():
        return {"success": True, "data": kiwoom_api_instance.all_companies_data}

    # 캐시된 데이터가 없거나 유효하지 않으면, API에서 새로 로드
    if not kiwoom_api_instance.data_loaded_event.is_set():
        print("캐시된 데이터가 없거나 유효하지 않아 API에서 데이터를 로드합니다.")
        # load_all_company_data는 startup 이벤트에서 이미 호출되므로, 여기서는 완료될 때까지 대기
        await kiwoom_api_instance.data_loaded_event.wait() 

    try:
        if kiwoom_api_instance and kiwoom_api_instance.is_connected:
            if not kiwoom_api_instance.all_companies_data:
                return {"success": True, "data": [], "message": "Data is still being loaded. Please try again in a moment."}
            return {"success": True, "data": kiwoom_api_instance.all_companies_data}
        return {"success": False, "error": "Kiwoom API is not connected."}
    except Exception as e:
        print(f"Error in get_all_companies: {e}")
        return {"success": False, "error": f"An internal server error occurred: {e}"}

@app.websocket("/ws/realtime-price")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    print(f"WebSocket connected: {websocket.client}")
    try:
        while True:
            message = await websocket.receive_text()
            print(f"Received message from client: {message}")
            try:
                msg_data = json.loads(message)
                if msg_data.get("type") == "subscribe":
                    stock_codes_to_subscribe = msg_data.get("stockCodes", [])
                    for code in stock_codes_to_subscribe:
                        if code not in subscribed_real_codes:
                            kiwoom_api_instance.set_real_reg("0001", code, "10;11;12;30", "0") # 10:현재가, 11:전일대비, 12:등락률, 30:거래량
                            subscribed_real_codes.add(code)
                            print(f"Subscribed to real-time data for: {code}")
                elif msg_data.get("type") == "unsubscribe":
                    stock_codes_to_unsubscribe = msg_data.get("stockCodes", [])
                    for code in stock_codes_to_unsubscribe:
                        if code in subscribed_real_codes:
                            # Note: Kiwoom API's DisconnectRealData is usually for a screen_no, not individual codes.
                            # For simplicity, we'll just remove from our internal set.
                            # A more robust solution might involve managing screen_no per client or per code.
                            subscribed_real_codes.remove(code)
                            print(f"Unsubscribed from real-time data for: {code}")

            except json.JSONDecodeError:
                print(f"Invalid JSON received: {message}")
            except Exception as e:
                print(f"Error processing client message: {e}")

    except WebSocketDisconnect:
        connected_websockets.remove(websocket)
        print(f"WebSocket disconnected: {websocket.client}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # 클라이언트 연결이 끊어지면 해당 클라이언트가 구독했던 종목 해제 로직 필요 (복잡하므로 일단 생략)
        pass

async def real_data_broadcaster():
    """큐에서 실시간 데이터를 가져와 모든 연결된 웹소켓 클라이언트에게 브로드캐스트합니다."""
    while True:
        real_time_data = await real_data_queue.get()
        message = json.dumps({"type": "realtime", "data": real_time_data})
        # print(f"Broadcasting: {message}")
        for websocket in list(connected_websockets): # set은 반복 중 변경될 수 있으므로 list로 복사
            try:
                await websocket.send_text(message)
            except RuntimeError as e:
                # WebSocket is closed, remove it
                print(f"Error sending to websocket (likely closed): {e}")
                connected_websockets.discard(websocket)
            except Exception as e:
                print(f"Error broadcasting to websocket {websocket.client}: {e}")

# --- FastAPI 서버 실행 함수 (별도 스레드에서 실행) ---
def run_fastapi_server():
    # 이 스레드에 새로운 asyncio 이벤트 루프를 생성하고 설정합니다.
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    @app.on_event("startup")
    async def startup_event():
        asyncio.create_task(real_data_broadcaster())
        print("Real-time data broadcaster started.")
        
        # 키움 API 연결이 완료될 때까지 기다립니다.
        while not kiwoom_api_instance.is_connected:
            await asyncio.sleep(0.1) # 0.1초마다 확인
        
        # 모든 기업 정보 로딩을 비동기로 시작
        asyncio.create_task(kiwoom_api_instance.load_all_company_data())
    
    # 명시적으로 생성한 이벤트 루프를 Uvicorn에 전달합니다.
    # uvicorn.run(app, host="0.0.0.0", port=8000, loop=loop) # 기존 라인 주석 처리
    loop.run_until_complete(uvicorn.run(app, host="0.0.0.0", port=8000))

# --- 메인 실행 로직 ---
if __name__ == '__main__':
    # 1. FastAPI 서버를 별도 스레드에서 실행
    fastapi_thread = threading.Thread(target=run_fastapi_server)
    fastapi_thread.daemon = True # 메인 스레드 종료 시 함께 종료되도록 설정
    fastapi_thread.start()

    # 2. 메인 스레드에서 PyQt 애플리케이션 및 키움 API 실행
    app_qt = QApplication(sys.argv)
    kiwoom_api_instance = KiwoomAPI(real_data_queue) # 큐를 KiwoomAPI 인스턴스에 전달
    kiwoom_api_instance.login()
    
    if kiwoom_api_instance.is_connected:
        print("키움 API 연결 성공. FastAPI 서버가 8000번 포트에서 실행 중입니다.")
        # load_all_company_data는 이제 startup 이벤트에서 비동기로 호출됩니다.
    else:
        print("키움 API 연결 실패. 서버를 종료합니다.")
        sys.exit()

    sys.exit(app_qt.exec_())