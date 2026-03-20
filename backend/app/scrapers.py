import asyncio
from playwright.async_api import async_playwright
import random
import re

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
]

def clean_price(price_str):
    try:
        match = re.search(r'[\d,]+(\.\d+)?', price_str)
        if match:
             return float(match.group(0).replace(",", ""))
    except:
        pass
    return 0.0

async def scrape_amazon(context, query):
    results = []
    try:
        page = await context.new_page()
        await asyncio.sleep(random.uniform(1, 3))
        # Direct navigation to search avoids typing which might trigger bots
        await page.goto(f"https://www.amazon.in/s?k={query}")
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(random.uniform(2, 4))
        
        # Checking for captcha
        title = await page.title()
        if "Robot Check" in title or "Sorry! Something went wrong" in title:
            print(f"Amazon Blocked! Title: {title}")
        
        items = await page.query_selector_all("div[data-component-type='s-search-result']")
        print(f"Amazon found {len(items)} items")
        if not items:
            content = await page.content()
            print(f"Amazon HTML Snippet: {content[:1000]}")
            
        for item in items[:5]:
            title_el = await item.query_selector("h2 a span, h2 span")
            price_el = await item.query_selector(".a-price-whole, .a-price")
            url_el = await item.query_selector("h2 a, a.a-link-normal")
            img_el = await item.query_selector("img.s-image")
            
            if title_el and price_el and url_el:
                title = await title_el.inner_text()
                price_str = await price_el.inner_text()
                href = await url_el.get_attribute("href")
                url = "https://www.amazon.in" + href if href.startswith("/") else href
                img = await img_el.get_attribute("src") if img_el else ""
                
                results.append({
                    "title": title[:255],
                    "price": clean_price(price_str),
                    "platform": "Amazon",
                    "product_url": url,
                    "image_url": img
                })
        if not results and items:
            html = await items[0].inner_html()
            print(f"Amazon First Item HTML: {html[:2000]}")
        await page.close()
    except Exception as e:
        print(f"Amazon Scrape Error: {e}")
    return results

async def scrape_flipkart(context, query):
    results = []
    try:
        page = await context.new_page()
        await asyncio.sleep(random.uniform(1, 4))
        await page.goto(f"https://www.flipkart.com/search?q={query}", timeout=45000)
        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(random.uniform(2, 5))
        
        items = await page.query_selector_all("div[data-id], div.cPHDOP, div.slAVV4, div.tUxRFH")
        for item in items:
            url_el = await item.query_selector("a")
            img_el = await item.query_selector("img")
            
            if url_el and img_el:
                title = await img_el.get_attribute("alt") or await item.inner_text()
                href = await url_el.get_attribute("href")
                if not href or href.startswith("javascript"): continue
                url = "https://www.flipkart.com" + href if href.startswith("/") else href
                img = await img_el.get_attribute("src") or ""
                
                text = await item.inner_text()
                matches = re.finditer(r'₹([\d,]+)', text)
                prices = [float(m.group(1).replace(',', '')) for m in matches if float(m.group(1).replace(',', '')) > 200]
                price = min(prices) if prices else 0
                
                if price > 0 and title and len(title) > 5:
                    results.append({
                        "title": title[:255].replace('\n', ' '),
                        "price": price,
                        "platform": "Flipkart",
                        "product_url": url,
                        "image_url": img
                    })
                    if len(results) >= 5: break
        await page.close()
    except Exception as e:
        print(f"Flipkart Scrape Error: {e}")
    return results

import os
import urllib.request
import urllib.parse
import json

async def scrape_serpapi(context, query):
    api_key = os.environ.get("SERPAPI_KEY")
    if not api_key: return []
    results = []
    qs = urllib.parse.quote(query)
    url = f"https://serpapi.com/search.json?engine=google_shopping&q={qs}&gl=in&hl=en&api_key={api_key}"
    try:
        def fetch():
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.loads(response.read())
        data = await asyncio.to_thread(fetch)
        
        shopping_results = data.get("shopping_results", [])
        for item in shopping_results[:15]:
            title = item.get("title", "")
            price_str = item.get("price", "")
            source = item.get("source", "Google Shopping")
            link = item.get("link", "")
            img = item.get("thumbnail", "")
            
            price = clean_price(str(price_str))
            if price > 0 and title:
                results.append({
                    "title": title[:255].replace('\n', ' '),
                    "price": price,
                    "platform": source,
                    "product_url": link,
                    "image_url": img
                })
    except Exception as e:
        print(f"SerpAPI Error: {e}")
    return results

async def scrape_all(query):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        
        ua1 = random.choice(USER_AGENTS)
        ua2 = random.choice(USER_AGENTS)
        context1 = await browser.new_context(user_agent=ua1, viewport={"width": 1280, "height": 800})
        context2 = await browser.new_context(user_agent=ua2, viewport={"width": 1280, "height": 800})
        
        stealth_script = """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """
        await context1.add_init_script(stealth_script)
        await context2.add_init_script(stealth_script)
        
        results = await asyncio.gather(
            scrape_amazon(context1, query),
            scrape_flipkart(context2, query),
            scrape_serpapi(context1, query)
        )
        
        await context1.close()
        await context2.close()
        await browser.close()
        
        return results[0] + results[1] + results[2]
