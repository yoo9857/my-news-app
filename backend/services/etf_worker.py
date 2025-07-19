import os
import time
import json
import pika
import requests
from bs4 import BeautifulSoup

def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(os.getenv("RABBITMQ_USER"), os.getenv("RABBITMQ_PASSWORD"))
    while True:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv("RABBITMQ_HOST"), credentials=credentials))
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            print(f"RabbitMQ 연결 실패: {e}. 5초 후 재시도합니다.")
            time.sleep(5)

def main():
    connection = get_rabbitmq_connection()
    channel = connection.channel()
    channel.queue_declare(queue='etf_data_queue', durable=True)

    # Naver Finance ETF URL
    url = "https://finance.naver.com/sise/etf.naver"
    headers = {'User-Agent': 'Mozilla/5.0'}

    while True:
        print("네이버 금융 ETF 정보 크롤링을 시작합니다...")
        try:
            response = requests.get(url, headers=headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            etf_rows = soup.select('#etfItemTable > tr[onmouseover]')

            etf_data = []
            for row in etf_rows[:10]: # For now, only fetch first 10 for simplicity
                cols = row.select('td')
                if len(cols) < 2: continue
                
                code = cols[0].text.strip()
                name = cols[1].find('a').text.strip()
                
                etf_data.append({
                    'type': 'etf_info',
                    'payload': {'code': code, 'name': name}
                })
                # In a real scenario, you would also crawl the holding details page
                # and append 'etf_holdings' data.

            if etf_data:
                channel.basic_publish(
                    exchange='',
                    routing_key='etf_data_queue',
                    body=json.dumps(etf_data),
                    properties=pika.BasicProperties(delivery_mode=2)
                )
                print(f"{len(etf_data)}개의 ETF 정보를 전송했습니다.")

        except Exception as e:
            print(f"ETF 크롤링 중 오류 발생: {e}")
        
        print("24시간 후 다시 수집합니다.")
        time.sleep(86400)

if __name__ == '__main__':
    main()
