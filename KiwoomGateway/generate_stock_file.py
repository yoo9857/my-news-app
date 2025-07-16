import os
import asyncpg
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
    Connects to the database, fetches all stock data, and saves it to a JSON file.
    """
    print("Connecting to the database...")
    conn = None
    try:
        conn = await asyncpg.connect(os.getenv("POSTGRES_URL"))
        print("Database connection successful.")

        print("Fetching stock data...")
        stocks = await conn.fetch(
            '''
            SELECT 
                code, 
                name, 
                market, 
                price AS "currentPrice", 
                COALESCE(change_rate, 0) AS change_rate, 
                COALESCE(volume, 0) AS volume, 
                COALESCE(market_cap, 0) AS market_cap
            FROM stocks 
            ORDER BY market_cap DESC NULLS LAST
            '''
        )
        print(f"Fetched {len(stocks)} stock records.")

        # Ensure the output directory exists
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Convert asyncpg.Record objects to a list of dictionaries
        data_to_save = [dict(stock) for stock in stocks]

        print(f"Saving data to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
        
        print("Successfully generated stocks.json file.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            await conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(generate_file())
