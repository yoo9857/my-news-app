import sys
import threading
import time
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop

# --- FastAPI 앱 생성 ---
app = FastAPI()

# --- CORS 미들웨어 설정 ---
# Next.js 개발 서버 및 ngrok 배포 주소로부터의 요청을 허용합니다.
origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    # Add your ngrok URL or future deployment URL here
    # e.g., "https://<your-random-string>.ngrok-free.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r'https://.*\.ngrok-free\.app', # Allows any ngrok subdomain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 키움 API 클래스 ---
class KiwoomAPI:
    def __init__(self):
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.ocx.OnEventConnect.connect(self.login_event)
        self.ocx.OnReceiveTrData.connect(self.receive_tr_data)
        
        self.login_event_loop = QEventLoop()
        self.tr_event_loop = QEventLoop()
        
        self.tr_data = None
        self.is_connected = False
        self.all_companies_data = []
        self.current_rqname = "" # 어떤 TR 요청인지 추적하기 위한 변수

    def login(self):
        ret = self.ocx.dynamicCall("CommConnect()")
        if ret == 0:
            print("로그인 요청 성공")
            self.login_event_loop.exec_()
        else:
            print("로그인 요청 실패")

    def login_event(self, err_code):
        if err_code == 0:
            print("로그인 성공")
            self.is_connected = True
        else:
            print(f"로그인 실패: {err_code}")
        self.login_event_loop.exit()

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next_key):
        # 현재 대기중인 TR 요청과 동일한 응답일 때만 처리
        if rqname == self.current_rqname:
            print(f" 올바른 TR 데이터 수신: {rqname}")
            if rqname == "주식기본정보요청":
                name = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "종목명").strip()
                marketCap = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "시가총액").strip()
                per = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "PER").strip()
                currentPrice_raw = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "현재가").strip()
                currentPrice = str(abs(int(currentPrice_raw))) if currentPrice_raw and currentPrice_raw.replace('-', '').isdigit() else "0"
                
                self.tr_data = {
                    "name": name,
                    "marketCap": marketCap,
                    "per": per,
                    "currentPrice": currentPrice,
                }
            
            # 데이터 처리가 끝났으므로 이벤트 루프 종료
            self.tr_event_loop.exit()

    def get_stock_basic_info(self, stock_code):
        self.tr_data = None
        self.current_rqname = "주식기본정보요청" # 요청 이름 설정
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        ret = self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", self.current_rqname, "OPT10001", 0, "0101")
        
        if ret != 0:
            print(f"CommRqData for {stock_code} failed. ret: {ret}")
            return None

        self.tr_event_loop.exec_() # 이벤트 루프 실행
        return self.tr_data

    def get_theme_group_list(self):
        themes_raw = self.ocx.dynamicCall("GetThemeGroupList(int)", 1)
        themes_split = themes_raw.split(';')
        return [{"theme_code": themes_split[i], "theme_name": themes_split[i+1]} for i in range(0, len(themes_split) - 1, 2)]

    def get_theme_group_code(self, theme_code):
        """특정 테마에 속한 종목 코드 목록 반환 (API 직접 호출)"""
        # theme_code 형식: "140|2차전지_완제품" -> "140"만 추출
        numeric_theme_code = theme_code.split('|')[0]
        stock_codes_str = self.ocx.dynamicCall("GetThemeGroupCode(QString)", numeric_theme_code)
        if stock_codes_str:
            return [code.strip() for code in stock_codes_str.split(';') if code.strip()]
        return []

    def load_all_company_data(self):
        """서버 시작 시 모든 기업 정보를 미리 로드하여 캐싱합니다."""
        print("모든 기업 정보 로딩을 시작합니다...")
        if not self.is_connected:
            print("API가 연결되지 않아 데이터를 로드할 수 없습니다.")
            return

        themes = self.get_theme_group_list()
        
        # 여기 숫자를 조절하여 가져올 테마 수를 제한할 수 있습니다.
        # 전체를 가져오려면 [:5] 부분을 삭제하세요.
        for theme in themes[:10]: # 테스트를 위해 10개 테마로 제한
            theme_code = theme["theme_code"]
            theme_name = theme["theme_name"]
            print(f"Processing theme: {theme_name}")
            
            stock_codes = self.get_theme_group_code(theme_code)
            time.sleep(0.4) # TR 요청 간 딜레이 (0.2초 이상 권장)

            for code in stock_codes:
                # 중복 추가 방지
                if any(company['stockCode'] == code for company in self.all_companies_data):
                    continue

                print(f"  - Fetching info for stock: {code}")
                stock_info = self.get_stock_basic_info(code)
                time.sleep(0.4) # TR 요청 간 딜레이
                
                if stock_info:
                    self.all_companies_data.append({
                        "theme": theme_name,
                        "stockCode": code,
                        **stock_info
                    })
        
        print(f"총 {len(self.all_companies_data)}개의 ��업 정보 로딩 완료!")


# --- 전역 키움 API 인스턴스 ---
kiwoom_api_instance = None

# --- FastAPI 엔드포인트 정의 ---
@app.get("/")
def read_root():
    return {"message": "Kiwoom API Gateway is running."}

@app.get("/api/all-companies")
def get_all_companies():
    """미리 캐싱된 모든 기업 정보를 반환합니다."""
    if kiwoom_api_instance and kiwoom_api_instance.is_connected:
        if not kiwoom_api_instance.all_companies_data:
            return {"success": True, "data": [], "message": "Data is still being loaded. Please try again in a moment."}
        return {"success": True, "data": kiwoom_api_instance.all_companies_data}
    return {"success": False, "error": "Kiwoom API is not connected."}


# --- FastAPI 서버 실행 함수 (별도 스레드에서 실행) ---
def run_fastapi_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

# --- 메인 실행 로직 ---
if __name__ == '__main__':
    # 1. FastAPI 서버를 백그라운드 스레드에서 시작
    fastapi_thread = threading.Thread(target=run_fastapi_server)
    fastapi_thread.daemon = True
    fastapi_thread.start()

    # 2. 메인 스레드에서 PyQt 애플리케이션 및 키움 API 실행
    app_qt = QApplication(sys.argv)
    kiwoom_api_instance = KiwoomAPI()
    kiwoom_api_instance.login()
    
    if kiwoom_api_instance.is_connected:
        print("키움 API 연결 성공. FastAPI 서버가 8000번 포트에서 실행 중입니다.")
        # 로그인 성공 후, 백그라운드에서 데이터 로딩 시작
        data_load_thread = threading.Thread(target=kiwoom_api_instance.load_all_company_data)
        data_load_thread.daemon = True
        data_load_thread.start()
    else:
        print("키움 API 연결 실패. 서버를 종료합니다.")
        sys.exit()

    sys.exit(app_qt.exec_())

