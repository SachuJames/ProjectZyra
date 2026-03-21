import asyncio
import sys
from app.scrapers import scrape_amazon, scrape_flipkart, scrape_nykaa, scrape_myntra, scrape_meesho, scrape_tata_cliq, scrape_ajio, scrape_snapdeal, clean_price
from playwright.async_api import async_playwright
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
]

async def test_platform(name, func, *args):
    print(f"Testing {name}...")
    try:
        results = await func(*args)
        if not results:
            print(f"❌ {name} — 0 results, empty list returned")
            return
            
        prices = [r['price'] for r in results]
        min_p = min(prices)
        max_p = max(prices)
        
        # Validate schema
        first = results[0]
        valid_keys = {"title", "price", "image_url", "product_url", "platform", "rating"}
        if valid_keys != set(first.keys()):
            missing = valid_keys - set(first.keys())
            extra = set(first.keys()) - valid_keys
            print(f"❌ {name} — Invalid Schema. Missing: {missing}, Extra: {extra}")
            return
            
        print(f"✅ {name} — {len(results)} results, price range ₹{min_p}–₹{max_p}")
        print(f"   Example: {first['title'][:50]}... | Price: {type(first['price'])} {first['price']} | URL: {first['product_url'][:50]}")
    except Exception as e:
        print(f"❌ {name} — 0 results, error: {e}")

async def run_tests():
    query = "iPhone 15"
    print(f"=== Running Scraper Integration Tests for '{query}' ===\n")
    
    # Test HTTPX Scrapers (Concurrency)
    httpx_tests = [
        test_platform("Myntra", scrape_myntra, query),
        test_platform("Nykaa", scrape_nykaa, query),
        test_platform("Meesho", scrape_meesho, query),
        test_platform("Tata CLiQ", scrape_tata_cliq, query),
        test_platform("Ajio", scrape_ajio, query),
        test_platform("Snapdeal", scrape_snapdeal, query)
    ]
    await asyncio.gather(*httpx_tests)
    
    # Test Playwright Scrapers
    playwright_tests = [
        test_platform("Amazon", scrape_amazon, query),
        test_platform("Flipkart", scrape_flipkart, query)
    ]
    await asyncio.gather(*playwright_tests)
        
    print("\n=== Testing Complete ===")

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.DEBUG)
    asyncio.run(run_tests())
