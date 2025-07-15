import os
import redis
import json
import time
import uuid
import logging
from logging.handlers import RotatingFileHandler

# --- 로깅 설정 ---
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "stock_worker.log")

worker_logger = logging.getLogger("StockWorker")
worker_logger.setLevel(logging.INFO)
handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
worker_logger.addHandler(handler)
worker_logger.addHandler(logging.StreamHandler())

class StockWorker:
    def __init__(self):
        self.redis_client = self._connect_to_redis()

    def _connect_to_redis(self):
        redis_host = os.getenv("REDIS_HOST", "redis")
        redis_port = int(os.getenv("REDIS_PORT", 6379))
        while True:
            try:
                client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True)
                client.ping()
                worker_logger.info(f"✅ Redis에 성공적으로 연결되었습니다. ({redis_host}:{redis_port})")
                return client
            except redis.exceptions.ConnectionError as e:
                worker_logger.error(f"🔥 Redis 연결 실패: {e}. 5초 후 재시도합니다.")
                time.sleep(5)

    def request_kiwoom_tr(self, request_type, payload=None, timeout=60):
        request_id = str(uuid.uuid4())
        message = {
            "request_id": request_id,
            "request_type": request_type,
            "payload": payload or {}
        }
        
        response_key = f'kiwoom_tr_response:{request_id}'
        
        worker_logger.info(f"Sent TR request '{request_type}' with ID {request_id} to Redis.")
        self.redis_client.publish('kiwoom_tr_request', json.dumps(message))
        
        worker_logger.info(f"Waiting for response in personal mailbox: {response_key}")
        response_tuple = self.redis_client.blpop(response_key, timeout=timeout)
        
        if response_tuple is None:
            worker_logger.error(f"TR request {request_id} timed out after {timeout} seconds.")
            return None
        
        response_data = json.loads(response_tuple[1])
        worker_logger.info(f"Received TR response for request ID {request_id}.")
        return response_data.get('data')

    def update_all_stock_details(self):
        worker_logger.info("--- Starting full stock data update cycle ---")
        
        all_codes_data = self.request_kiwoom_tr('get_all_stock_codes', timeout=120)
        if not all_codes_data:
            worker_logger.error("Failed to get all stock codes from Kiwoom API. Retrying in 1 hour.")
            time.sleep(3600)
            return

        all_codes = all_codes_data.get('kospi_codes', []) + all_codes_data.get('kosdaq_codes', [])
        total_stocks = len(all_codes)
        worker_logger.info(f"Found {total_stocks} total stocks. Fetching details...")
        
        all_stock_data = []
        for i, code in enumerate(all_codes):
            worker_logger.info(f" -> [{i+1}/{total_stocks}] Fetching details for {code}...")
            details = self.request_kiwoom_tr('get_stock_details', {'code': code}, timeout=30)
            
            if details:
                all_stock_data.append(details)
            else:
                worker_logger.warning(f"Could not fetch details for {code}. Skipping.")
            
            # <<< 여기가 핵심 변경 사항입니다! >>>
            # Kiwoom의 시간당 TR 요청 제한을 피하기 위해 3.6초 대기합니다.
            # 이로 인해 전체 데이터 수집에 약 4시간이 소요될 수 있습니다. (4139 * 3.6 / 3600)
            time.sleep(3.6)

        if all_stock_data:
            try:
                # 데이터를 파일 대신 Redis에 저장합니다. 웹 애플리케이션에서 쉽게 접근할 수 있습니다.
                redis_key = "stock_details:all"
                self.redis_client.set(redis_key, json.dumps(all_stock_data, ensure_ascii=False))
                worker_logger.info(f"✅ Successfully updated and saved {len(all_stock_data)} stock details to Redis key '{redis_key}'")
            except Exception as e:
                worker_logger.error(f"🔥 Failed to save company data to Redis: {e}")

        worker_logger.info("--- Full stock data update cycle finished ---")
        return True # 성공적으로 완료되었음을 반환

    def run(self):
        worker_logger.info("--- Starting Stock Detail Worker ---")
        # 파일 시스템 대신 Redis에 데이터가 있는지 확인하여 최초 실행 여부를 결정합니다.
        redis_key = "stock_details:all"
        if not self.redis_client.exists(redis_key):
             worker_logger.info("No cached data found in Redis. Starting initial full data collection.")
             self.update_all_stock_details()
        else:
             worker_logger.info("Cached data already exists in Redis. Skipping initial collection.")
        
        worker_logger.info("Worker has completed its initial task and will now idle.")
        # 필요 시 주기적인 업데이트 로직을 여기에 추가할 수 있습니다.
        # while True:
        #     time.sleep(60 * 60 * 24) # 24시간 대기
        #     self.update_all_stock_details()


if __name__ == "__main__":
    worker = StockWorker()
    worker.run()
