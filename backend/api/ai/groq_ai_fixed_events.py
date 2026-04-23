#!/usr/bin/env python3
"""
AI Fixed Event Detection and Handling - Complete Implementation
Ensures exams, interviews, and other fixed events are NEVER rescheduled.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timedelta
import math

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ============================================================================
# FIXED EVENT DETECTION - NEW FUNCTION
# Detects if a task is unmovable (exam, deadline, interview, flight, etc.)
# ============================================================================

def is_fixed_event(title, description):
    """
    Detect if a task is a FIXED, NON-RESCHEDULABLE event.
    Fixed events include: exams, tests, interviews, flights, appointments, 
    defenses, deadlines. Must NOT be moved under any circumstances.
    
    Returns: (is_fixed: bool, event_type: str, confidence: float)
    """
    fixed_event_keywords = {
        'exam': ['exam', 'test', 'midterm', 'final exam', 'quiz', 'assessment', 'finals'],
        'interview': ['interview', 'job interview', 'phone screen', 'scheduled interview'],
        'flight': ['flight', 'plane', 'airport', 'travel', 'boarding'],
        'appointment': ['appointment', 'doctor', 'dentist', 'meeting', 'conference', 'scheduled appointment'],
        'deadline': ['deadline', 'submission', 'cannot be rescheduled', 'non-reschedulable', 'fixed time', 'must attend'],
        'defense': ['defense', 'thesis defense', 'dissertation defense'],
        'graduation': ['graduation', 'ceremony', 'commencement'],
        'work_shift': ['work shift', 'work schedule', 'shift', 'scheduled to work'],
        'event': ['birthday party', 'wedding', 'funeral', 'court date', 'deposition']
    }
    
    combined_text = (title + " " + description).lower()
    
    # Count keyword matches to determine confidence
    matches = {}
    for event_type, keywords in fixed_event_keywords.items():
        matches[event_type] = sum(1 for kw in keywords if kw in combined_text)
    
    max_matches = max(matches.values()) if matches else 0
    
    if max_matches > 0:
        event_type = max(matches, key=matches.get)
        confidence = min(max_matches / 2.0, 1.0)  # Normalize confidence
        return True, event_type, confidence
    
    # Check for negative indicators (false positives to avoid)
    false_positive_keywords = [
        'study for',
        'prepare for',
        'read about',
        'learn',
        'practice',
        'research',
        'get ready for',
        'complete before birthday',
        'finish before anniversary',
        'work on for',
        'help with'
    ]
    
    if any(kw in combined_text for kw in false_positive_keywords):
        return False, None, 0.0
    
    return False, None, 0.0


def format_12h(time_str):
    """Convert 24-hour time to 12-hour format"""
    if not time_str or ':' not in time_str:
        return time_str
    try:
        h, m = time_str.split(':')
        hour = int(h)
        suffix = 'AM' if hour < 12 else 'PM'
        hour12 = hour % 12 or 12
        return f"{hour12}:{m} {suffix}"
    except (ValueError, IndexError):
        return time_str


def check_overlap(start1, duration1, start2, duration2):
    """Check if two time periods overlap"""
    try:
        s1 = datetime.strptime(start1, '%H:%M')
        e1 = s1 + timedelta(minutes=int(duration1))
        s2 = datetime.strptime(start2, '%H:%M')
        e2 = s2 + timedelta(minutes=int(duration2))
        return not (e1 <= s2 or e2 <= s1)
    except (ValueError, TypeError):
        return False


def groq_task_schedule_suggestion_FIXED(task, work_schedules, all_tasks):
    """
    Generate intelligent task scheduling suggestions with FIXED EVENT PROTECTION.
    
    KEY CHANGES:
    1. Check if task is FIXED before checking conflicts
    2. If task is FIXED and conflicts with work, keep task locked, recommend work adjustment
    3. If task is FIXED and conflicts with other task, keep task locked
    4. Properly handle fixed vs fixed conflicts
    """
    
    # ===== EXTRACT TASK DETAILS =====
    task_title = task.get('title', 'Task')
    task_priority = task.get('priority', 'medium').lower()
    task_due_date = task.get('dueDate', '')
    task_duration = 120  # Default 2 hours
    
    if task_priority not in ['high', 'medium', 'low', 'urgent', 'critical']:
        task_priority = 'medium'
    
    # Parse due date
    try:
        due_date = datetime.fromisoformat(task_due_date.replace('Z', '+00:00'))
        due_day = due_date.strftime('%A')
        due_time = due_date.strftime('%H:%M')
    except ValueError:
        return {
            "type": "error",
            "message": "Unable to parse task due date",
            "suggestion": "Please set a specific due date and time for this task"
        }
    
    # ===== CRITICAL CHECK: Is this task FIXED? =====
    is_fixed, fixed_event_type, fixed_confidence = is_fixed_event(
        task_title, 
        task.get('description', '')
    )
    
    print(f"[AI] Task: {task_title}")
    print(f"[AI] Is Fixed: {is_fixed} (Type: {fixed_event_type}, Confidence: {fixed_confidence:.1%})")
    
    task_category = task.get('category', 'personal').lower()
    
    # ===== STEP 1: Check task vs work schedules =====
    work_schedule_conflicts = []
    
    for schedule in work_schedules:
        work_days = schedule.get('work_days', [])
        
        # Check if task due date is on a work day
        if due_day in work_days:
            schedule_start = schedule.get('start_time', '')
            schedule_end = schedule.get('end_time', '')
            
            # Calculate work schedule duration
            try:
                start_dt = datetime.strptime(schedule_start, '%H:%M')
                end_dt = datetime.strptime(schedule_end, '%H:%M')
                work_duration = int((end_dt - start_dt).total_seconds() / 60)
            except (ValueError, TypeError):
                work_duration = 480  # Default 8 hours
            
            # Debug: Show what we're checking
            print(f"[AI] Checking work conflict: {due_day} at {due_time} vs {schedule_start}-{schedule_end} ({work_duration}min)")
            
            if check_overlap(due_time, task_duration, schedule_start, work_duration):
                print(f"[AI] ⚠️ OVERLAP DETECTED: Task {due_time} overlaps with work {schedule_start}-{schedule_end}")
                work_schedule_conflicts.append({
                    'schedule_title': schedule.get('job_title', 'Work Schedule'),
                    'schedule_start': format_12h(schedule_start),
                    'schedule_end': format_12h(schedule_end),
                })
            else:
                print(f"[AI] ✓ No overlap: Task time and work hours don't conflict")
    
    # ===== CRITICAL LOGIC: Work Schedule Conflict =====
    if work_schedule_conflicts and task_category != 'work':
        conflict_info = work_schedule_conflicts[0]
        
        # Build work schedule summary
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # ===== KEY DECISION POINT =====
        if is_fixed:
            # ✅ FIXED EVENT - DO NOT RESCHEDULE
            print(f"[AI] ✓ FIXED EVENT DETECTED: Keeping {fixed_event_type} locked")
            
            # Generate context-specific recommendations
            recommendations = []
            if fixed_event_type in ['exam', 'test', 'quiz']:
                recommendations = [
                    "Request leave or time off from work for the exam",
                    "Ask employer for a partial shift (work until exam time, then leave)",
                    "Shift swap with coworker for this specific day",
                    "Prioritize the exam - it's an academic requirement"
                ]
            elif fixed_event_type == 'interview':
                recommendations = [
                    "Inform your employer about the interview",
                    "Request time off during the interview window",
                    "Schedule interview outside work hours if possible",
                    "This is an important professional opportunity"
                ]
            elif fixed_event_type in ['appointment', 'doctor', 'dentist']:
                recommendations = [
                    "Request a short break from work",
                    "See if appointment can be rescheduled to before/after work hours",
                    "Work from home if your employer allows flexible hours",
                    "Schedule appointment during lunch break if possible"
                ]
            elif fixed_event_type in ['graduation', 'ceremony']:
                recommendations = [
                    "Request leave from work - this is a major life event",
                    "Your employer should accommodate once-in-a-lifetime events",
                    "Plan in advance to minimize work impact",
                    "This event takes absolute priority"
                ]
            else:
                recommendations = [
                    f"This {fixed_event_type} is locked at {format_12h(due_time)}",
                    "Request leave or shift adjustment from your employer",
                    "Work schedule must accommodate this fixed event",
                    "If impossible to resolve, prioritize this fixed event"
                ]
            
            return {
                "type": "fixed_event_conflict",
                "analysis_step": " FIXED EVENT LOCKED - Work Schedule Conflict",
                "is_fixed_event": True,
                "fixed_event_type": fixed_event_type,
                "fixed_confidence": f"{fixed_confidence:.0%}",
                "conflict_with": conflict_info['schedule_title'],
                "work_schedule_time": f"{conflict_info['schedule_start']} – {conflict_info['schedule_end']}",
                "task": task_title,
                "priority": task_priority,
                "scheduled_time": format_12h(due_time),
                "suggested_time": format_12h(due_time),  # 🔒 NEVER CHANGE
                "reason": f"Your {fixed_event_type} '{task_title}' is LOCKED at {format_12h(due_time)} and CANNOT BE RESCHEDULED. It conflicts with your work schedule ({conflict_info['schedule_start']} – {conflict_info['schedule_end']}).",
                "key_message": f" {fixed_event_type.upper()} IS FIXED AND UNMOVABLE",
                "recommended_actions": recommendations,
                "work_schedules": work_schedule_summary,
                "tip": " Fixed events stay locked. Your work schedule must adapt around them."
            }
        else:
            # ❌ FLEXIBLE TASK - OK to reschedule
            print(f"[AI] ✓ Flexible task - rescheduling to avoid work hours")
            
            return {
                "type": "conflict",
                "analysis_step": "Task vs Work Schedule Conflict",
                "is_fixed_event": False,
                "conflict_with": conflict_info['schedule_title'],
                "work_schedule_time": f"{conflict_info['schedule_start']} – {conflict_info['schedule_end']}",
                "task": task_title,
                "priority": task_priority,
                "scheduled_time": format_12h(due_time),
                "suggested_time": "16:00",  # Suggest afternoon slot
                "reason": f"Your '{task_title}' conflicts with {conflict_info['schedule_title']} ({conflict_info['schedule_start']} – {conflict_info['schedule_end']}). Rescheduling to 4:00 PM.",
                "estimated_duration": "1–2 hours",
                "work_schedules": work_schedule_summary,
                "tip": "This flexible task has been rescheduled to avoid work hours."
            }
    
    # ===== STEP 2: Check task vs existing tasks =====
    fixed_event_conflicts = []
    task_conflicts = []
    same_day_tasks = []
    
    for existing_task in all_tasks:
        existing_due = existing_task.get('dueDate')
        if not existing_due:
            continue
        try:
            existing_due_dt = datetime.fromisoformat(existing_due.replace('Z', '+00:00'))
        except ValueError:
            continue
        
        existing_day = existing_due_dt.strftime('%A')
        existing_time = existing_due_dt.strftime('%H:%M')
        
        if existing_day != due_day:
            continue
        
        if str(existing_task.get('id')) != str(task.get('id')):
            same_day_tasks.append({
                'title': existing_task.get('title', ''),
                'time': existing_time,
                'priority': existing_task.get('priority', 'medium'),
                'is_fixed': existing_task.get('is_fixed', False)
            })
        
        existing_duration = 60
        has_overlap = check_overlap(existing_time, existing_duration, due_time, task_duration)
        
        if has_overlap and str(existing_task.get('id')) != str(task.get('id')):
            conflict_data = {
                'title': existing_task.get('title', ''),
                'time': existing_time,
                'date': existing_due_dt.strftime('%Y-%m-%d'),
                'priority': existing_task.get('priority', 'medium'),
                'is_fixed': existing_task.get('is_fixed', False)
            }
            
            if existing_task.get('is_fixed', False):
                fixed_event_conflicts.append(conflict_data)
            else:
                task_conflicts.append(conflict_data)
    
    # ===== Handle Fixed Event Conflicts =====
    if fixed_event_conflicts:
        fixed_event = fixed_event_conflicts[0]
        
        if is_fixed:
            # Both are fixed - CRITICAL ERROR
            return {
                "type": "critical_fixed_conflict",
                "analysis_step": " CRITICAL: Two Fixed Events at Same Time",
                "is_fixed_event": True,
                "fixed_event_type": fixed_event_type,
                "conflict_with_fixed": fixed_event['title'],
                "conflict_time": format_12h(fixed_event['time']),
                "task": task_title,
                "scheduled_time": format_12h(due_time),
                "suggested_time": format_12h(due_time),
                "reason": f"IMPOSSIBLE SCHEDULE: Both '{task_title}' and '{fixed_event['title']}' are locked at overlapping times.",
                "key_message": " Two unmovable events cannot both be scheduled.",
                "recommended_actions": [
                    f"Contact organizer of '{fixed_event['title']}' to check if rescheduling is possible",
                    "If not, you must choose which event to attend",
                    "This requires immediate human intervention"
                ],
                "tip": "When two fixed events conflict, manual resolution is required."
            }
        else:
            # New task is flexible, existing is fixed - reschedule new task
            return {
                "type": "fixed_conflict",
                "analysis_step": "Conflict with Fixed Event",
                "is_fixed_event": False,
                "conflict_with_fixed": fixed_event['title'],
                "conflict_time": format_12h(fixed_event['time']),
                "task": task_title,
                "scheduled_time": format_12h(due_time),
                "suggested_time": "15:00",  # Alternative time
                "reason": f"Your '{task_title}' conflicts with FIXED EVENT '{fixed_event['title']}' at {format_12h(fixed_event['time'])}. Rescheduling your task.",
                "tip": " Fixed events are locked. Your task will be rescheduled."
            }
    
    # ===== No Major Conflicts =====
    return {
        "type": "suggestion",
        "analysis_step": "Schedule Status",
        "is_fixed_event": is_fixed,
        "task": task_title,
        "priority": task_priority,
        "scheduled_time": format_12h(due_time),
        "suggested_time": format_12h(due_time) if is_fixed else "14:00",
        "reason": f"{'✓ Fixed event confirmed' if is_fixed else '✓ Schedule looks good'}.",
        "tip": "Your schedule is clear!" if not same_day_tasks else f"You have {len(same_day_tasks)} other task(s) today."
    }


# ============================================================================
# EXPORT FOR USE IN VIEWS.PY
# ============================================================================

def get_scheduling_suggestion(task, work_schedules, all_tasks):
    """
    Wrapper function for views.py to call the fixed event aware scheduler
    """
    return groq_task_schedule_suggestion_FIXED(task, work_schedules, all_tasks)


if __name__ == "__main__":
    # Test the function
    test_task = {
        'id': '123',
        'title': 'Take Final Exam in Data Structures',
        'description': 'Midterm exam, very important, cannot be rescheduled',
        'category': 'academic',
        'priority': 'high',
        'dueDate': '2026-04-27T10:30:00Z'
    }
    
    test_work_schedules = [{
        'job_title': 'Work Schedule',
        'work_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        'start_time': '07:30',
        'end_time': '15:30',
        'work_type': 'Part-time job'
    }]
    
    result = groq_task_schedule_suggestion_FIXED(test_task, test_work_schedules, [])
    print("\n" + "="*80)
    print("TEST RESULT:")
    print("="*80)
    print(json.dumps(result, indent=2))
    print("\n EXPECTED: Exam stays at 10:30 AM (LOCKED)")
    print(f" ACTUAL: Exam at {result['scheduled_time']} (unchanged: {result['suggested_time'] == result['scheduled_time']})")
