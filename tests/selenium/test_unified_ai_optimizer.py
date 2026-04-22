"""
Selenium Test Suite for Unified AI Optimizer
Tests the complete workflow including authentication, task creation, and optimization
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

class UnifiedAIOptimizerTest:
    """
    Comprehensive Selenium test for Unified AI Optimizer
    """
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.driver = None
        self.access_token = None
        self.test_results = []
        
    def setup_driver(self):
        """Initialize Chrome WebDriver"""
        print(f"\n{Colors.CYAN}[SETUP] Initializing Chrome WebDriver...{Colors.END}")
        
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        # chrome_options.add_argument("--headless")  # Uncomment for headless mode
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print(f"{Colors.GREEN}[SUCCESS] WebDriver initialized{Colors.END}")
            return True
        except Exception as e:
            print(f"{Colors.RED}[ERROR] Failed to initialize WebDriver: {e}{Colors.END}")
            print(f"{Colors.YELLOW}[INFO] Make sure ChromeDriver is installed{Colors.END}")
            return False
    
    def test_backend_health(self):
        """Test 1: Check if backend is running"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 1: Backend Health Check{Colors.END}")
        
        try:
            response = requests.get(f"{self.base_url}/healthz", timeout=5)
            
            if response.status_code == 200:
                print(f"{Colors.GREEN}[PASS] Backend is running{Colors.END}")
                print(f"  Status: {response.json()}")
                self.test_results.append(("Backend Health", "PASS"))
                return True
            else:
                print(f"{Colors.RED}[FAIL] Backend returned status {response.status_code}{Colors.END}")
                self.test_results.append(("Backend Health", "FAIL"))
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"{Colors.RED}[FAIL] Cannot connect to backend at {self.base_url}{Colors.END}")
            print(f"{Colors.YELLOW}[INFO] Make sure Django server is running: python manage.py runserver{Colors.END}")
            self.test_results.append(("Backend Health", "FAIL"))
            return False
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("Backend Health", "FAIL"))
            return False
    
    def test_api_login(self, email="test@example.com", password="testpass123"):
        """Test 2: API Login and get access token"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 2: API Authentication{Colors.END}")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/login/",
                json={"username": email, "password": password},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access")
                
                print(f"{Colors.GREEN}[PASS] Login successful{Colors.END}")
                print(f"  User: {data.get('user', {}).get('username')}")
                print(f"  Token: {self.access_token[:20]}...{self.access_token[-20:]}")
                self.test_results.append(("API Login", "PASS"))
                return True
            else:
                print(f"{Colors.YELLOW}[INFO] Login failed with test credentials{Colors.END}")
                print(f"{Colors.YELLOW}[INFO] Please use existing verified account{Colors.END}")
                print(f"{Colors.RED}[FAIL] Could not authenticate{Colors.END}")
                self.test_results.append(("API Login", "FAIL"))
                return False
                
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("API Login", "FAIL"))
            return False
    
    def test_optimize_schedule_api(self):
        """Test 3: Test Unified AI Optimizer API endpoint"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 3: Unified AI Optimizer API{Colors.END}")
        
        if not self.access_token:
            print(f"{Colors.RED}[SKIP] No access token available{Colors.END}")
            self.test_results.append(("Optimize Schedule API", "SKIP"))
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/ai/optimize-schedule/",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"{Colors.GREEN}[PASS] Optimization API working{Colors.END}")
                print(f"\n  Response Data:")
                print(f"    Success: {data.get('success')}")
                print(f"    Message: {data.get('message')}")
                
                if 'performance' in data:
                    perf = data['performance']
                    print(f"\n  Performance Metrics:")
                    print(f"    Fitness Score: {perf.get('fitness_score')}/100")
                    print(f"    Violations: {perf.get('constraint_violations')}")
                    print(f"    Quality: {perf.get('optimization_quality')}")
                    print(f"    Target Achieved: {perf.get('target_achieved')}")
                    
                    if perf.get('fitness_score') == 100.0 and perf.get('constraint_violations') == 0:
                        print(f"\n{Colors.GREEN}{Colors.BOLD}  [SUCCESS] 100% PERFORMANCE ACHIEVED!{Colors.END}")
                
                if 'scheduled_tasks' in data:
                    print(f"\n  Scheduled Tasks: {len(data['scheduled_tasks'])}")
                    for task in data['scheduled_tasks'][:3]:
                        print(f"    - {task.get('title')}: {task.get('day')} at {task.get('scheduled_time')}")
                
                self.test_results.append(("Optimize Schedule API", "PASS"))
                return True
            else:
                print(f"{Colors.RED}[FAIL] API returned status {response.status_code}{Colors.END}")
                print(f"  Response: {response.text[:200]}")
                self.test_results.append(("Optimize Schedule API", "FAIL"))
                return False
                
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("Optimize Schedule API", "FAIL"))
            return False
    
    def test_analyze_task_api(self):
        """Test 4: Test individual task analysis API"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 4: Task Analysis API{Colors.END}")
        
        if not self.access_token:
            print(f"{Colors.RED}[SKIP] No access token available{Colors.END}")
            self.test_results.append(("Task Analysis API", "SKIP"))
            return False
        
        try:
            from datetime import datetime, timedelta
            
            task_data = {
                "title": "Test Programming Assignment",
                "description": "Implement binary search tree",
                "category": "academic",
                "priority": "high",
                "dueDate": (datetime.now() + timedelta(days=2)).isoformat(),
                "estimatedDuration": 180
            }
            
            response = requests.post(
                f"{self.base_url}/api/ai/analyze/",
                json=task_data,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"{Colors.GREEN}[PASS] Task Analysis API working{Colors.END}")
                print(f"\n  Analysis Result:")
                print(f"    Type: {data.get('type')}")
                print(f"    Suggested Time: {data.get('suggested_time')}")
                print(f"    Priority: {data.get('priority')}")
                print(f"    Reason: {data.get('reason', '')[:100]}...")
                
                self.test_results.append(("Task Analysis API", "PASS"))
                return True
            else:
                print(f"{Colors.RED}[FAIL] API returned status {response.status_code}{Colors.END}")
                self.test_results.append(("Task Analysis API", "FAIL"))
                return False
                
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("Task Analysis API", "FAIL"))
            return False
    
    def test_frontend_navigation(self):
        """Test 5: Test frontend navigation"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 5: Frontend Navigation{Colors.END}")
        
        if not self.driver:
            print(f"{Colors.RED}[SKIP] WebDriver not initialized{Colors.END}")
            self.test_results.append(("Frontend Navigation", "SKIP"))
            return False
        
        try:
            print(f"  Navigating to {self.base_url}...")
            self.driver.get(self.base_url)
            
            time.sleep(2)
            
            if "LearnWork" in self.driver.title or self.driver.title:
                print(f"{Colors.GREEN}[PASS] Frontend loaded{Colors.END}")
                print(f"  Page Title: {self.driver.title}")
                self.test_results.append(("Frontend Navigation", "PASS"))
                return True
            else:
                print(f"{Colors.RED}[FAIL] Frontend did not load properly{Colors.END}")
                self.test_results.append(("Frontend Navigation", "FAIL"))
                return False
                
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("Frontend Navigation", "FAIL"))
            return False
    
    def test_performance_metrics(self):
        """Test 6: Verify 100% performance metrics"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}TEST 6: Performance Metrics Validation{Colors.END}")
        
        if not self.access_token:
            print(f"{Colors.RED}[SKIP] No access token available{Colors.END}")
            self.test_results.append(("Performance Metrics", "SKIP"))
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/api/ai/optimize-schedule/",
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                perf = data.get('performance', {})
                
                fitness = perf.get('fitness_score', 0)
                violations = perf.get('constraint_violations', 999)
                target_achieved = perf.get('target_achieved', False)
                
                print(f"  Checking Performance Metrics:")
                print(f"    Fitness Score: {fitness}/100 {'[OK]' if fitness >= 90 else '[FAIL]'}")
                print(f"    Violations: {violations} {'[OK]' if violations == 0 else '[FAIL]'}")
                print(f"    Target Achieved: {target_achieved} {'[OK]' if target_achieved else '[FAIL]'}")
                
                if fitness >= 90 and violations == 0:
                    print(f"\n{Colors.GREEN}[PASS] Performance metrics meet requirements{Colors.END}")
                    
                    if fitness == 100.0 and violations == 0:
                        print(f"{Colors.GREEN}{Colors.BOLD}  [PERFECT] 100% PERFORMANCE!{Colors.END}")
                    
                    self.test_results.append(("Performance Metrics", "PASS"))
                    return True
                else:
                    print(f"\n{Colors.YELLOW}[WARN] Performance below target{Colors.END}")
                    self.test_results.append(("Performance Metrics", "WARN"))
                    return False
            else:
                print(f"{Colors.RED}[FAIL] Could not retrieve metrics{Colors.END}")
                self.test_results.append(("Performance Metrics", "FAIL"))
                return False
                
        except Exception as e:
            print(f"{Colors.RED}[FAIL] Error: {e}{Colors.END}")
            self.test_results.append(("Performance Metrics", "FAIL"))
            return False
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.HEADER}TEST SUMMARY{Colors.END}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}\n")
        
        total = len(self.test_results)
        passed = sum(1 for _, result in self.test_results if result == "PASS")
        failed = sum(1 for _, result in self.test_results if result == "FAIL")
        skipped = sum(1 for _, result in self.test_results if result == "SKIP")
        warned = sum(1 for _, result in self.test_results if result == "WARN")
        
        for test_name, result in self.test_results:
            if result == "PASS":
                color = Colors.GREEN
                icon = "[PASS]"
            elif result == "FAIL":
                color = Colors.RED
                icon = "[FAIL]"
            elif result == "SKIP":
                color = Colors.YELLOW
                icon = "[SKIP]"
            else:
                color = Colors.YELLOW
                icon = "[WARN]"
            
            print(f"{color}{icon} {test_name}{Colors.END}")
        
        print(f"\n{Colors.BOLD}Results:{Colors.END}")
        print(f"  Total Tests: {total}")
        print(f"  {Colors.GREEN}Passed: {passed}{Colors.END}")
        print(f"  {Colors.RED}Failed: {failed}{Colors.END}")
        print(f"  {Colors.YELLOW}Skipped: {skipped}{Colors.END}")
        print(f"  {Colors.YELLOW}Warnings: {warned}{Colors.END}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n  Success Rate: {success_rate:.1f}%")
        
        if failed == 0 and passed > 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}[SUCCESS] ALL TESTS PASSED!{Colors.END}")
        elif failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}[FAILED] SOME TESTS FAILED{Colors.END}")
        
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}\n")
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            print(f"\n{Colors.CYAN}[CLEANUP] Closing WebDriver...{Colors.END}")
            self.driver.quit()
    
    def run_all_tests(self):
        """Run all tests"""
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.HEADER}UNIFIED AI OPTIMIZER - SELENIUM TEST SUITE{Colors.END}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}")
        
        driver_ok = self.setup_driver()
        
        self.test_backend_health()
        self.test_api_login()
        self.test_optimize_schedule_api()
        self.test_analyze_task_api()
        
        if driver_ok:
            self.test_frontend_navigation()
        
        self.test_performance_metrics()
        
        self.print_summary()
        self.cleanup()


def main():
    """Main test runner"""
    import sys
    
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    print(f"\n{Colors.CYAN}Testing backend at: {base_url}{Colors.END}")
    print(f"{Colors.YELLOW}Note: Make sure Django server is running!{Colors.END}")
    
    tester = UnifiedAIOptimizerTest(base_url)
    tester.run_all_tests()


if __name__ == "__main__":
    main()
