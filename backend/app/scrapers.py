import httpx
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
            
            source_lower = source.lower()
            if "amazon" in source_lower: platform = "Amazon"
            elif "flipkart" in source_lower: platform = "Flipkart"
            elif "myntra" in source_lower: platform = "Myntra"
            elif "ajio" in source_lower: platform = "Ajio"
            elif "meesho" in source_lower: platform = "Meesho"
            elif "reliance" in source_lower: platform = "Reliance Digital"
            elif "croma" in source_lower: platform = "Croma"
            elif "tata" in source_lower or "cliq" in source_lower: platform = "Tata Cliq"
            elif "nykaa" in source_lower: platform = "Nykaa"
            elif "mi store" in source_lower or "xiaomi" in source_lower: platform = "Mi Store"
            elif "vijay sales" in source_lower: platform = "Vijay Sales"
            elif "snapdeal" in source_lower: platform = "Snapdeal"
            else: platform = source
            
            price = clean_price(str(price_str))
            if price > 0 and title:
                results.append({
                    "title": title[:255].replace('\n', ' '),
                    "price": price,
                    "platform": platform,
                    "product_url": link,
                    "image_url": img
                })
    except Exception as e:
        print(f"SerpAPI Error: {e}")
    return results




async def scrape_nykaa(query):
    results = []
    try:
        url = f"https://search.nykaa.com/api/search?q={urllib.parse.quote(query)}&channel=website"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.nykaa.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get('response', {}).get('docs', []):
                    title = item.get('name') or item.get('title')
                    price = clean_price(str(item.get('price', 0)))
                    img = item.get('imageUrl')
                    url_path = item.get('productUrl') or ""
                    p_url = "https://www.nykaa.com" + url_path if url_path.startswith('/') else url_path
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Nykaa", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Nykaa error: {e}")
    return results[:10]

async def scrape_myntra(query):
    results = []
    try:
        url = f"https://www.myntra.com/gateway/v2/search/{urllib.parse.quote(query)}?rows=10&o=0&plaEnabled=false"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.myntra.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                products = data.get('products', [])
                for item in products:
                    title = item.get('productName')
                    priceInfo = item.get('price', {})
                    price = float(priceInfo.get('discounted', 0) or priceInfo.get('mrp', 0))
                    images = item.get('images', [])
                    img = images[0].get('securePath') if images else ""
                    url_path = item.get('landingPageUrl', '')
                    p_url = "https://www.myntra.com/" + url_path
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Myntra", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Myntra error: {e}")
    return results[:10]

async def scrape_meesho(query):
    results = []
    try:
        url = f"https://meesho.com/api/v1/products/search?q={urllib.parse.quote(query)}&page=1&limit=10"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.meesho.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                catalogs = data.get('catalogs', [])
                for cat in catalogs:
                    item = cat.get('product', {})
                    if not item: continue
                    title = item.get('name')
                    price = float(item.get('discountedPrice', 0))
                    images = item.get('images', [])
                    img = images[0] if images else ""
                    url_path = item.get('catalogUrl', '')
                    p_url = "https://www.meesho.com" + url_path if url_path.startswith('/') else url_path
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Meesho", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Meesho error: {e}")
    return results[:10]

async def scrape_tata_cliq(query):
    results = []
    try:
        url = f"https://www.tatacliq.com/api/v1/page/fetch/search-listing?searchCategory=all&text={urllib.parse.quote(query)}&isPwa=true&isRecommendation=false"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.tatacliq.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get('components', {}).get('productList', {}).get('items', []):
                    title = item.get('productName')
                    price = float(item.get('priceInfo', {}).get('mrpPrice', {}).get('value', 0))
                    img = item.get('imageURL')
                    url_path = item.get('pdpURL')
                    p_url = "https://www.tatacliq.com" + url_path if url_path.startswith('/') else url_path
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Tata CLiQ", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Tata CLiQ error: {e}")
    return results[:10]

async def scrape_purplle(query):
    results = []
    try:
        url = f"https://www.purplle.com/search/suggestions?q={urllib.parse.quote(query)}"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.purplle.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get('data', {}).get('suggestions', []):
                    if item.get('type') == 'product':
                        title = item.get('name')
                        price = float(item.get('selling_price', 0))
                        img = item.get('image')
                        p_url = item.get('url')
                        if title and price > 0:
                            results.append({"title": title, "price": price, "platform": "Purplle", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Purplle error: {e}")
    return results[:10]

async def scrape_ajio(query):
    results = []
    try:
        qs = urllib.parse.quote(query)
        url = f"https://www.ajio.com/api/search?query={qs}&pageSize=10&currentPage=0&format=json"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.ajio.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get('products', []):
                    title = item.get('name')
                    price = float(item.get('price', {}).get('value', 0))
                    images = item.get('images', [])
                    img = images[0].get('url') if images else ""
                    url_path = item.get('url', '')
                    p_url = "https://www.ajio.com" + url_path if url_path.startswith('/') else url_path
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Ajio", "image_url": img, "product_url": p_url})
    except Exception as e:
        print(f"Ajio error: {e}")
    return results[:10]

async def scrape_snapdeal(query):
    results = []
    try:
        url = f"https://www.snapdeal.com/acors/json/product/search/v2?keyword={urllib.parse.quote(query)}&pageNum=0&pageSize=10"
        headers = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.snapdeal.com'}
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get('productTupleList', []):
                    p = item.get('product', {})
                    if not p:
                        if 'products' in item:
                            p = item['products'][0] if item['products'] else {}
                    title = p.get('title')
                    price = float(p.get('sellingPrice', 0))
                    img = p.get('imageUrl')
                    p_url = p.get('productUrl')
                    if title and price > 0:
                        results.append({"title": title, "price": price, "platform": "Snapdeal", "image_url": img, "product_url": p_url})
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Snapdeal error: {e}")
    return results[:10]


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
            scrape_serpapi(context1, query),
            scrape_nykaa(query),
            scrape_myntra(query),
            scrape_meesho(query),
            scrape_tata_cliq(query),
            scrape_purplle(query),
            scrape_ajio(query),
            scrape_snapdeal(query)
        )
        
        await context1.close()
        await context2.close()
        await browser.close()
        
        out = []
        for res in results:
            if res:
                out.extend(res)
        return out
