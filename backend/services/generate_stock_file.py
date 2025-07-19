import os
import psycopg
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Define the output path relative to the project root
OUTPUT_DIR = "public/data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "stocks.json")

async def generate_file():
    """
    Connects to the database using psycopg, fetches all stock data, and saves it to a JSON file.
    """
    print("Connecting to the database with psycopg...")
    conn = None
    try:
        # Use the full POSTGRES_URL for connection
        conn_str = os.getenv("POSTGRES_URL")
        if not conn_str:
            raise ValueError("POSTGRES_URL environment variable is not set.")
            
        conn = await psycopg.AsyncConnection.connect(conn_str, autocommit=True)
        print("Database connection successful.")

        print("Fetching stock data...")
        async with conn.cursor() as cur:
            await cur.execute(
                '''
                SELECT 
                    json_agg(
                        json_build_object(
                            'code', code,
                            'name', name,
                            'market', market,
                            'currentPrice', price,
                            'change_rate', COALESCE(change_rate, 0),
                            'volume', COALESCE(volume, 0),
                            'market_cap', COALESCE(market_cap, 0)
                        )
                    )
                FROM (
                    SELECT * FROM stocks ORDER BY market_cap DESC NULLS LAST
                ) as sorted_stocks
                '''
            )
            result = await cur.fetchone()
            stocks_data = result[0] if result and result[0] is not None else []
        
        print(f"Fetched {len(stocks_data)} stock records.")

        # Ensure the output directory exists
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        print(f"Saving data to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(stocks_data, f, ensure_ascii=False, indent=2)
        
        print("Successfully generated stocks.json file.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            await conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(generate_file())

