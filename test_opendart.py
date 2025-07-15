import os
import OpenDartReader
import pandas as pd

API_KEY = os.getenv("OPENDART_API_KEY")

if not API_KEY:
    print("OPENDART_API_KEY environment variable is not set.")
    exit(1)

try:
    dart = OpenDartReader(API_KEY)
    corp_codes_df = dart.corp_codes
    print(f"Type of corp_codes_df: {type(corp_codes_df)}")
    if isinstance(corp_codes_df, pd.DataFrame):
        print("DataFrame is not empty:", not corp_codes_df.empty)
        if not corp_codes_df.empty:
            print("Columns:", corp_codes_df.columns.tolist())
            print("First 5 rows:\n", corp_codes_df.head())
    else:
        print("Unexpected return value:", corp_codes_df)
except Exception as e:
    print(f"An error occurred: {e}")
    import traceback
    traceback.print_exc()