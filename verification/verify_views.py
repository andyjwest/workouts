from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Load the app
        print("Navigating to app...")
        page.goto("http://localhost:8000/index.html")
        page.wait_for_load_state('networkidle')

        # 2. Wait for data to load (header title changes from 'SheetGym' to 'Active Workout')
        # Actually in app.js init:
        # this.headerTitleEl.textContent = 'Active Workout';
        # We wait for that.
        print("Waiting for data load...")
        page.wait_for_selector('text=Active Workout', timeout=5000)

        # Take screenshot of In Gym view
        print("Taking In Gym screenshot...")
        page.screenshot(path="verification/1_ingym.png")

        # 3. Navigate to Planner
        print("Navigating to Planner...")
        page.click('#nav-planner')
        page.wait_for_selector('text=Routine Planner')

        # Take screenshot of Planner view
        print("Taking Planner screenshot...")
        page.screenshot(path="verification/2_planner.png")

        # 4. Navigate to Reports
        print("Navigating to Reports...")
        page.click('#nav-reports')
        page.wait_for_selector('text=Progress Reports')

        # Take screenshot of Reports view
        print("Taking Reports screenshot...")
        page.screenshot(path="verification/3_reports.png")

        browser.close()

if __name__ == "__main__":
    verify_app()
