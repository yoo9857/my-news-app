import os
import time
import json
import pika
import psycopg2
import backtrader as bt
import pandas as pd
from datetime import datetime

# --- Backtrader Strategy Definition ---
class SmaCross(bt.Strategy):
    params = (('fast_ma', 10), ('slow_ma', 50))

    def __init__(self):
        self.dataclose = self.datas[0].close
        self.order = None
        self.buyprice = None
        self.buycomm = None

        self.sma_fast = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.fast_ma)
        self.sma_slow = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.slow_ma)

    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            return
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'BUY EXECUTED, Price: {order.executed.price:.2f}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')
                self.buyprice = order.executed.price
                self.buycomm = order.executed.comm
            else: # Sell
                self.log(f'SELL EXECUTED, Price: {order.executed.price:.2f}, Cost: {order.executed.value:.2f}, Comm: {order.executed.comm:.2f}')
            self.bar_executed = len(self)
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            self.log('Order Canceled/Margin/Rejected')
        self.order = None

    def next(self):
        if self.order:
            return

        if not self.position: # not in the market
            if self.sma_fast[0] > self.sma_slow[0]:
                self.log(f'BUY CREATE, {self.dataclose[0]:.2f}')
                self.order = self.buy()
        else:
            if self.sma_fast[0] < self.sma_slow[0]:
                self.log(f'SELL CREATE, {self.dataclose[0]:.2f}')
                self.order = self.sell()

    def log(self, txt, dt=None):
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()} - {txt}')

# --- Database & RabbitMQ ---
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

def run_backtest(strategy_id, stock_code, start_date, end_date, params):
    # NOTE: This part needs a data source. For now, we'll generate dummy data.
    # In a real scenario, this would fetch historical data from Kiwoom/PostgreSQL.
    dates = pd.date_range(start=start_date, end=end_date)
    close_prices = pd.Series(10000 * (1 + (0.001 * pd.Series(range(len(dates)))).cumsum()))
    dummy_data = pd.DataFrame({'open': close_prices, 'high': close_prices, 'low': close_prices, 'close': close_prices, 'volume': 1000}, index=dates)

    data = bt.feeds.PandasData(dataname=dummy_data)

    cerebro = bt.Cerebro()
    cerebro.addstrategy(SmaCross, fast_ma=params.get('fast_ma', 10), slow_ma=params.get('slow_ma', 50))
    cerebro.adddata(data)
    cerebro.broker.setcash(10000000) # Initial capital
    cerebro.broker.setcommission(commission=0.0015)

    print('Starting Portfolio Value: %.2f' % cerebro.broker.getvalue())
    cerebro.run()
    final_value = cerebro.broker.getvalue()
    print('Final Portfolio Value: %.2f' % final_value)

    # Save results to DB
    # ... (implementation to save final_value, sharpe, drawdown etc.)

def main():
    # ... (RabbitMQ connection setup)
    # ... (Listen on a 'backtest_queue')
    print("[*] Backtest worker is waiting for messages.")

if __name__ == '__main__':
    main()
