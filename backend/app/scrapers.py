import httpx
import asyncio
from playwright.async_api import async_playwright
import random
import re
import os
import urllib.request
import urllib.parse
import json
from bs4 import BeautifulSoup

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
]

def clean_price(price_str):
    try:
        match = re.search(r'[\d,]+(\.\d+)?', str(price_str))
        if match:
             return float(match.group(0).replace(",", ""))
    except:
        pass
    return 0.0

async def scrape_amazon(query):
    results = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"]
            )
            context = await browser.new_context(user_agent=random.choice(USER_AGENTS), viewport={"width": 1280, "height": 800})
            stealth_script = "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
            await context.add_init_script(stealth_script)
            page = await context.new_page()
            await page.goto(f"https://www.amazon.in/s?k={urllib.parse.quote(query)}", timeout=10000, wait_until="domcontentloaded")
            items = await page.query_selector_all("div[data-component-type='s-search-result']")
            for item in items[:10]:
                title_el = await item.query_selector("h2 a span, h2 span")
                price_el = await item.query_selector(".a-price-whole, .a-price")
                url_el = await item.query_selector("h2 a, a.a-link-normal")
                img_el = await item.query_selector("img.s-image")
                
                if title_el and price_el and url_el:
                    title = await title_el.inner_text()
                    price = clean_price(await price_el.inner_text())
                    href = await url_el.get_attribute("href")
                    url = "https://www.amazon.in" + href if href.startswith("/") else href
                    img = await img_el.get_attribute("src") if img_el else ""
                    if price > 0:
                        results.append({"title": title[:255], "price": price, "platform": "Amazon", "product_url": url, "image_url": img, "rating": None})
            await context.close()
            await browser.close()
    except Exception as e:
        print(f"Amazon Scrape Error: {e}")
    return results
async def scrape_flipkart(query):
    results = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"]
            )
            context = await browser.new_context(user_agent=random.choice(USER_AGENTS), viewport={"width": 1280, "height": 800})
            stealth_script = "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
            await context.add_init_script(stealth_script)
            page = await context.new_page()
            await page.goto(f"https://www.flipkart.com/search?q={urllib.parse.quote(query)}", timeout=10000, wait_until="domcontentloaded")
            items = await page.query_selector_all("div[data-id], div.cPHDOP, div.slAVV4, div.tUxRFH")
            for item in items[:10]:
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
                    prices = [clean_price(m.group(1)) for m in matches if clean_price(m.group(1)) > 200]
                    price = min(prices) if prices else 0
                    if price > 0 and title and len(title) > 5:
                        results.append({"title": title[:255].replace('\n', ' '), "price": price, "platform": "Flipkart", "product_url": url, "image_url": img, "rating": None})
            await context.close()
            await browser.close()
    except Exception as e:
        print(f"Flipkart Scrape Error: {e}")
    return results

async def scrape_serpapi(query):
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
        for item in data.get("shopping_results", [])[:15]:
            title = item.get("title", "")
            price = clean_price(str(item.get("price", "")))
            source = item.get("source", "Google Shopping")
            link = item.get("link", "")
            img = item.get("thumbnail", "")
            source_lower = source.lower()
            if "amazon" in source_lower: platform = "Amazon"
            elif "flipkart" in source_lower: platform = "Flipkart"
            elif "myntra" in source_lower: platform = "Myntra"
            elif "ajio" in source_lower: platform = "Ajio"
            elif "meesho" in source_lower: platform = "Meesho"
            elif "tata" in source_lower or "cliq" in source_lower: platform = "Tata CLiQ"
            elif "nykaa" in source_lower: platform = "Nykaa"
            elif "snapdeal" in source_lower: platform = "Snapdeal"
            else: platform = source
            if price > 0 and title:
                results.append({"title": title[:255].replace('\n', ' '), "price": price, "platform": platform, "product_url": link, "image_url": img, "rating": None})
    except Exception as e:
        print(f"SerpAPI Error: {e}")
    return results

COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
}

async def scrape_nykaa(query):
    results = []
    try:
        url = f"https://www.nykaa.com/search/result/?q={urllib.parse.quote(query)}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for script in soup.find_all('script'):
                    if script.string and 'window.__PRELOADED_STATE__' in script.string:
                        match = re.search(r'window\.__PRELOADED_STATE__\s*=\s*({.*})', script.string, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group(1))
                                for item in data.get('search', {}).get('products', []):
                                    title = item.get('title') or item.get('name')
                                    price = clean_price(item.get('price', 0))
                                    img = item.get('imageUrl')
                                    p_url = "https://www.nykaa.com" + item.get('productUrl', '')
                                    if title and price > 0:
                                        results.append({"title": title, "price": price, "platform": "Nykaa", "image_url": img, "product_url": p_url, "rating": None})
                            except: pass
                            break
    except Exception as e: print(f"Nykaa error: {e}")
    return results[:10]

