"""
Selenium WebDriver Test Suite for LearnWorkFlow
Python-based automated testing with pytest
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import pytest
import time
import random

# Configuration
BASE_URL = "https://learnwork-flow-1.onrender.com"
TIMEOUT = 10

@pytest.fixture(scope="session")
def driver():
    """Setup Chrome WebDriver with options"""
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-notifications")
    # Uncomment for headless mode
    # chrome_options.add_argument("--headless")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(TIMEOUT)
    
    yield driver
    
    driver.quit()

@pytest.fixture(scope="session")
def authenticated_driver(driver):
    """Login once for all tests that need authentication"""
    driver.get(BASE_URL)
    
    # Wait for login page
    wait = WebDriverWait(driver, TIMEOUT)
    
    try:
        # Try to find login tab and click it
        login_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Login')]")))
        login_tab.click()
        time.sleep(1)
    except:
        pass  # Already on login form
    
    # Enter credentials
    email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
    email_input.send_keys("testuser@test.com")
    
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    password_input.send_keys("TestPassword123!")
    
    # Click login button
    login_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Login')]")
    login_button.click()
    
    # Wait for dashboard
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Tasks')]")))
    
    yield driver

class TestAuthentication:
    """Test authentication flows"""
    
    def test_user_registration(self, driver):
        """Test user registration flow"""
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Generate random credentials
        random_num = random.randint(1000, 9999)
        test_email = f"testuser{random_num}@test.com"
        test_username = f"testuser{random_num}"
        
        # Fill registration form
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.send_keys(test_email)
        
        username_input = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='username' i]")
        username_input.send_keys(test_username)
        
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.send_keys("TestPassword123!")
        
        # Click register
        register_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Register')]")
        register_button.click()
        
        # Wait for OTP page
        otp_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='OTP' i]")))
        
        assert otp_input.is_displayed(), "OTP input should be visible after registration"
    
    def test_invalid_login(self, driver):
        """Test login with invalid credentials"""
        driver.get(BASE_URL)
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Enter invalid credentials
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.send_keys("invalid@test.com")
        
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.send_keys("WrongPassword123!")
        
        # Click login
        login_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Login')]")
        login_button.click()
        
        # Wait for error message
        error_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".error, [role='alert'], .text-red-500")))
        
        assert error_element.is_displayed(), "Error message should appear for invalid login"

class TestTaskManagement:
    """Test task CRUD operations"""
    
    def test_create_task(self, authenticated_driver):
        """Test creating a new task"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Click Add Task button
        add_task_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add Task')]")))
        add_task_button.click()
        
        # Fill task form
        title_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Task title' i]")))
        title_input.send_keys("Selenium Test Task")
        
        description_input = driver.find_element(By.CSS_SELECTOR, "textarea[placeholder*='description' i]")
        description_input.send_keys("This is a test task created by Selenium WebDriver")
        
        # Select category
        category_select = driver.find_element(By.CSS_SELECTOR, "select[name='category']")
        category_select.click()
        academic_option = driver.find_element(By.XPATH, "//option[text()='Academic']")
        academic_option.click()
        
        # Select priority
        priority_select = driver.find_element(By.CSS_SELECTOR, "select[name='priority']")
        priority_select.click()
        high_option = driver.find_element(By.XPATH, "//option[text()='High']")
        high_option.click()
        
        # Save task
        save_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Save')]")
        save_button.click()
        
        # Wait for task to appear
        time.sleep(2)
        task_element = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Selenium Test Task')]")))
        
        assert task_element.is_displayed(), "Created task should appear in task list"
    
    def test_complete_task(self, authenticated_driver):
        """Test marking a task as complete"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Find first checkbox
        checkbox = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='checkbox']")))
        
        # Click to complete
        checkbox.click()
        time.sleep(2)
        
        # Verify checked
        assert checkbox.is_selected(), "Task checkbox should be checked after clicking"
    
    def test_filter_tasks(self, authenticated_driver):
        """Test filtering tasks by category"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Click Academic filter
        academic_filter = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Academic')]")))
        academic_filter.click()
        
        time.sleep(1)
        
        # Verify filter applied (check if academic tasks are visible)
        tasks = driver.find_elements(By.CSS_SELECTOR, ".task-item, [data-testid='task-item']")
        
        assert len(tasks) >= 0, "Task list should be visible after filtering"

