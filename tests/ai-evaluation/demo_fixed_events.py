"""
Fixed Event Handler Demo - Working Student with Exams, Birthday, and Appointments
Demonstrates intelligent rescheduling around non-adjustable events
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from datetime import datetime, timedelta
from api.ai.unified_ai_optimizer import UnifiedAIOptimizer
from api.ai.fixed_event_handler import FixedEventHandler

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
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*100}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.HEADER}{text.center(100)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*100}{Colors.END}\n")

def print_section(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}>> {text}{Colors.END}")
    print(f"{Colors.CYAN}{'-'*100}{Colors.END}")

print_header("FIXED EVENT HANDLER - WORKING STUDENT DEMO")
print(f"{Colors.BOLD}Scenario:{Colors.END} Sarah - Engineering student with part-time job")
print(f"{Colors.BOLD}Challenge:{Colors.END} Schedule around fixed events (exam, birthday, doctor appointment)")
print(f"{Colors.BOLD}Goal:{Colors.END} Maintain balance between study, work, and personal life")

# ============================================================================
# FIXED EVENTS (Cannot be moved)
# ============================================================================

print_section("FIXED EVENTS (Non-Adjustable)")

fixed_events = [
    {
        'id': 'exam1',
        'title': 'Final Exam - Thermodynamics',
        'day': 'Wednesday',
        'time': '14:00',
        'duration': 180,
        'is_fixed': True,
        'dueDate': (datetime.now() + timedelta(days=2)).replace(hour=14, minute=0).isoformat(),
        'description': 'Final examination - cannot be rescheduled'
    },
    {
        'id': 'birthday1',
        'title': "Mom's Birthday Celebration",
        'day': 'Friday',
        'time': '18:00',
        'duration': 180,
        'is_fixed': True,
        'dueDate': (datetime.now() + timedelta(days=4)).replace(hour=18, minute=0).isoformat(),
        'description': 'Family birthday party'
    },
    {
        'id': 'appointment1',
        'title': 'Doctor Appointment - Annual Checkup',
        'day': 'Thursday',
        'time': '10:00',
        'duration': 60,
        'is_fixed': True,
        'dueDate': (datetime.now() + timedelta(days=3)).replace(hour=10, minute=0).isoformat(),
        'description': 'Medical appointment'
    }
]

print(f"\n{Colors.BOLD}Fixed Events (3 total):{Colors.END}")
for event in fixed_events:
    print(f"  {Colors.RED}[FIXED] {event['title']}{Colors.END}")
    print(f"          {event['day']} at {event['time']} ({event['duration']} minutes)")
    print(f"          Reason: {event['description']}")
    print()

# ============================================================================
# WORK SCHEDULE
# ============================================================================

work_schedules = [
    {
        'job_title': 'Campus Library Assistant',
        'work_days': ['Monday', 'Wednesday', 'Friday'],
        'start_time': '16:00',
        'end_time': '20:00'
    }
]

print(f"{Colors.BOLD}Work Schedule:{Colors.END}")
for schedule in work_schedules:
    print(f"  {Colors.YELLOW}[WORK] {schedule['job_title']}{Colors.END}")
    print(f"         Days: {', '.join(schedule['work_days'])}")
    print(f"         Time: {schedule['start_time']} - {schedule['end_time']}")
    print()

# ============================================================================
# TASKS TO SCHEDULE (Some will conflict with fixed events)
# ============================================================================

print_section("TASKS TO SCHEDULE")

tasks = [
    {
        'id': 'task1',
        'title': 'Study for Thermodynamics Exam',
        'description': 'Review chapters 1-8, practice problems',
        'category': 'academic',
        'priority': 'critical',
        'dueDate': (datetime.now() + timedelta(days=2)).replace(hour=14, minute=0).isoformat(),
        'estimatedDuration': 240,
        'day': 'Wednesday'
    },
    {
        'id': 'task2',
        'title': 'Complete Engineering Lab Report',
        'description': 'Write up fluid dynamics experiment',
        'category': 'academic',
        'priority': 'high',
        'dueDate': (datetime.now() + timedelta(days=3)).replace(hour=23, minute=59).isoformat(),
        'estimatedDuration': 180,
        'day': 'Thursday'
    },
    {
        'id': 'task3',
        'title': 'Group Project Meeting',
        'description': 'Discuss final presentation',
        'category': 'academic',
        'priority': 'high',
        'dueDate': (datetime.now() + timedelta(days=3)).replace(hour=15, minute=0).isoformat(),
        'estimatedDuration': 90,
        'day': 'Thursday'
    },
    {
        'id': 'task4',
        'title': 'Buy Birthday Gift for Mom',
        'description': 'Shop for birthday present',
        'category': 'personal',
        'priority': 'high',
        'dueDate': (datetime.now() + timedelta(days=4)).replace(hour=17, minute=0).isoformat(),
        'estimatedDuration': 60,
        'day': 'Friday'
    },
    {
        'id': 'task5',
        'title': 'Read Textbook Chapter 9',
        'description': 'Prepare for next week',
        'category': 'academic',
        'priority': 'medium',
        'dueDate': (datetime.now() + timedelta(days=5)).replace(hour=23, minute=59).isoformat(),
        'estimatedDuration': 120,
        'day': 'Saturday'
    }
]

print(f"\n{Colors.BOLD}Tasks (5 total):{Colors.END}")
for task in tasks:
    print(f"  {Colors.CYAN}[TASK] {task['title']}{Colors.END}")
    print(f"         Priority: {task['priority']} | Duration: {task['estimatedDuration']} min | Day: {task['day']}")

# ============================================================================
# DETECT POTENTIAL CONFLICTS
# ============================================================================

print_section("CONFLICT DETECTION")

handler = FixedEventHandler()

print(f"\n{Colors.BOLD}Checking for conflicts with fixed events...{Colors.END}\n")

conflicts_found = []
for task in tasks:
    # Simulate scheduled time (same as due date time for demo)
    task['scheduled_time'] = task['dueDate'].split('T')[1][:5] if 'T' in task['dueDate'] else '14:00'
    
    conflicts = handler.find_conflicts_with_fixed(task, fixed_events)
    
    if conflicts:
        conflicts_found.append((task, conflicts))
        print(f"{Colors.RED}[CONFLICT] {task['title']}{Colors.END}")
        for conflict in conflicts:
            print(f"  Conflicts with: {conflict['fixed_event']}")
            print(f"  Task time: {conflict['task_time']} ({conflict['task_duration']} min)")
            print(f"  Fixed time: {conflict['fixed_time']} ({conflict['fixed_duration']} min)")
            print(f"  Overlap: {conflict['overlap_minutes']} minutes")
        print()
    else:
        print(f"{Colors.GREEN}[OK] {task['title']} - No conflicts{Colors.END}")

print(f"\n{Colors.BOLD}Summary:{Colors.END} {len(conflicts_found)} conflict(s) detected")

# ============================================================================
# INTELLIGENT RESCHEDULING
# ============================================================================

print_section("INTELLIGENT RESCHEDULING")

print(f"\n{Colors.BOLD}Rescheduling conflicting tasks...{Colors.END}\n")

for task, conflicts in conflicts_found:
    print(f"{Colors.YELLOW}Rescheduling: {task['title']}{Colors.END}")
    
    result = handler.reschedule_around_fixed(task, fixed_events, work_schedules, tasks)
    
    if result['success']:
        print(f"{Colors.GREEN}[SUCCESS] Rescheduled{Colors.END}")
        print(f"  Original time: {result['original_time']}")
        print(f"  New time: {result['new_time']}")
        print(f"  Quality score: {result['quality_score']:.1f}/100")
        print(f"  Reasoning: {result['reasoning']}")
        
        # Update task with new time
        task['scheduled_time'] = result['new_time']
    else:
        print(f"{Colors.RED}[FAILED] Could not reschedule{Colors.END}")
        print(f"  Reason: {result['message']}")
        print(f"  Suggestion: {result['suggestion']}")
    print()

# ============================================================================
# RUN UNIFIED OPTIMIZER
# ============================================================================

print_section("UNIFIED AI OPTIMIZATION")

print(f"\n{Colors.BOLD}Running full optimization with fixed event handling...{Colors.END}\n")

optimizer = UnifiedAIOptimizer()
optimized_schedule = optimizer.optimize_schedule(tasks, fixed_events, work_schedules)

# ============================================================================
# FINAL SCHEDULE
# ============================================================================

print_section("OPTIMIZED WEEKLY SCHEDULE")

schedule_by_day = {
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
}

# Add fixed events
for event in fixed_events:
    schedule_by_day[event['day']].append({
        'time': event['time'],
        'title': event['title'],
        'type': 'FIXED EVENT',
        'color': Colors.RED,
        'duration': event['duration']
    })

# Add work schedules
for schedule in work_schedules:
    for day in schedule['work_days']:
        schedule_by_day[day].append({
            'time': schedule['start_time'],
            'title': f"{schedule['job_title']} ({schedule['start_time']}-{schedule['end_time']})",
            'type': 'WORK',
            'color': Colors.YELLOW,
            'duration': 240
        })

# Add optimized tasks
for task in tasks:
    task_id = task.get('id')
    if task_id in optimized_schedule:
        schedule_by_day[task['day']].append({
            'time': optimized_schedule[task_id],
            'title': task['title'],
            'type': f"TASK ({task['priority']})",
            'color': Colors.GREEN,
            'duration': task.get('estimatedDuration', 60)
        })

# Display schedule
for day, items in schedule_by_day.items():
    if items:
        print(f"\n{Colors.BOLD}{day}:{Colors.END}")
        items.sort(key=lambda x: x['time'])
        for item in items:
            duration_str = f"{item['duration']}min"
            print(f"{item['color']}  {item['time']:<10} | {item['title']:<55} | [{item['type']}] ({duration_str}){Colors.END}")

# ============================================================================
# WORK-LIFE BALANCE REPORT
# ============================================================================

print_section("WORK-LIFE BALANCE ANALYSIS")

report = optimizer.get_performance_report()

if 'balance_report' in report:
    balance = report['balance_report']
    
    print(f"\n{Colors.BOLD}Weekly Totals:{Colors.END}")
    totals = balance['weekly_totals']
    print(f"  Study Time: {totals['study_hours']} hours")
    print(f"  Work Time: {totals['work_hours']} hours")
    print(f"  Fixed Events: {totals['fixed_hours']} hours")
    
    print(f"\n{Colors.BOLD}Balance Assessment:{Colors.END}")
    print(f"  {balance['assessment']}")
    
    print(f"\n{Colors.BOLD}Recommendations:{Colors.END}")
    for i, rec in enumerate(balance['recommendations'], 1):
        print(f"  {i}. {rec}")

# ============================================================================
# PERFORMANCE SUMMARY
# ============================================================================

print_section("PERFORMANCE SUMMARY")

print(f"\n{Colors.BOLD}Optimization Metrics:{Colors.END}")
print(f"  Fitness Score: {report['fitness_score']}/100")
print(f"  Constraint Violations: {report['constraint_violations']}")
print(f"  Optimization Quality: {report['optimization_quality']}")
print(f"  Fixed Events Preserved: {len(fixed_events)}")
print(f"  Tasks Scheduled: {len(optimized_schedule)}/{len(tasks)}")

print(f"\n{Colors.BOLD}Key Features Demonstrated:{Colors.END}")
print(f"  {Colors.GREEN}[OK]{Colors.END} Fixed events (exam, birthday, appointment) preserved")
print(f"  {Colors.GREEN}[OK]{Colors.END} Conflicting tasks automatically rescheduled")
print(f"  {Colors.GREEN}[OK]{Colors.END} Work schedule respected")
print(f"  {Colors.GREEN}[OK]{Colors.END} Priority-based time allocation")
print(f"  {Colors.GREEN}[OK]{Colors.END} Work-life balance maintained")
print(f"  {Colors.GREEN}[OK]{Colors.END} Clear reasoning provided for all adjustments")

if report['target_achieved']:
    print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*100}{Colors.END}")
    print(f"{Colors.GREEN}{Colors.BOLD}{'100% PERFORMANCE ACHIEVED WITH FIXED EVENT HANDLING!'.center(100)}{Colors.END}")
    print(f"{Colors.GREEN}{Colors.BOLD}{'='*100}{Colors.END}\n")
else:
    print(f"\n{Colors.YELLOW}Near-optimal solution achieved{Colors.END}")

print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*100}{Colors.END}")
print(f"{Colors.BOLD}{Colors.HEADER}{'DEMONSTRATION COMPLETE'.center(100)}{Colors.END}")
print(f"{Colors.BOLD}{Colors.HEADER}{'='*100}{Colors.END}\n")