async def scrape_myntra(query):
    results = []
    try:
        url = f"https://www.myntra.com/{query.replace(' ', '-')}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for script in soup.find_all('script'):
                    if script.string and 'window.__myx' in script.string:
                        match = re.search(r'window\.__myx\s*=\s*({.*})', script.string, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group(1).replace('};', '}')) 
                                for item in data.get('searchData', {}).get('results', {}).get('products', []):
                                    title = item.get('productName')
                                    price = clean_price(item.get('price', 0))
                                    img = item.get('searchImage')
                                    p_url = "https://www.myntra.com/" + item.get('landingPageUrl', '')
                                    if title and price > 0:
                                        results.append({"title": title, "price": price, "platform": "Myntra", "image_url": img, "product_url": p_url, "rating": None})
                            except: pass
                            break
    except Exception as e: print(f"Myntra error: {e}")
    return results[:10]

async def scrape_meesho(query):
    results = []
    try:
        url = f"https://www.meesho.com/search?q={urllib.parse.quote(query)}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                script = soup.find('script', id='__NEXT_DATA__')
                if script and script.string:
                    try:
                        data = json.loads(script.string)
                        catalogs = data.get('props', {}).get('pageProps', {}).get('initialState', {}).get('catalogSearch', {}).get('catalogs', [])
                        for cat in catalogs:
                            title = cat.get('name')
                            price = clean_price(cat.get('discountedPrice', 0))
                            img = cat.get('image')
                            p_url = "https://www.meesho.com/s/p/" + str(cat.get('id', ''))
                            if title and price > 0:
                                results.append({"title": title, "price": price, "platform": "Meesho", "image_url": img, "product_url": p_url, "rating": None})
                    except: pass
    except Exception as e: print(f"Meesho error: {e}")
    return results[:10]

async def scrape_tata_cliq(query):
    results = []
    try:
        url = f"https://www.tatacliq.com/search/?searchCategory=all&text={urllib.parse.quote(query)}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for script in soup.find_all('script'):
                    if script.string and 'window.__PRELOADED_STATE__' in script.string:
                        match = re.search(r'window\.__PRELOADED_STATE__\s*=\s*({.*})', script.string, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group(1).replace('};', '}'))
                                for item in data.get('search', {}).get('searchResponse', {}).get('products', []):
                                    title = item.get('productName')
                                    price = clean_price(item.get('price', {}).get('sellingPrice', 0))
                                    img = item.get('imageURL')
                                    p_url = "https://www.tatacliq.com" + item.get('seoURL', '')
                                    if title and price > 0:
                                        results.append({"title": title, "price": price, "platform": "Tata CLiQ", "image_url": img, "product_url": p_url, "rating": None})
                            except: pass
                            break
    except Exception as e: print(f"Tata CLiQ error: {e}")
    return results[:10]

async def scrape_ajio(query):
    results = []
    try:
        url = f"https://www.ajio.com/search/?text={urllib.parse.quote(query)}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for script in soup.find_all('script'):
                    if script.string and 'window.__PRELOADED_STATE__' in script.string:
                        match = re.search(r'window\.__PRELOADED_STATE__\s*=\s*({.*})', script.string, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group(1).replace('};', '}'))
                                for item in data.get('grid', {}).get('results', []):
                                    title = item.get('name')
                                    price = clean_price(item.get('price', {}).get('value', 0))
                                    img = item.get('images', [{}])[0].get('url', '')
                                    p_url = "https://www.ajio.com" + item.get('url', '')
                                    if title and price > 0:
                                        results.append({"title": title, "price": price, "platform": "Ajio", "image_url": img, "product_url": p_url, "rating": None})
                            except: pass
                            break
    except Exception as e: print(f"Ajio error: {e}")
    return results[:10]

async def scrape_snapdeal(query):
    results = []
    try:
        url = f"https://www.snapdeal.com/search?keyword={urllib.parse.quote(query)}"
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=COMMON_HEADERS)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                for item in soup.select('.product-tuple-listing'):
                    title_el = item.select_one('.product-title')
                    price_el = item.select_one('.product-price')
                    img_el = item.select_one('img.product-image')
                    url_el = item.select_one('a.dp-widget-link')
                    if title_el and price_el and url_el:
                        title = title_el.text.strip()
                        price = clean_price(price_el.text.strip())
                        img = img_el.get('src') or img_el.get('data-src', '')
                        p_url = url_el.get('href')
                        if title and price > 0:
                            results.append({"title": title, "price": price, "platform": "Snapdeal", "image_url": img, "product_url": p_url, "rating": None})
    except Exception as e: print(f"Snapdeal error: {e}")
    return results[:10]

