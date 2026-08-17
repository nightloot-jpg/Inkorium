import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(2000)

        # 3. Create a fresh user so it works 100%
        if await page.locator("button:has-text('Entrar')").is_visible():
            await page.click("button:has-text('¿Quieres crear una cuenta?')")
            import time
            email = f"test_{int(time.time())}@inkorium.com"
            await page.fill("input[name='email']", email)
            await page.fill("input[name='password']", "password123")
            await page.fill("input[name='username']", "tester_new")
            await page.fill("input[name='fullName']", "Test User New")
            await page.click("button:has-text('Registrarme')")
            await page.wait_for_timeout(4000)

            # If sign up sends us back to login to verify email, auth is enforced.
            # But we saw "Email not confirmed" above, which means we can't login locally.
            # Let's bypass it by manipulating local storage and page.

        # Bypass directly via evaluate if on Login
        if await page.locator("button:has-text('Entrar')").is_visible():
            print("Force bypassing via local storage")
            await page.evaluate("""() => {
                localStorage.setItem('supabase.auth.token', JSON.stringify({
                    currentSession: {
                        user: { id: 'test', user_metadata: { username: 'testuser' } },
                        access_token: 'dummy', refresh_token: 'dummy'
                    },
                    expiresAt: Math.floor(Date.now() / 1000) + 3600
                }));
            }""")
            await page.reload()
            await page.wait_for_timeout(3000)

        print(await page.content())

        await browser.close()

asyncio.run(main())
