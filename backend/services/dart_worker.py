import os
import time
import json
import pika
import OpenDartReader
import pandas as pd

API_KEY = os.getenv("OPENDART_API_KEY")
dart = OpenDartReader(API_KEY)

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
    
    # Declare all necessary queues
    channel.queue_declare(queue='dart_data_queue', durable=True)
    channel.queue_declare(queue='stock_data_queue', durable=True)

    print("전체 상장 기업 목록을 수집합니다...")
    try:
        # Use corp_codes() to get the list of all companies
        all_stocks_df = dart.corp_codes
        
        if isinstance(all_stocks_df, pd.DataFrame) and not all_stocks_df.empty:
            print("Fetched columns:", all_stocks_df.columns)
            
            # Filter out companies without a stock code (non-listed)
            all_stocks_df = all_stocks_df.dropna(subset=['stock_code'])
            # Ensure unique stock codes
            all_stocks_df = all_stocks_df.drop_duplicates(subset=['stock_code'])

            # Convert DataFrame to list of dictionaries
            all_stocks_list = all_stocks_df[['corp_code', 'corp_name', 'stock_code']].to_dict('records')
            
            formatted_stocks = [] # Initialize the list
            for s in all_stocks_list:
                # Ensure 'stock_code' is not None before adding
                if pd.isna(s['stock_code']):
                    continue
                formatted_stocks.append({
                    'code': s['stock_code'],  # Use stock_code as the primary code
                    'name': s['corp_name'],
                    # 'market' is not directly available from corp_codes, will be handled in db_saver
                })

            # Publish all stocks to the stock_data_queue
            channel.basic_publish(
                exchange='',
                routing_key='stock_data_queue',
                body=json.dumps(formatted_stocks),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            print(f"{len(formatted_stocks)}개의 기업 정보를 stock_data_queue로 전송했습니다.")
            
            # Use the fetched stock codes for financial data retrieval
            stock_codes_to_fetch = [s['corp_code'] for s in all_stocks_list[:10]] # Limit to 10 for testing

        else:
            print("기업 목록을 DataFrame으로 가져오지 못했습니다. 반환값:", all_stocks_df)
            raise ValueError("Failed to fetch stock list as DataFrame")

    except Exception as e:
        print(f"전체 기업 목록 수집 중 오류 발생: {e}")
        # Fallback to sample codes if fetching all stocks fails
        stock_codes_to_fetch = ['005930', '000660', '035420']

    while True:
        print("DART 재무 정보 수집을 시작합니다...")
        for code in stock_codes_to_fetch:
            try:
                # Fetch annual financial statements with reprt_code
                fs = dart.finstate(code, 2022, reprt_code='11011') # Added reprt_code, changed year to 2022
                if not fs.empty:
                    # Find revenue data
                    revenue_data = fs.loc[fs['account_nm'] == '매출액']
                    if not revenue_data.empty:
                        revenue = int(revenue_data.iloc[0]['thstrm_amount'].replace(',', ''))
                    else:
                        revenue = None

                    # Find operating profit data
                    op_profit_data = fs.loc[fs['account_nm'] == '영업이익']
                    if not op_profit_data.empty:
                        op_profit = int(op_profit_data.iloc[0]['thstrm_amount'].replace(',', ''))
                    else:
                        op_profit = None
                    
                    # Find net income data
                    net_income_data = fs.loc[fs['account_nm'] == '당기순이익']
                    if not net_income_data.empty:
                        net_income = int(net_income_data.iloc[0]['thstrm_amount'].replace(',', ''))
                    else:
                        net_income = None

                    payload = {
                        'code': code,
                        'year': 2023,
                        'quarter': 4, # Assuming annual data is for Q4
                        'revenue': revenue,
                        'operating_profit': op_profit,
                        'net_income': net_income
                    }
                    channel.basic_publish(
                        exchange='',
                        routing_key='dart_data_queue',
                        body=json.dumps([payload]),
                        properties=pika.BasicProperties(delivery_mode=2)
                    )
                    print(f"{code}의 재무 데이터를 전송했습니다.")
                time.sleep(0.5) # API rate limit
            except Exception as e:
                print(f"{code}의 재무 정보 수집 중 오류 발생: {e}")

        print("24시간 후 다시 수집합니다.")
        time.sleep(86400) # Fetch once a day

if __name__ == '__main__':
    main()
