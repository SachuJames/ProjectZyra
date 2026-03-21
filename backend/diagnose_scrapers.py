import asyncio
import httpx
import urllib.parse

scrapers = {
    "Nykaa": {
        "url": lambda q: f"https://search.nykaa.com/api/search?q={urllib.parse.quote(q)}&channel=website",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.nykaa.com'}
    },
    "Myntra": {
        "url": lambda q: f"https://www.myntra.com/gateway/v2/search/{urllib.parse.quote(q)}?rows=10&o=0&plaEnabled=false",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.myntra.com'}
    },
    "Meesho": {
        "url": lambda q: f"https://meesho.com/api/v1/products/search?q={urllib.parse.quote(q)}&page=1&limit=10",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.meesho.com'}
    },
    "Tata CLiQ": {
        "url": lambda q: f"https://www.tatacliq.com/api/v1/page/fetch/search-listing?searchCategory=all&text={urllib.parse.quote(q)}&isPwa=true&isRecommendation=false",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.tatacliq.com'}
    },
    "Ajio": {
        "url": lambda q: f"https://www.ajio.com/api/search?query={urllib.parse.quote(q)}&pageSize=10&currentPage=0&format=json",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.ajio.com'}
    },
    "Snapdeal": {
        "url": lambda q: f"https://www.snapdeal.com/acors/json/product/search/v2?keyword={urllib.parse.quote(q)}&pageNum=0&pageSize=10",
        "headers": {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.snapdeal.com'}
    }
}

async def diagnose(query="casual shirt"):
    print(f"--- Diagnosing Scrapers for Query: '{query}' ---")
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for name, config in scrapers.items():
            print(f"\n[{name}]")
            url = config["url"](query)
            print(f"URL: {url}")
            try:
                resp = await client.get(url, headers=config["headers"])
                print(f"Status Code: {resp.status_code}")
                # Print first 500 characters
                body = resp.text
                print(f"Body snippet (first 500 chars): {body[:500]}")
            except Exception as e:
                print(f"Exception Caught: {e}")

if __name__ == "__main__":
    asyncio.run(diagnose())
