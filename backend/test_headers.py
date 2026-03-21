import asyncio
import httpx
import urllib.parse

async def test_api():
    query = "casual%20shirt"
    urls = {
        "meesho": f"https://meesho.com/api/v1/products/search?q={query}&page=1&limit=10",
        "tatacliq": f"https://www.tatacliq.com/api/v1/page/fetch/search-listing?searchCategory=all&text={query}&isPwa=true",
        "ajio": f"https://www.ajio.com/api/search?query={query}&pageSize=10&currentPage=0&format=json",
        "nykaa": f"https://www.nykaa.com/page/api/search?q={query}" # Changed endpoint for Nykaa
    }
    
    for name, url in urls.items():
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': f'https://www.{name}.com/',
            'Origin': f'https://www.{name}.com',
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                print(f"[{name}] API Status: {resp.status_code}")
                if resp.status_code == 200:
                    print(f"   Success! {resp.text[:100]}...")
                else:
                    print(f"   Failed! {resp.text[:100]}")
        except Exception as e:
            print(f"[{name}] API Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
