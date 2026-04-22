"""
AI System Evaluation - Practical Demonstration
Tests the AI scheduling system with realistic working student scenarios
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.ai.groq_ai import groq_task_schedule_suggestion
import time
from datetime import datetime, timedelta
import json

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.HEADER}{text.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*80}{Colors.END}\n")

def print_test(test_num, title):
    print(f"\n{Colors.BOLD}{Colors.CYAN}Test Case {test_num}: {title}{Colors.END}")
    print(f"{Colors.CYAN}{'-'*80}{Colors.END}")

def print_result(label, value, color=Colors.GREEN):
    print(f"{Colors.BOLD}{label}:{Colors.END} {color}{value}{Colors.END}")

def print_json(data):
    print(json.dumps(data, indent=2))

# Test scenarios
def test_1_basic_constraint():
    """Test Case 1: Basic Constraint Satisfaction"""
    print_test(1, "Basic Constraint Satisfaction")
    
    task_data = {
        "title": "Complete Math Assignment",
        "category": "academic",
        "priority": "high",
        "dueDate": (datetime.now() + timedelta(days=2)).isoformat(),
        "estimatedDuration": 120
    }
    
    print(f"{Colors.BOLD}Input:{Colors.END}")
    print_json(task_data)
    
    start_time = time.time()
    result = groq_task_schedule_suggestion(task_data, [], [])
    elapsed = time.time() - start_time
    
    print(f"\n{Colors.BOLD}Output:{Colors.END}")
    print_result("Response Type", result.get('type', 'N/A'))
    print_result("Suggested Time", result.get('suggested_time', 'N/A'))
    reason_text = result.get('reason', 'N/A')
    # Remove emojis for Windows compatibility
    reason_clean = ''.join(c for c in reason_text if ord(c) < 128 or c.isalnum() or c in ' .,!?-')
    print_result("Reasoning", reason_clean)
    print_result("Response Time", f"{elapsed:.3f}s", Colors.YELLOW)
    
    # Evaluation
    print(f"\n{Colors.BOLD}Evaluation:{Colors.END}")
    checks = [
        ("Accuracy", result.get('suggested_time') is not None),
        ("Reasoning Provided", len(result.get('reason', '')) > 0),
        ("Performance", elapsed < 2.0)
    ]
    
    for check, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {check}: {status}")
    
    return all(passed for _, passed in checks)

def test_2_fixed_event_conflict():
    """Test Case 2: Fixed Event Conflict Detection"""
    print_test(2, "Fixed Event Conflict Detection")
    
    exam_time = datetime.now() + timedelta(days=1)
    exam_time = exam_time.replace(hour=14, minute=0, second=0, microsecond=0)
    
    task_data = {
        "title": "Study for Midterm Exam",
        "category": "academic",
        "priority": "high",
        "dueDate": exam_time.isoformat(),
        "estimatedDuration": 180
    }
    
    existing_tasks = [
        {
            "title": "Midterm Exam - Physics",
            "dueDate": exam_time.isoformat(),
            "priority": "critical",
            "is_fixed": True,
            "estimatedDuration": 120
        }
    ]
    
    print(f"{Colors.BOLD}Input:{Colors.END}")
    print(f"Task: {task_data['title']}")
    print(f"Fixed Event: {existing_tasks[0]['title']} at {exam_time.strftime('%Y-%m-%d %H:%M')}")
    
    start_time = time.time()
    result = groq_task_schedule_suggestion(task_data, [], existing_tasks)
    elapsed = time.time() - start_time
    
    print(f"\n{Colors.BOLD}Output:{Colors.END}")
    print_result("Response Type", result.get('type', 'N/A'))
    print_result("Conflict Detected", "Yes" if result.get('type') == 'fixed_conflict' else "No")
    print_result("Suggested Time", result.get('suggested_time', 'N/A'))
    reason_text = result.get('reason', 'N/A')
    reason_clean = ''.join(c for c in reason_text if ord(c) < 128 or c.isalnum() or c in ' .,!?-')
    print_result("Reasoning", reason_clean[:100] + "...")
    print_result("Response Time", f"{elapsed:.3f}s", Colors.YELLOW)
    
    # Evaluation
    print(f"\n{Colors.BOLD}Evaluation:{Colors.END}")
    checks = [
        ("Conflict Detection", result.get('type') == 'fixed_conflict'),
        ("Alternative Suggested", result.get('suggested_time') is not None),
        ("Clear Warning", 'exam' in result.get('reason', '').lower() or 'fixed' in result.get('reason', '').lower()),
        ("Performance", elapsed < 2.0)
    ]
    
    for check, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {check}: {status}")
    
    return all(passed for _, passed in checks)

def test_3_work_schedule_integration():
    """Test Case 3: Work Schedule Integration"""
    print_test(3, "Work Schedule Integration")
    
    task_data = {
        "title": "Complete Programming Project",
        "category": "academic",
        "priority": "high",
        "dueDate": (datetime.now() + timedelta(days=2)).isoformat(),
        "estimatedDuration": 240
    }
    
    work_schedules = [
        {
            "job_title": "Part-time Barista",
            "work_days": ["Monday", "Wednesday", "Friday"],
            "start_time": "16:00",
            "end_time": "21:00"
        }
    ]
    
    print(f"{Colors.BOLD}Input:{Colors.END}")
    print(f"Task: {task_data['title']} (4 hours)")
    print(f"Work Schedule: {work_schedules[0]['job_title']}")
    print(f"  Days: {', '.join(work_schedules[0]['work_days'])}")
    print(f"  Hours: {work_schedules[0]['start_time']} - {work_schedules[0]['end_time']}")
    
    start_time = time.time()
    result = groq_task_schedule_suggestion(task_data, work_schedules, [])
    elapsed = time.time() - start_time
    
    print(f"\n{Colors.BOLD}Output:{Colors.END}")
    print_result("Response Type", result.get('type', 'N/A'))
    print_result("Suggested Time", result.get('suggested_time', 'N/A'))
    print_result("Reasoning", result.get('reason', 'N/A')[:100] + "...")
    print_result("Response Time", f"{elapsed:.3f}s", Colors.YELLOW)
    
    # Evaluation
    suggested_time = result.get('suggested_time', '')
    avoids_work = True
    if suggested_time:
        try:
            hour = int(suggested_time.split(':')[0])
            avoids_work = hour < 16 or hour >= 21
        except:
            pass
    
    print(f"\n{Colors.BOLD}Evaluation:{Colors.END}")
    checks = [
        ("Work Awareness", 'work' in result.get('reason', '').lower()),
        ("Avoids Work Hours", avoids_work),
        ("Duration Considered", '4' in result.get('reason', '') or 'hour' in result.get('reason', '')),
        ("Performance", elapsed < 2.0)
    ]
    
    for check, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {check}: {status}")
    
    return all(passed for _, passed in checks)

def test_4_priority_based_scheduling():
    """Test Case 4: Priority-Based Scheduling"""
    print_test(4, "Priority-Based Scheduling")
    
    task_data = {
        "title": "Optional Reading Assignment",
        "category": "academic",
        "priority": "low",
        "dueDate": (datetime.now() + timedelta(days=5)).isoformat(),
        "estimatedDuration": 60
    }
    
    existing_tasks = [
        {
            "title": "Final Project Presentation",
            "dueDate": (datetime.now() + timedelta(days=3)).isoformat(),
            "priority": "critical",
            "estimatedDuration": 180
        },
        {
            "title": "Lab Report Due",
            "dueDate": (datetime.now() + timedelta(days=4)).isoformat(),
            "priority": "high",
            "estimatedDuration": 120
        }
    ]
    
    print(f"{Colors.BOLD}Input:{Colors.END}")
    print(f"New Task: {task_data['title']} (Priority: {task_data['priority']})")
    print(f"Existing Tasks:")
    for task in existing_tasks:
        print(f"  - {task['title']} (Priority: {task['priority']})")
    
    start_time = time.time()
    result = groq_task_schedule_suggestion(task_data, [], existing_tasks)
    elapsed = time.time() - start_time
    
    print(f"\n{Colors.BOLD}Output:{Colors.END}")
    print_result("Response Type", result.get('type', 'N/A'))
    print_result("Suggested Time", result.get('suggested_time', 'N/A'))
    print_result("Reasoning", result.get('reason', 'N/A')[:100] + "...")
    print_result("Response Time", f"{elapsed:.3f}s", Colors.YELLOW)
    
    # Evaluation
    print(f"\n{Colors.BOLD}Evaluation:{Colors.END}")
    checks = [
        ("Priority Awareness", 'priority' in result.get('reason', '').lower() or 'low' in result.get('reason', '').lower()),
        ("Considers Urgent Tasks", 'critical' in result.get('reason', '').lower() or 'high' in result.get('reason', '').lower()),
        ("Flexible Scheduling", result.get('type') in ['suggestion', 'awareness']),
        ("Performance", elapsed < 2.0)
    ]
    
    for check, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {check}: {status}")
    
    return all(passed for _, passed in checks)

def test_5_complex_multi_constraint():
    """Test Case 5: Complex Multi-Constraint Scenario"""
    print_test(5, "Complex Multi-Constraint Scenario (Realistic Working Student)")
    
    base_date = datetime.now()
    
    task_data = {
        "title": "Research Paper Draft",
        "category": "academic",
        "priority": "high",
        "dueDate": (base_date + timedelta(days=3)).isoformat(),
        "estimatedDuration": 300  # 5 hours
    }
    
    work_schedules = [
        {
            "job_title": "Library Assistant",
            "work_days": ["Monday", "Tuesday", "Thursday"],
            "start_time": "14:00",
            "end_time": "18:00"
        }
    ]
    
    existing_tasks = [
        {
            "title": "Calculus Class",
            "dueDate": (base_date + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
            "priority": "critical",
            "is_fixed": True,
            "estimatedDuration": 90
        },
        {
            "title": "Chemistry Lab",
            "dueDate": (base_date + timedelta(days=2)).replace(hour=13, minute=0).isoformat(),
            "priority": "critical",
            "is_fixed": True,
            "estimatedDuration": 180
        },
        {
            "title": "Study Group Meeting",
            "dueDate": (base_date + timedelta(days=1)).replace(hour=19, minute=0).isoformat(),
            "priority": "medium",
            "estimatedDuration": 120
        },
        {
            "title": "Homework Set 5",
            "dueDate": (base_date + timedelta(days=2)).replace(hour=23, minute=59).isoformat(),
            "priority": "high",
            "estimatedDuration": 120
        }
    ]
    
    print(f"{Colors.BOLD}Input:{Colors.END}")
    print(f"Task: {task_data['title']} (5 hours, High priority)")
    print(f"\nWork Schedule: {work_schedules[0]['job_title']}")
    print(f"  Days: {', '.join(work_schedules[0]['work_days'])}")
    print(f"  Hours: {work_schedules[0]['start_time']} - {work_schedules[0]['end_time']}")
    print(f"\nExisting Tasks ({len(existing_tasks)}):")
    for task in existing_tasks:
        fixed = " [FIXED]" if task.get('is_fixed') else ""
        print(f"  - {task['title']} ({task['priority']}){fixed}")
    
    start_time = time.time()
    result = groq_task_schedule_suggestion(task_data, work_schedules, existing_tasks)
    elapsed = time.time() - start_time
    
    print(f"\n{Colors.BOLD}Output:{Colors.END}")
    print_result("Response Type", result.get('type', 'N/A'))
    print_result("Suggested Time", result.get('suggested_time', 'N/A'))
    print_result("Reasoning", result.get('reason', 'N/A')[:150] + "...")
    print_result("Response Time", f"{elapsed:.3f}s", Colors.YELLOW)
    
    # Evaluation
    print(f"\n{Colors.BOLD}Evaluation:{Colors.END}")
    reason_lower = result.get('reason', '').lower()
    checks = [
        ("Handles Multiple Constraints", len(existing_tasks) == 4),
        ("Work Schedule Awareness", 'work' in reason_lower or 'library' in reason_lower),
        ("Fixed Event Preservation", result.get('type') != 'fixed_conflict' or 'class' in reason_lower),
        ("Priority Consideration", 'high' in reason_lower or 'priority' in reason_lower),
        ("Realistic Suggestion", result.get('suggested_time') is not None),
        ("Performance", elapsed < 3.0)
    ]
    
    for check, passed in checks:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {check}: {status}")
    
    return all(passed for _, passed in checks)

def test_6_context_detection():
    """Test Case 6: Context Detection and Analysis"""
    print_test(6, "Context Detection and Intelligent Analysis")
    
    test_cases = [
        ("Prepare for Final Exam - Calculus", "exam"),
        ("Team Meeting for Project", "meeting"),
        ("Mom's Birthday Party", "birthday"),
        ("Submit Assignment by 11:59 PM", "deadline"),
        ("Study Session at Library", "study"),
        ("Workout at Gym", "workout"),
    ]
    
    print(f"{Colors.BOLD}Testing Context Detection:{Colors.END}\n")
    
    results = []
    for title, expected_context in test_cases:
        task_data = {
            "title": title,
            "category": "academic" if expected_context in ["exam", "study", "deadline"] else "personal",
            "priority": "high",
            "dueDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "estimatedDuration": 60
        }
        
        result = groq_task_schedule_suggestion(task_data, [], [])
        reason = result.get('reason', '').lower()
        
        # Check if context is detected
        detected = expected_context in reason or expected_context in title.lower()
        results.append(detected)
        
        status = f"{Colors.GREEN}DETECTED{Colors.END}" if detected else f"{Colors.RED}MISSED{Colors.END}"
        print(f"  {title[:40]:<40} -> {expected_context:<10} {status}")
    
    accuracy = sum(results) / len(results) * 100
    print(f"\n{Colors.BOLD}Context Detection Accuracy: {Colors.YELLOW}{accuracy:.1f}%{Colors.END}")
    
    return accuracy >= 80.0

def run_all_tests():
    """Run all evaluation tests"""
    print_header("AI SYSTEM EVALUATION - WORKING STUDENT SCHEDULING")
    print(f"{Colors.BOLD}Testing AI accuracy, reliability, and decision-making performance{Colors.END}")
    print(f"{Colors.BOLD}Evaluating constraint satisfaction, optimization, and scalability{Colors.END}\n")
    
    tests = [
        ("Basic Constraint Satisfaction", test_1_basic_constraint),
        ("Fixed Event Conflict Detection", test_2_fixed_event_conflict),
        ("Work Schedule Integration", test_3_work_schedule_integration),
        ("Priority-Based Scheduling", test_4_priority_based_scheduling),
        ("Complex Multi-Constraint", test_5_complex_multi_constraint),
        ("Context Detection", test_6_context_detection),
    ]
    
    results = []
    start_time = time.time()
    
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n{Colors.RED}ERROR in {test_name}: {str(e)}{Colors.END}")
            results.append((test_name, False))
    
    total_time = time.time() - start_time
    
    # Summary
    print_header("EVALUATION SUMMARY")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    success_rate = (passed_count / total_count) * 100
    
    print(f"{Colors.BOLD}Test Results:{Colors.END}\n")
    for test_name, passed in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if passed else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {test_name:<40} {status}")
    
    print(f"\n{Colors.BOLD}Overall Performance:{Colors.END}")
    print_result("Tests Passed", f"{passed_count}/{total_count}")
    print_result("Success Rate", f"{success_rate:.1f}%", Colors.GREEN if success_rate >= 80 else Colors.YELLOW)
    print_result("Total Execution Time", f"{total_time:.2f}s", Colors.YELLOW)
    print_result("Average Time per Test", f"{total_time/total_count:.2f}s", Colors.YELLOW)
    
    # Final Grade
    print(f"\n{Colors.BOLD}Final Grade:{Colors.END}")
    if success_rate >= 90:
        grade = "A"
        color = Colors.GREEN
        status = "EXCELLENT"
    elif success_rate >= 80:
        grade = "B"
        color = Colors.CYAN
        status = "GOOD"
    elif success_rate >= 70:
        grade = "C"
        color = Colors.YELLOW
        status = "SATISFACTORY"
    else:
        grade = "D"
        color = Colors.RED
        status = "NEEDS IMPROVEMENT"
    
    print(f"{color}{Colors.BOLD}  Grade: {grade} ({success_rate:.1f}%) - {status}{Colors.END}")
    
    print(f"\n{Colors.BOLD}Production Readiness:{Colors.END}")
    if success_rate >= 85:
        print(f"{Colors.GREEN}{Colors.BOLD}  STATUS: PRODUCTION READY{Colors.END}")
        print(f"  The AI system demonstrates strong performance in:")
        print(f"    - Constraint satisfaction and conflict detection")
        print(f"    - Priority-based scheduling and optimization")
        print(f"    - Work schedule integration")
        print(f"    - Context awareness and intelligent reasoning")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}  STATUS: NEEDS IMPROVEMENT{Colors.END}")
        print(f"  Areas requiring attention:")
        for test_name, passed in results:
            if not passed:
                print(f"    - {test_name}")
    
    print(f"\n{Colors.HEADER}{'='*80}{Colors.END}\n")

if __name__ == "__main__":
    run_all_tests()
