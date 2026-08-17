import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)

        feed_layout_count = await page.evaluate("document.querySelectorAll('.feed-layout').length")
        photos_page_count = await page.evaluate("document.querySelectorAll('.photos-page').length")

        print(f"Feed layout count on Photos route: {feed_layout_count} (Expected: 0)")
        print(f"Photos page layout count: {photos_page_count} (Expected: 1)")

        await page.screenshot(path="photos_page_verification.png")
        await browser.close()

asyncio.run(main())
