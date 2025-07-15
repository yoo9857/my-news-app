import os
import time
import json
import pika
import psycopg2
from psycopg2.extras import execute_values

def get_db_connection():
    while True:
        try:
            conn = psycopg2.connect(
                dbname=os.getenv("POSTGRES_DB"),
                user=os.getenv("POSTGRES_USER"),
                password=os.getenv("POSTGRES_PASSWORD"),
                host=os.getenv("POSTGRES_HOST"),
                port=os.getenv("POSTGRES_PORT")
            )
            return conn
        except psycopg2.OperationalError as e:
            print(f"PostgreSQL 연결 실패: {e}. 5초 후 재시도합니다.")
            time.sleep(5)

def upsert_stocks(conn, stocks_list):
    if not stocks_list:
        return

    with conn.cursor() as cur:
        values = [
            (s.get('code'), s.get('name'), s.get('market'))
            for s in stocks_list
        ]
        
        upsert_query = """
        INSERT INTO stocks (code, name, market)
        VALUES %s
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            market = EXCLUDED.market,
            last_updated = NOW();
        """
        execute_values(cur, upsert_query, values)
        conn.commit()
        print(f"Successfully upserted {len(stocks_list)} stock items.")

def upsert_news_articles(conn, articles):
    if not articles:
        return

    with conn.cursor() as cur:
        keys = ['title', 'url', 'source', 'published_at', 'sentiment_score', 'sentiment_label']
        for article in articles:
            for key in keys:
                article.setdefault(key, None)
        
        values = [[article[key] for key in keys] for article in articles]

        upsert_query = """
        INSERT INTO news_articles (title, url, source, published_at, sentiment_score, sentiment_label)
        VALUES %s
        ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            source = EXCLUDED.source,
            published_at = EXCLUDED.published_at,
            sentiment_score = EXCLUDED.sentiment_score,
            sentiment_label = EXCLUDED.sentiment_label;
        """
        execute_values(cur, upsert_query, values)
        conn.commit()
        print(f"Successfully upserted {len(articles)} news articles.")

def upsert_financials(conn, financials_list):
    if not financials_list:
        return
    
    with conn.cursor() as cur:
        values = [
            (
                f.get('code'), 
                f.get('year'), 
                f.get('quarter'), 
                f.get('revenue'), 
                f.get('operating_profit'), 
                f.get('net_income')
            )
            for f in financials_list
        ]

        upsert_query = """
        INSERT INTO financial_statements (code, year, quarter, revenue, operating_profit, net_income)
        VALUES %s
        ON CONFLICT (code, year, quarter) DO UPDATE SET
            revenue = EXCLUDED.revenue,
            operating_profit = EXCLUDED.operating_profit,
            net_income = EXCLUDED.net_income;
        """
        execute_values(cur, upsert_query, values)
        conn.commit()
        print(f"Successfully upserted {len(financials_list)} financial statements.")

def upsert_etfs(conn, etf_data_list):
    if not etf_data_list:
        return
    
    with conn.cursor() as cur:
        # Assuming etf_data_list contains dictionaries with 'code', 'name', 'price', etc.
        # Adjust column names and data types as per your 'etfs' table schema
        values = [
            (e.get('code'), e.get('name'), e.get('price')) # Example fields
            for e in etf_data_list
        ]

        upsert_query = """
        INSERT INTO etfs (code, name, price)
        VALUES %s
        ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            updated_at = NOW();
        """
        execute_values(cur, upsert_query, values)
        conn.commit()
        print(f"Successfully upserted {len(etf_data_list)} ETF items.")

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

    # 큐 핸들러 맵핑
    queue_handlers = {
        'stock_data_queue': upsert_stocks,
        'news_analyzed_queue': upsert_news_articles,
        'dart_data_queue': upsert_financials,
        'etf_data_queue': upsert_etfs
    }

    def callback(ch, method, properties, body):
        queue_name = method.routing_key
        handler = queue_handlers.get(queue_name)
        if not handler:
            print(f"Warning: No handler for queue {queue_name}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return

        try:
            data = json.loads(body)
            conn = get_db_connection()
            handler(conn, data)
            conn.close()
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"Error processing message from {queue_name}: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # 각 큐에 대해 구독 설정
    for queue_name in queue_handlers:
        channel.queue_declare(queue=queue_name, durable=True)
        channel.basic_consume(queue=queue_name, on_message_callback=callback)

    print('[!] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    main()