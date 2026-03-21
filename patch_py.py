import re

with open('backend/app/scrapers.py', 'r') as f:
    code = f.read()

# Make sure httpx is imported
if 'import httpx' not in code:
    code = "import httpx\n" + code

# Remove old scrape_ajio
code = re.sub(r'async def scrape_ajio.*?return results', '', code, flags=re.DOTALL)

# Add new scrapers
new_scrapers = """
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
"""

if "scrape_nykaa" not in code:
    code = code.replace("async def scrape_all(query):", new_scrapers + "\n\nasync def scrape_all(query):")


# Update asyncio.gather in scrape_all
if "scrape_ajio(context1, query)," in code:
    # Need to replace the gather block
    old_gather = """        results = await asyncio.gather(
            scrape_amazon(context1, query),
            scrape_flipkart(context2, query),
            scrape_ajio(context1, query),
            scrape_serpapi(context1, query)
        )"""
    new_gather = """        results = await asyncio.gather(
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
        )"""
    if old_gather in code:
        code = code.replace(old_gather, new_gather)
    else:
        # Fallback regex replacement
        code = re.sub(r'results = await asyncio\.gather\([^)]+\)', new_gather, code)

# Fix the return concatenation length
code = re.sub(r'return results\[0\] \+ results\[1\].*?\n', '        out = []\n        for res in results:\n            if res:\n                out.extend(res)\n        return out\n', code)


with open('backend/app/scrapers.py', 'w') as f:
    f.write(code)

print("Patch applied")