async def scrape_all(query: str):
    tasks = [
        scrape_amazon(query),
        scrape_flipkart(query),
        scrape_myntra(query),
        scrape_snapdeal(query),
        scrape_nykaa(query),
        scrape_meesho(query),
        scrape_tata_cliq(query),
        scrape_ajio(query),
    ]
    
    # Enforce 15s global wrapper in case tasks zombie
    async def global_timeout_wrapper():
        return await asyncio.gather(*tasks, return_exceptions=True)
        
    try:
        results = await asyncio.wait_for(global_timeout_wrapper(), timeout=15.0)
    except asyncio.TimeoutError:
        print("Global timeout hit! Some scrapers hung.")
        return []
    
    all_products = []
    for result in results:
        if isinstance(result, Exception):
            continue  # silently skip failed platforms
        if isinstance(result, list):
            all_products.extend(result)
    return all_products

async def scrape_url_product(url: str):
    domain = urllib.parse.urlparse(url).netloc.lower()
    
    try:
        if 'amazon' in domain:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"]
                )
                context = await browser.new_context(user_agent=random.choice(USER_AGENTS))
                await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
                page = await context.new_page()
                await page.goto(url, timeout=15000)
                
                title_el = await page.query_selector("#productTitle")
                price_el = await page.query_selector(".a-price-whole, .a-price")
                img_el = await page.query_selector("#landingImage")
                
                title = await title_el.inner_text() if title_el else ""
                price = clean_price(await price_el.inner_text()) if price_el else 0
                img = await img_el.get_attribute("src") if img_el else ""
                
                await browser.close()
                if title and price > 0:
                    return {"title": title.strip(), "price": price, "image_url": img, "product_url": url, "platform": "Amazon", "rating": None}
                
        elif 'flipkart' in domain:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"]
                )
                context = await browser.new_context(user_agent=random.choice(USER_AGENTS))
                await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
                page = await context.new_page()
                await page.goto(url, timeout=15000)
                
                title_el = await page.query_selector("span.B_NuCI, span.VU-ZEz")
                price_el = await page.query_selector("div._30jeq3, div.Nx9bqj")
                img_el = await page.query_selector("img._396cs4, img.vGEb_Z")
                
                title = await title_el.inner_text() if title_el else ""
                price = clean_price(await price_el.inner_text()) if price_el else 0
                img = await img_el.get_attribute("src") if img_el else ""
                
                await browser.close()
                if title and price > 0:
                    return {"title": title.strip(), "price": price, "image_url": img, "product_url": url, "platform": "Flipkart", "rating": None}
                
        elif 'myntra' in domain:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=COMMON_HEADERS)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    for script in soup.find_all('script'):
                        if script.string and 'window.__myx' in script.string:
                            match = re.search(r'window\.__myx\s*=\s*({.*})', script.string, re.DOTALL)
                            if match:
                                try:
                                    data = json.loads(match.group(1).replace('};', '}')) 
                                    pdata = data.get('pdpData', {})
                                    title = pdata.get('name') or pdata.get('analyticData', {}).get('articleType')
                                    price = clean_price(pdata.get('price', {}).get('discounted', 0) or pdata.get('price', {}).get('mrp', 0))
                                    img = ''
                                    if pdata.get('media', {}).get('albums'):
                                        img = pdata['media']['albums'][0].get('images', [{}])[0].get('imageURL', '')
                                    if title and price > 0:
                                        return {"title": title, "price": price, "image_url": img, "product_url": url, "platform": "Myntra", "rating": None}
                                except: pass
                                    
        elif 'snapdeal' in domain:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=COMMON_HEADERS)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    title_el = soup.select_one('h1.pdp-e-i-head')
                    price_el = soup.select_one('span.payBlkBig')
                    img_el = soup.select_one('img.cloudzoom')
                    
                    title = title_el.text.strip() if title_el else ""
                    price = clean_price(price_el.text.strip()) if price_el else 0
                    img = img_el.get('src') if img_el else ""
                    
                    if title and price > 0:
                        return {"title": title, "price": price, "image_url": img, "product_url": url, "platform": "Snapdeal", "rating": None}
    except Exception as e:
        print(f"URL Scrape Error for {url}: {e}")
        
    return None
