import asyncio
from playwright.async_api import async_playwright

async def dump_html():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        
        urls = {
            "nykaa": "https://www.nykaa.com/search/result/?q=casual%20shirt",
            "meesho": "https://www.meesho.com/search?q=casual%20shirt",
            "tatacliq": "https://www.tatacliq.com/search/?searchCategory=all&text=casual%20shirt",
            "ajio": "https://www.ajio.com/search/?text=casual%20shirt"
        }
        for name, url in urls.items():
            print(f"Fetching {name}...")
            page = await ctx.new_page()
            try:
                await page.goto(url, timeout=20000)
                await asyncio.sleep(4)
                html = await page.content()
                with open(f"/app/{name}.html", "w", encoding="utf-8") as f:
                    f.write(html)
            except Exception as e: print(f"{name} failure: {e}")
            await page.close()
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(dump_html())
