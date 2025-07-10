import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QAxContainer import QAxWidget
from PyQt5.QtCore import QEventLoop
import socketio
import threading
import time
import os

# --- Socket.IO 클라이언트 설정 ---
sio = socketio.Client()

# --- 키움 API 클래스 ---
kiwoom_api_instance = None

class KiwoomAPI:
    def __init__(self):
        self.ocx = QAxWidget("KHOPENAPI.KHOpenAPICtrl.1")
        self.ocx.OnEventConnect.connect(self.login_event)
        self.ocx.OnReceiveTrData.connect(self.receive_tr_data)
        self.ocx.OnReceiveRealData.connect(self.receive_real_data)

        self.opt10001_event_loop = QEventLoop()
        self.opt10001_data = None
        self.is_connected = False
        self.all_companies_data = []

    def login(self):
        ret = self.ocx.dynamicCall("CommConnect()")
        if ret == 0: print("로그인 요청 성공")
        else: print("로그인 요청 실패")

    def login_event(self, err_code):
        if err_code == 0:
            print("로그인 성공")
            self.is_connected = True
            
            # Test GetMasterCodeName immediately after login
            test_code_after_login = "005930" # Samsung Electronics
            test_name_after_login = self.ocx.dynamicCall("GetMasterCodeName(QString)", test_code_after_login)
            print(f"Debug: Test GetMasterCodeName after login for {test_code_after_login}: '{test_name_after_login}'")

            self.get_and_send_all_themes()
            self.register_real_data_for_major_stocks()
        else:
            print(f"로그인 실패: {err_code}")

    def get_and_send_all_themes(self):
        print("테마 및 기업 목록 가져오기를 시작합니다...")
        self.all_companies_data = []
        theme_list = self.get_theme_group_list()
        
        # Test GetMasterCodeName with a known stock code
        test_code = "005930" # Samsung Electronics
        test_name = self.ocx.dynamicCall("GetMasterCodeName(QString)", test_code)
        print(f"Debug: Test GetMasterCodeName for {test_code}: '{test_name}'")

        # theme_list = theme_list[:5] # Removed to get all themes

        for theme_code, theme_name in theme_list:
            time.sleep(1.0)
            print(f"테마 '{theme_name}'의 종목들을 가져오는 중...")
            stock_codes_in_theme = self.get_theme_group_code(theme_code)

            if not stock_codes_in_theme: # 종목 코드가 없으면 다음 테마로 건너뛰기
                print(f"테마 '{theme_name}'에 해당하는 종���이 없습니다. 건너킵니다.")
                continue

            # Use a set to track unique stock codes across all themes to avoid duplicates
            # This set should be initialized once per data collection cycle, not per theme.
            # For now, we'll keep it here and ensure the check is done before appending.

            for code in stock_codes_in_theme:
                # Check if the stock code has already been added to all_companies_data
                if any(company['stockCode'] == code for company in self.all_companies_data):
                    print(f"종목코드 {code}는 이미 수집된 정보입니다. 건너뜁니다.")
                    continue

                print(f"종목코드 {code}에 대한 상세 정보 가져오는 중...")
                stock_info = self.get_stock_basic_info(code)
                
                if stock_info:
                    self.all_companies_data.append({
                        "theme": theme_name,
                        "name": stock_info.get("name", code),
                        "stockCode": code,
                        "reason": "",
                        "bull": "",
                        "bear": "",
                        "marketCap": stock_info.get("marketCap", ""),
                        "per": stock_info.get("per", ""),
                        "currentPrice": stock_info.get("currentPrice", ""),
                        "openingPrice": stock_info.get("openingPrice", ""),
                        "highPrice": stock_info.get("highPrice", ""),
                        "lowPrice": stock_info.get("lowPrice", ""),
                        "change": stock_info.get("change", ""),
                        "changeRate": stock_info.get("changeRate", ""),
                        "marketCapRank": "",
                    })
                else:
                    print(f"종목코드 {code}에 대한 상세 정보를 가져오지 못했습니다. 종목코드만 추가합니다.")
                    self.all_companies_data.append({
                        "theme": theme_name,
                        "name": code,
                        "stockCode": code,
                        "reason": "",
                        "bull": "",
                        "bear": "",
                        "marketCap": "", "marketCapRank": "", "per": "", "currentPrice": "",
                        "openingPrice": "", "highPrice": "", "lowPrice": "", "change": "", "changeRate": "",
                    })
                time.sleep(0.5)
        
        print(f"총 {len(self.all_companies_data)}개의 기업 정보 수집 완료.")
        # The duplicate check is now handled before appending, so this warning should ideally not appear.
        # However, keeping it for verification.
        unique_stock_codes = set(company['stockCode'] for company in self.all_companies_data)
        print(f"Debug: Unique stock codes in all_companies_data: {len(unique_stock_codes)}")
        if len(self.all_companies_data) != len(unique_stock_codes):
            print("Warning: all_companies_data still contains duplicate stock codes after filtering!")
            # Further debug: print duplicate codes if any
            from collections import Counter
            all_codes = [company['stockCode'] for company in self.all_companies_data]
            duplicates = [code for code, count in Counter(all_codes).items() if count > 1]
            print(f"Debug: Duplicate codes found: {duplicates}")

        if sio.connected:
            sio.emit('update_company_list', self.all_companies_data)
            print("수집 완료 후 즉시 기업 목록을 전송했습니다.")

    def get_theme_group_list(self):
        print("Debug: Calling GetThemeGroupList...") # New debug print
        themes_raw = self.ocx.dynamicCall("GetThemeGroupList(int)", 1)
        print("Debug: GetThemeGroupList call returned.") # New debug print
        print(f"Debug: Raw themes from GetThemeGroupList: '{themes_raw}'")
        themes_split = themes_raw.split(';')
        print(f"Debug: Split themes: {themes_split}")
        return [(themes_split[i], themes_split[i+1]) for i in range(0, len(themes_split) - 1, 2)]

    def get_theme_group_code(self, theme_code):
        numeric_theme_code = theme_code.split('|')[0]
        # GetThemeGroupCode는 TR이 아닌 직접 호출 함수입니다.
        stock_codes_str = self.ocx.dynamicCall("GetThemeGroupCode(QString)", numeric_theme_code)
        print(f"Debug: Raw stock_codes_str from GetThemeGroupCode: '{stock_codes_str}'")
        print(f"Debug: Type of stock_codes_str: {type(stock_codes_str)}") # New debug print for type
        if stock_codes_str:
            # Ensure it's a string and remove any leading/trailing whitespace
            cleaned_str = str(stock_codes_str).strip()
            # 반환된 문자열은 세미콜론으로 구분된 종목 코드들입니다.
            codes = [code.strip() for code in cleaned_str.split(';') if code.strip()]
            return codes
        return []

    def receive_tr_data(self, screen_no, rqname, trcode, record_name, next, unused1, unused2, unused3, unused4):
        print(f"receive_tr_data 호출됨 - screen_no: {screen_no}, rqname: {rqname}, trcode: {trcode}, record_name: {record_name}, next: {next}")
        # '테마종목조회' 관련 로직은 get_theme_group_code에서 직접 처리하므로 여기서는 제거합니다.
        # 다른 TR 데이터 처리가 필요한 경우 여기에 추가합니다.
        if rqname == "주식기본정보요청": # OPT10001
            print(f"Debug: Attempting to extract data for {rqname}...")
            name = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "종목명").strip()
            marketCap = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "시가총액").strip()
            per = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "PER").strip()
            currentPrice = str(abs(int(self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "현재가").strip())))
            openingPrice = str(abs(int(self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "시가").strip())))
            highPrice = str(abs(int(self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "고가").strip())))
            lowPrice = str(abs(int(self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "저가").strip())))
            change = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "전일대비").strip()
            changeRate = self.ocx.dynamicCall("GetCommData(QString, QString, int, QString)", trcode, rqname, 0, "등락율").strip()

            print(f"Debug: GetCommData - 종목명: '{name}'")
            print(f"Debug: GetCommData - 시가총액: '{marketCap}'")
            print(f"Debug: GetCommData - PER: '{per}'")
            print(f"Debug: GetCommData - 현재가: '{currentPrice}'")
            print(f"Debug: GetCommData - 시가: '{openingPrice}'")
            print(f"Debug: GetCommData - 고가: '{highPrice}'")
            print(f"Debug: GetCommData - 저가: '{lowPrice}'")
            print(f"Debug: GetCommData - 전일대비: '{change}'")
            print(f"Debug: GetCommData - 등락율: '{changeRate}'")

            stock_info = {
                "name": name,
                "marketCap": marketCap,
                "per": per,
                "currentPrice": currentPrice,
                "openingPrice": openingPrice,
                "highPrice": highPrice,
                "lowPrice": lowPrice,
                "change": change,
                "changeRate": changeRate,
            }
            self.opt10001_data = stock_info
            print(f"Debug: OPT10001 data received for {rqname}: {self.opt10001_data}")
            self.opt10001_event_loop.exit()
        pass # Placeholder for other TR data handling if needed

    def get_stock_basic_info(self, stock_code):
        self.opt10001_data = None # Clear previous data
        self.ocx.dynamicCall("SetInputValue(QString, QString)", "종목코드", stock_code)
        ret = self.ocx.dynamicCall("CommRqData(QString, QString, int, QString)", "주식기본정보요청", "OPT10001", 0, "0101") # Screen No. 0101 for OPT10001
        print(f"Debug: CommRqData for OPT10001 returned: {ret}") # New debug print
        if ret == 0:
            self.opt10001_event_loop.exec_()
            return self.opt10001_data
        return None

    def register_real_data_for_major_stocks(self):
        major_stocks = {'005930': '삼성전자', '000660': 'SK하이닉스', '035420': 'NAVER'}
        success_count = 0
        fail_count = 0
        for code, name in major_stocks.items():
            try:
                # SetRealReg returns 0 on success, other values on failure
                ret = self.ocx.dynamicCall("SetRealReg(QString, QString, QString, QString)", "1000", code, "9001;10;11;12", "0")
                if ret == 0:
                    print(f"실시간 데이터 등록 성공: {name} ({code})")
                    success_count += 1
                else:
                    print(f"실시간 데이터 등록 실패: {name} ({code}), 반환 코드: {ret}")
                    fail_count += 1
            except Exception as e:
                print(f"실시간 데이터 등록 중 예외 발생: {name} ({code}), 오류: {e}")
                fail_count += 1
        print(f"주요 종목 실시간 데이터 등록 완료: 성공 {success_count}개, 실패 {fail_count}개")

    def receive_real_data(self, code, real_type, real_data):
        print(f"⭐️ 실시간 데이터 수신! 종목코드: {code}, 타입: {real_type}") # ⭐️ 디버깅 라인
        current_price = abs(int(self.ocx.dynamicCall("GetCommRealData(QString, int)", code, 10)))
        change = int(self.ocx.dynamicCall("GetCommRealData(QString, int)", code, 11))
        change_rate = float(self.ocx.dynamicCall("GetCommRealData(QString, int)", code, 12))
        
        stock_info = {
            'code': code,
            'name': self.ocx.dynamicCall("GetMasterCodeName(QString)", code),
            'current_price': current_price,
            'change': change,
            'change_rate': change_rate,
            'status': 'positive' if change > 0 else 'negative' if change < 0 else 'neutral'
        }
        print(f"⭐️ 전송할 실시간 정보: {stock_info}") # ⭐️ 디버깅 라인
        if sio.connected:
            sio.emit('real_kiwoom_data', stock_info)

