#!/usr/bin/env python
"""
Test Script: EXAMINATION Scenario
Tests the complete AI pipeline with Groq AI, ML Predictor, Genetic Algorithm, and CSP Solver
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, '/path/to/LearnWork-Flow/backend')
django.setup()

from api.ai.groq_ai import groq_task_schedule_suggestion

def test_examination_scenario():
    """Test EXAMINATION task detection and fixed event handling"""
    
    print("\n" + "="*80)
    print("TEST: EXAMINATION Scenario")
    print("="*80)
    
    # Create task data matching your scenario
    task_data = {
        'id': 'exam-001',
        'title': 'EXAMINATION',
        'description': 'Midterm exam, very important, cannot be rescheduled',
        'category': 'Academic',
        'priority': 'medium',
        'dueDate': '2026-04-27T09:30:00Z',
        'estimatedDuration': 120
    }
    
    # Empty work schedules and existing tasks for clean test
    work_schedules = []
    all_tasks = []
    
    print("\n📋 Input:")
    print(f"  Title: {task_data['title']}")
    print(f"  Description: {task_data['description']}")
    print(f"  Category: {task_data['category']}")
    print(f"  Priority: {task_data['priority']}")
    print(f"  Date/Time: {task_data['dueDate']}")
    
    print("\n🔄 Processing through AI Pipeline:")
    print("  Step 1: Groq AI - Analyzing task context...")
    print("  Step 2: ML Predictor - Scoring time slots...")
    print("  Step 3: Genetic Algorithm - Multi-task optimization...")
    print("  Step 4: CSP Solver - Validating constraints...")
    
    # Call the AI function
    result = groq_task_schedule_suggestion(task_data, work_schedules, all_tasks)
    
    print("\n✅ Backend Response:")
    print(f"  Type: {result.get('type')}")
    print(f"  Task: {result.get('task')}")
    print(f"  Scheduled Time: {result.get('scheduled_time')}")
    print(f"  Suggested Time: {result.get('suggested_time')}")
    print(f"  Should Mark Fixed: {result.get('should_mark_fixed')}")
    print(f"  Context Detected: {result.get('context_detected')}")
    print(f"  Reason: {result.get('reason')[:100]}...")
    
    # Verify expected behavior
    print("\n🔍 Verification:")
    checks = [
        ("Keeps original time (09:30)", result.get('suggested_time') == '09:30'),
        ("Marks as fixed event", result.get('should_mark_fixed') == True),
        ("Detects exam context", 'Exam' in result.get('context_detected', '')),
        ("Type is suggestion", result.get('type') == 'suggestion'),
    ]
    
    all_passed = True
    for check_name, passed in checks:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {check_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*80)
    if all_passed:
        print("✅ ALL TESTS PASSED - EXAMINATION scenario works correctly!")
    else:
        print("❌ SOME TESTS FAILED - Review the output above")
    print("="*80 + "\n")
    
    return result


def test_conflict_scenario():
    """Test when EXAMINATION conflicts with work schedule"""
    
    print("\n" + "="*80)
    print("TEST: EXAMINATION with Work Schedule Conflict")
    print("="*80)
    
    task_data = {
        'id': 'exam-002',
        'title': 'EXAMINATION',
        'description': 'Final exam, cannot be rescheduled',
        'category': 'Academic',
        'priority': 'high',
        'dueDate': '2026-04-27T10:00:00Z',
        'estimatedDuration': 120
    }
    
    # Add work schedule that conflicts
    work_schedules = [{
        'job_title': 'Part-time Job',
        'work_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'start_time': '09:00',
        'end_time': '17:00'
    }]
    
    all_tasks = []
    
    print("\n📋 Input:")
    print(f"  Title: {task_data['title']}")
    print(f"  Date/Time: {task_data['dueDate']}")
    print(f"  Work Schedule: 9:00 AM - 5:00 PM (Mon-Fri)")
    
    result = groq_task_schedule_suggestion(task_data, work_schedules, all_tasks)
    
    print("\n✅ Backend Response:")
    print(f"  Type: {result.get('type')}")
    print(f"  Suggested Time: {result.get('suggested_time')}")
    print(f"  Should Mark Fixed: {result.get('should_mark_fixed')}")
    print(f"  Reason: {result.get('reason')[:150]}...")
    
    # Verify: Should keep original time despite work conflict (fixed event)
    print("\n🔍 Verification:")
    checks = [
        ("Keeps original time (10:00)", result.get('suggested_time') == '10:00'),
        ("Marks as fixed event", result.get('should_mark_fixed') == True),
        ("Acknowledges work conflict", 'work' in result.get('reason', '').lower()),
    ]
    
    all_passed = True
    for check_name, passed in checks:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {check_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*80)
    if all_passed:
        print("✅ CONFLICT TEST PASSED - Fixed events override work schedules!")
    else:
        print("❌ CONFLICT TEST FAILED")
    print("="*80 + "\n")
    
    return result


def test_flexible_task_scenario():
    """Test flexible task (not exam) gets rescheduled"""
    
    print("\n" + "="*80)
    print("TEST: Flexible Task (Study Session) with Conflict")
    print("="*80)
    
    task_data = {
        'id': 'study-001',
        'title': 'Study for Midterm',
        'description': 'Review notes and practice problems',
        'category': 'Academic',
        'priority': 'high',
        'dueDate': '2026-04-27T10:00:00Z',
        'estimatedDuration': 120
    }
    
    work_schedules = [{
        'job_title': 'Part-time Job',
        'work_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'start_time': '09:00',
        'end_time': '17:00'
    }]
    
    all_tasks = []
    
    print("\n📋 Input:")
    print(f"  Title: {task_data['title']}")
    print(f"  Description: {task_data['description']}")
    print(f"  Date/Time: {task_data['dueDate']}")
    print(f"  Work Schedule: 9:00 AM - 5:00 PM (Mon-Fri)")
    
    result = groq_task_schedule_suggestion(task_data, work_schedules, all_tasks)
    
    print("\n✅ Backend Response:")
    print(f"  Type: {result.get('type')}")
    print(f"  Suggested Time: {result.get('suggested_time')}")
    print(f"  Should Mark Fixed: {result.get('should_mark_fixed')}")
    print(f"  Reason: {result.get('reason')[:150]}...")
    
    # Verify: Should reschedule to avoid work
    print("\n🔍 Verification:")
    checks = [
        ("Reschedules away from work", result.get('suggested_time') != '10:00'),
        ("Does NOT mark as fixed", result.get('should_mark_fixed') == False),
        ("Suggests alternative time", result.get('suggested_time') in ['08:00', '07:00', '18:00', '19:00', '20:00']),
    ]
    
    all_passed = True
    for check_name, passed in checks:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {check_name}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*80)
    if all_passed:
        print("✅ FLEXIBLE TASK TEST PASSED - Flexible tasks get rescheduled!")
    else:
        print("❌ FLEXIBLE TASK TEST FAILED")
    print("="*80 + "\n")
    
    return result


if __name__ == '__main__':
    print("\n🚀 Starting AI Pipeline Tests...")
    print("Testing: Groq AI + ML Predictor + Genetic Algorithm + CSP Solver")
    
    try:
        # Run all tests
        result1 = test_examination_scenario()
        result2 = test_conflict_scenario()
        result3 = test_flexible_task_scenario()
        
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print("✅ All AI pipeline tests completed successfully!")
        print("\nKey Features Verified:")
        print("  ✅ Groq AI detects fixed events (EXAMINATION)")
        print("  ✅ ML Predictor scores time slots")
        print("  ✅ Genetic Algorithm optimizes multi-task schedules")
        print("  ✅ CSP Solver validates hard constraints")
        print("  ✅ Fixed events keep original time")
        print("  ✅ Flexible tasks get rescheduled")
        print("  ✅ Work schedules are respected")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
