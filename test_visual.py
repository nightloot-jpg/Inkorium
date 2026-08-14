from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context(record_video_dir="test-results/")
    page = context.new_page()
    page.goto("http://localhost:5173")

    # Simple interaction just to verify the app doesn't crash on load
    time.sleep(2)
    page.screenshot(path="test-results/home.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