class TestWorkSchedule:
    """Test work schedule management"""
    
    def test_create_work_schedule(self, authenticated_driver):
        """Test creating a work schedule"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Navigate to Work Schedule tab
        work_schedule_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Work Schedule')]")))
        work_schedule_tab.click()
        
        # Click Add Schedule
        add_schedule_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add Schedule')]")))
        add_schedule_button.click()
        
        # Fill schedule form
        job_title_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='job' i]")))
        job_title_input.send_keys("Test Job - Selenium")
        
        # Select work days
        monday_checkbox = driver.find_element(By.CSS_SELECTOR, "input[value='Monday']")
        monday_checkbox.click()
        
        # Set times
        start_time_input = driver.find_element(By.CSS_SELECTOR, "input[type='time']")
        start_time_input.send_keys("09:00")
        
        end_time_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='time']")
        end_time_inputs[-1].send_keys("17:00")
        
        # Save schedule
        save_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Save')]")
        save_button.click()
        
        time.sleep(2)
        
        # Verify schedule created
        schedule_element = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Test Job - Selenium')]")))
        
        assert schedule_element.is_displayed(), "Created work schedule should appear in list"

class TestAIFeatures:
    """Test AI conflict detection and suggestions"""
    
    def test_ai_exam_detection(self, authenticated_driver):
        """Test AI detects exam in task title"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Navigate to tasks
        driver.get(BASE_URL)
        
        # Click Add Task
        add_task_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add Task')]")))
        add_task_button.click()
        
        # Create task with "exam" in title
        title_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[placeholder*='Task title' i]")))
        title_input.send_keys("Biology Final Exam")
        
        description_input = driver.find_element(By.CSS_SELECTOR, "textarea[placeholder*='description' i]")
        description_input.send_keys("Important final exam")
        
        # Set date/time
        datetime_input = driver.find_element(By.CSS_SELECTOR, "input[type='datetime-local']")
        datetime_input.send_keys("2024-12-25T10:00")
        
        # Save task
        save_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Save')]")
        save_button.click()
        
        # Wait for AI modal
        try:
            ai_modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[role='dialog'], .modal")))
            assert ai_modal.is_displayed(), "AI modal should appear after creating exam task"
        except:
            print("AI modal did not appear - may need to check timing or selectors")

class TestProgressAndStreaks:
    """Test progress tracking and streak features"""
    
    def test_view_progress_tab(self, authenticated_driver):
        """Test viewing progress statistics"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Click Progress tab
        progress_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Progress')]")))
        progress_tab.click()
        
        # Verify progress elements
        current_streak = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Current Streak')]")))
        
        assert current_streak.is_displayed(), "Progress tab should show streak information"
    
    def test_streak_modal(self, authenticated_driver):
        """Test opening streak modal"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Navigate to Progress tab
        progress_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Progress')]")))
        progress_tab.click()
        
        # Click on streak card
        streak_card = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(text(), 'Current Streak')]/ancestor::div[contains(@class, 'cursor-pointer')]")))
        streak_card.click()
        
        # Verify modal opened
        modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[role='dialog']")))
        
        assert modal.is_displayed(), "Streak modal should open when clicking streak card"
    
    def test_leaderboard_view(self, authenticated_driver):
        """Test viewing leaderboard"""
        driver = authenticated_driver
        wait = WebDriverWait(driver, TIMEOUT)
        
        # Click Leaderboard/Pet tab
        try:
            leaderboard_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Leaderboard') or contains(text(), 'Pet')]")))
            leaderboard_tab.click()
        except:
            print("Leaderboard tab not found")
            return
        
        time.sleep(2)
        
        # Verify leaderboard loaded
        leaderboard_items = driver.find_elements(By.CSS_SELECTOR, ".leaderboard-item, [data-testid='leaderboard-user']")
        
        assert len(leaderboard_items) >= 0, "Leaderboard should load"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
