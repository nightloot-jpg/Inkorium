import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)

        # Real login flow since we cannot use mocked states
        if await page.locator("button:has-text('Entrar')").is_visible():
            await page.click("button:has-text('¿Quieres crear una cuenta?')")
            import time
            email = f"user_{int(time.time())}@inkorium.com"
            await page.fill("input[name='email']", email)
            await page.fill("input[name='password']", "password123")
            await page.fill("input[name='username']", "tester_final")
            await page.fill("input[name='fullName']", "Final Tester")
            await page.click("button:has-text('Registrarme')")
            await page.wait_for_timeout(4000)

            # Since local auth might ask for email verification depending on supabase config
            # we will attempt to login anyway, or see what is on screen

            html = await page.content()
            if "Email not confirmed" in html or "Inicia sesión" in html:
                # If Supabase requires email verification in this CI environment we cannot test the normal flow natively
                print("Could not complete normal flow due to Auth constraints. Taking screenshot of whatever rendered.")

        await page.evaluate("""() => {
            const buttons = Array.from(document.querySelectorAll('nav.side-menu button'));
            const photosBtn = buttons.find(b => b.textContent.includes('Fotos'));
            if (photosBtn) {
                photosBtn.click();
            }
        }""")
        await page.wait_for_timeout(3000)

        feed_layout_count = await page.evaluate("document.querySelectorAll('.feed-layout').length")
        photos_page_count = await page.evaluate("document.querySelectorAll('.photos-page').length")

        print(f"Feed Layout Count: {feed_layout_count}")
        print(f"Photos Page Layout Count: {photos_page_count}")

        await page.screenshot(path="final_validation.png")
        await browser.close()

asyncio.run(main())