# --- Socket.IO 이벤트 핸들러 ---
@sio.event
def connect():
    print('키움 게이트웨이가 Next.js 백엔드에 연결되었습니다.')
    if kiwoom_api_instance and kiwoom_api_instance.all_companies_data:
        print(f"'{ 'update_company_list'}' 이벤트로 {len(kiwoom_api_instance.all_companies_data)}개 기업 정보 전송 중...")
        sio.emit('update_company_list', kiwoom_api_instance.all_companies_data)
        print("전송 완료.")

@sio.event
def disconnect():
    print('키움 게이트웨이가 Next.js 백엔드에서 연결 해제되었습니다.')

# --- 백그라운드에서 Socket.IO 연결을 관리하는 함수 ---
def run_socketio_client():
    # 환경 변수에서 서버 URL을 가져오고, 없으면 기본값으로 localhost를 사용합니다.
    NEXTJS_BASE_URL = os.getenv('NEXTJS_SERVER_URL', 'http://localhost:3001')
    SOCKET_IO_PATH = 'api/my_socket'
    
    while True:
        try:
            if not sio.connected:
                print(f"Next.js 백엔드({NEXTJS_BASE_URL})에 연결을 시도합니다...")
                sio.connect(NEXTJS_BASE_URL, socketio_path=SOCKET_IO_PATH)
        except socketio.exceptions.ConnectionError as e:
            print(f"연결 오류: {e}. 5초 후 재시도합니다.")
            time.sleep(5)
        except Exception as e:
            print(f"알 수 없는 오류 발생: {e}. 5초 후 재시도합니다.")
            time.sleep(5)

# --- 메인 실행 로직 ---
if __name__ == '__main__':
    socket_thread = threading.Thread(target=run_socketio_client)
    socket_thread.daemon = True
    socket_thread.start()

    app_qt = QApplication(sys.argv)
    kiwoom_api_instance = KiwoomAPI()
    kiwoom_api_instance.login()
    
    app_qt.exec_()