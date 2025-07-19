import redis
import json
import os
import time
from flask import Flask, jsonify

# --- Flask 애플리케이션 설정 ---
app = Flask(__name__)

# --- Redis 클라이언트 설정 ---
# StockWorker와 동일한 Redis 인스턴스에 연결합니다.
def get_redis_client(retries=5, delay=5):
    redis_host = os.getenv("REDIS_HOST", "redis")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    for i in range(retries):
        try:
            client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True)
            client.ping()
            print(f"✅ 웹 앱이 Redis에 성공적으로 연결되었습니다. ({redis_host}:{redis_port})")
            return client
        except redis.exceptions.ConnectionError as e:
            print(f"🔥 웹 앱의 Redis 연결 실패 (시도 {i+1}/{retries}): {e}")
            if i < retries - 1:
                time.sleep(delay)
    print("🔥 모든 Redis 연결 시도 실패.")
    return None

redis_client = get_redis_client()

# --- API 엔드포인트 ---

@app.route('/api/stocks')
def get_stocks():
    """
    '/api/stocks' 경로로 요청이 오면 Redis에서 주식 데이터를 가져와 JSON 형태로 반환합니다.
    이 데이터는 StockWorker가 'stock_details:all' 키에 저장한 데이터입니다.
    """
    if not redis_client:
        return jsonify({"error": "Redis connection failed. The server is unable to connect to the data store."}), 503

    try:
        stock_data_json = redis_client.get('stock_details:all')
        if stock_data_json:
            # JSON 문자열을 파이썬 객체로 변환하여 반환
            stock_data = json.loads(stock_data_json)
            return jsonify(stock_data)
        else:
            # 데이터가 아직 준비되지 않았을 경우
            return jsonify({"error": "Stock data not available yet. Please wait for the worker to finish."}), 404
    except redis.exceptions.ConnectionError as e:
        print(f"🔥 API 요청 처리 중 Redis 연결 오류: {e}")
        return jsonify({"error": "Failed to communicate with data store."}), 503
    except Exception as e:
        print(f"🔥 /api/stocks 처리 중 예외 발생: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/news')
def get_news():
    """
    '/api/news' 경로로 요청이 오면 Redis에서 뉴스 데이터를 가져와 JSON 형태로 반환합니다.
    이 엔드포인트가 제대로 작동하려면, 뉴스 데이터를 수집하여 
    'news_articles:latest'와 같은 키로 Redis에 저장하는 'NewsWorker'가 필요합니다.
    """
    if not redis_client:
        return jsonify({"error": "Redis connection failed. The server is unable to connect to the data store."}), 503

    try:
        news_data_json = redis_client.get('news_articles:latest')
        if news_data_json:
            news_data = json.loads(news_data_json)
            return jsonify(news_data)
        else:
            return jsonify({"error": "News data not available yet. The news worker may not have run yet."}), 404
    except redis.exceptions.ConnectionError as e:
        print(f"🔥 API 요청 처리 중 Redis 연결 오류: {e}")
        return jsonify({"error": "Failed to communicate with data store."}), 503
    except Exception as e:
        print(f"🔥 /api/news 처리 중 예외 발생: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    # Flask 앱을 0.0.0.0 호스트와 5001 포트에서 실행합니다.
    # 웹 브라우저나 다른 서비스에서 접근할 수 있습니다.
    app.run(host='0.0.0.0', port=5001, debug=True)