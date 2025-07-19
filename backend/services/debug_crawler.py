import requests
from bs4 import BeautifulSoup

url = "https://finance.naver.com/news/mainnews.naver"
headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Fetching HTML from {url}...")
try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    # Select the news list items (li)
    news_items = soup.select('.mainNewsList > li') # Select direct li children

    if not news_items:
        print("Could not find news list items with selector '.mainNewsList > li'.")
        print("Page HTML might have changed. Printing full body HTML:")
        print(soup.body.prettify())
    else:
        print(f"Found {len(news_items)} news list items. Printing their HTML structure:")
        print("-" * 50)
        for item in news_items:
            # Print the full HTML of the list item
            print(item.prettify())
            print("-" * 20)

except requests.exceptions.RequestException as e:
    print(f"Error fetching the URL: {e}")
except Exception as e:
    print(f"An error occurred: {e}")