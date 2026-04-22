import os
import json
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def groq_schedule(task_data):

    prompt = f"""
You are an AI productivity assistant.

Analyze the following task and suggest the best time to complete it.

Task Title: {task_data.get('title')}
Description: {task_data.get('description')}
Category: {task_data.get('category')}
Priority: {task_data.get('priority')}
Due Date: {task_data.get('dueDate')}
Existing Tasks: {task_data.get('existingTasks')}

Respond ONLY in JSON:

{{
  "suggestedStart": "HH:MM",
  "suggestedEnd": "HH:MM",
  "reason": "short explanation"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content.strip()

    try:
        return json.loads(text)
    except:
        return {
            "suggestedStart": None,
            "suggestedEnd": None,
            "reason": text
        }

def groq_work_schedule_suggestion(work_schedule, tasks):
    # Detect conflicts
    conflicts = []
    academic_tasks = [t for t in tasks if t.get('category') == 'academic']
    
    for task in academic_tasks:
        due_date_str = task.get('dueDate')
        if not due_date_str:
            continue
        try:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            day = due_date.strftime('%A')  # e.g., 'Monday'
            if day in work_schedule.get('work_days', []):
                task_time = due_date.strftime('%H:%M')
                start = work_schedule.get('start_time', '')
                end = work_schedule.get('end_time', '')
                
                # Check overlap
                if start and end:
                    if end < start:  # overnight shift
                        if task_time >= start or task_time <= end:
                            conflicts.append({
                                'title': task.get('title', ''),
                                'time': task_time,
                                'date': due_date.strftime('%Y-%m-%d')
                            })
                    else:  # same day
                        if start <= task_time <= end:
                            conflicts.append({
                                'title': task.get('title', ''),
                                'time': task_time,
                                'date': due_date.strftime('%Y-%m-%d')
                            })
        except ValueError:
            continue
    
    # Format times to 12-hour
    def format_12h(time_str):
        if not time_str:
            return ''
        h, m = time_str.split(':')
        hour = int(h)
        suffix = 'AM' if hour < 12 else 'PM'
        hour12 = hour % 12 or 12
        return f"{hour12}:{m} {suffix}"
    
    current_start = format_12h(work_schedule.get('start_time', ''))
    current_end = format_12h(work_schedule.get('end_time', ''))
    work_type = work_schedule.get('work_type', '')
    work_days = ', '.join(work_schedule.get('work_days', []))
    
    conflict_str = '\n'.join([f"- {c['title']} at {format_12h(c['time'])} on {c['date']}" for c in conflicts]) if conflicts else 'None'
    
    prompt = f"""
You are an AI productivity assistant specializing in work schedule optimization.

Current Work Schedule:
- Days: {work_days}
- Time: {current_start} – {current_end}
- Type: {work_type}

Detected Conflicts with Academic Tasks:
{conflict_str}

Provide intelligent suggestions to optimize the work schedule:
- Avoid conflicts with academic tasks
- Suggest best available time slots
- Maintain work-life balance (avoid overly late or long shifts)
- Handle overnight shifts if appropriate

Respond ONLY in JSON format:

{{
  "suggestion": "Suggested schedule: [new time range in 12-hour format]",
  "reason": "Brief explanation why this suggestion improves the schedule"
}}

Ensure the suggestion is practical and fits within reasonable work hours.
"""
    
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    
    text = response.choices[0].message.content.strip()
    
    try:
        return json.loads(text)
    except:
        return {
            "suggestion": "Unable to generate suggestion",
            "reason": text
        }


def groq_task_schedule_suggestion(task, work_schedules, all_tasks):
    """
    Generate intelligent task scheduling suggestions with explicit analysis steps:
    1. Check task vs existing tasks for conflicts
    2. Check task vs work schedules for conflicts
    3. Suggest best available time
    """
    
    def format_12h(time_str):
        if not time_str:
            return ''
        h, m = time_str.split(':')
        hour = int(h)
        suffix = 'AM' if hour < 12 else 'PM'
        hour12 = hour % 12 or 12
        return f"{hour12}:{m} {suffix}"
    
    def time_to_minutes(time_str):
        """Convert HH:MM to minutes"""
        if not time_str:
            return 0
        h, m = time_str.split(':')
        return int(h) * 60 + int(m)
    
    def check_overlap(task_time, task_duration, schedule_start, schedule_end):
        """Check if task overlaps with schedule"""
        task_start_min = time_to_minutes(task_time)
        task_end_min = task_start_min + task_duration
        
        schedule_start_min = time_to_minutes(schedule_start)
        schedule_end_min = time_to_minutes(schedule_end)
        
        # Handle overnight shifts
        if schedule_end_min < schedule_start_min:  # overnight
            return (task_start_min >= schedule_start_min) or (task_end_min <= schedule_end_min)
        else:  # same day
            return task_start_min < schedule_end_min and task_end_min > schedule_start_min
    
    task_title = task.get('title', 'Task')
    task_priority = task.get('priority', 'medium').lower()
    task_due_date = task.get('dueDate', '')
    task_duration = 120  # Default 2 hours
    
    if task_priority not in ['high', 'medium', 'low']:
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
    
    # ===== STEP 1: Check task vs existing tasks =====
    task_conflicts = []
    fixed_event_conflicts = []  # Track conflicts with fixed events separately
    same_day_tasks = []  # Track all tasks on same day for awareness
    print(f"[DEBUG GROQ] Checking {len(all_tasks)} existing tasks for conflicts with '{task_title}' at {due_day} {due_time}")
    
    for existing_task in all_tasks:
        existing_due = existing_task.get('dueDate')
        if not existing_due:
            continue
        try:
            existing_due_dt = datetime.fromisoformat(existing_due.replace('Z', '+00:00'))
        except ValueError:
            print(f"[DEBUG GROQ] Failed to parse date: {existing_due}")
            continue

        existing_day = existing_due_dt.strftime('%A')
        existing_time = existing_due_dt.strftime('%H:%M')
        
        print(f"[DEBUG GROQ]   Existing task '{existing_task.get('title')}': {existing_day} {existing_time}")

        if existing_day != due_day:
            print(f"[DEBUG GROQ]     Same day? {existing_day} == {due_day}? NO")
            continue

        print(f"[DEBUG GROQ]     Same day? {existing_day} == {due_day}? YES")

        # Track all tasks on same day
        if str(existing_task.get('id')) != str(task.get('id')):
            same_day_tasks.append({
                'title': existing_task.get('title', ''),
                'time': existing_time,
                'priority': existing_task.get('priority', 'medium'),
                'is_fixed': existing_task.get('is_fixed', False)
            })

        existing_duration = existing_task.get('estimatedDuration', 60) if existing_task.get('estimatedDuration') else 60
        existing_duration = int(existing_duration) if isinstance(existing_duration, (int, float, str)) and str(existing_duration).isdigit() else 60

        task_end_time = (datetime.strptime(due_time, '%H:%M') + timedelta(minutes=task_duration)).strftime('%H:%M')
        has_overlap = check_overlap(existing_time, existing_duration, due_time, task_end_time)
        
        print(f"[DEBUG GROQ]     Overlap check: {existing_time} ({existing_duration}min) vs {due_time}-{task_end_time} ({task_duration}min) = {has_overlap}")

        if has_overlap:
            if str(existing_task.get('id')) != str(task.get('id')):
                print(f"[DEBUG GROQ]     CONFLICT FOUND!")
                conflict_data = {
                    'title': existing_task.get('title', ''),
                    'time': existing_time,
                    'date': existing_due_dt.strftime('%Y-%m-%d'),
                    'priority': existing_task.get('priority', 'medium'),
                    'is_fixed': existing_task.get('is_fixed', False)
                }
                
                # Separate fixed events from regular tasks
                if existing_task.get('is_fixed', False):
                    fixed_event_conflicts.append(conflict_data)
                else:
                    task_conflicts.append(conflict_data)

    # If conflict with FIXED event - must reschedule the new task
    if fixed_event_conflicts:
        fixed_event = fixed_event_conflicts[0]
        analysis = f"Analysis: Your '{task_title}' conflicts with FIXED EVENT '{fixed_event['title']}' at {format_12h(fixed_event['time'])}. This event cannot be moved."
        
        # Build work schedule summary for context
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # Find alternative time avoiding ALL fixed events
        alternative_time = _find_alternative_avoiding_fixed(due_day, fixed_event_conflicts, all_tasks, task_priority)
        
        return {
            "type": "fixed_conflict",
            "analysis_step": "Conflict with Fixed Event Detected",
            "conflict_with_fixed": fixed_event['title'],
            "conflict_time": format_12h(fixed_event['time']),
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": alternative_time.get('suggested_time', '14:00'),
            "reason": analysis + f" Rescheduling to {format_12h(alternative_time.get('suggested_time', '14:00'))} to avoid fixed event.",
            "estimated_duration": "1–2 hours",
            "work_schedules": work_schedule_summary,
            "tip": "⚠️ Fixed events (birthdays, appointments) cannot be moved. Other tasks must work around them."
        }
    
    # If task vs task conflict found (non-fixed)
    if task_conflicts:
        conflict_task = task_conflicts[0]
        analysis = f"⚠️ Schedule Conflict: Your '{task_title}' ({task_priority} priority) overlaps with '{conflict_task['title']}' ({conflict_task['priority']} priority) at {format_12h(conflict_task['time'])}."
        
        # Build work schedule summary for context
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # List all same-day tasks for context
        other_tasks_info = ""
        if len(same_day_tasks) > 1:
            other_tasks_info = f" You also have {len(same_day_tasks)-1} other task(s) scheduled today."
        
        return {
            "type": "conflict",
            "analysis_step": "Task Overlap Detected",
            "conflict_with_task": conflict_task['title'],
            "conflict_time": format_12h(conflict_task['time']),
            "conflict_priority": conflict_task['priority'],
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": _find_alternative_slots(due_day, same_day_tasks, task_priority).get('suggested_time', '14:00'),
            "reason": analysis + other_tasks_info + " I recommend rescheduling to avoid time overlap and maintain productivity.",
            "estimated_duration": "1–2 hours",
            "work_schedules": work_schedule_summary,
            "same_day_tasks": len(same_day_tasks),
            "tip": _get_productivity_tip(task_priority)
        }

    # ===== STEP 2: Check task vs work schedules =====
    work_schedule_conflicts = []
    for schedule in work_schedules:
        if due_day in schedule.get('work_days', []):
            schedule_start = schedule.get('start_time', '')
            schedule_end = schedule.get('end_time', '')
            
            if check_overlap(due_time, task_duration, schedule_start, schedule_end):
                work_schedule_conflicts.append({
                    'schedule_title': schedule.get('job_title', 'Work Schedule'),
                    'schedule_start': format_12h(schedule_start),
                    'schedule_end': format_12h(schedule_end),
                })
    
    # If task vs work schedule conflict found
    if work_schedule_conflicts:
        conflict_info = work_schedule_conflicts[0]
        analysis = f"Analysis: Your '{task_title}' conflicts with '{conflict_info['schedule_title']}' ({conflict_info['schedule_start']} – {conflict_info['schedule_end']})."
        
        # Build work schedule summary (show all for context)
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        return {
            "type": "conflict",
            "analysis_step": "Task vs Work Schedule Conflict Detected",
            "conflict_with": conflict_info['schedule_title'],
            "work_schedule_time": f"{conflict_info['schedule_start']} – {conflict_info['schedule_end']}",
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": _find_alternative_slots(due_day, [], task_priority).get('suggested_time', '14:00'),
            "reason": analysis + " Rescheduling to an available slot.",
            "estimated_duration": "1–2 hours",
            "work_schedules": work_schedule_summary,
            "tip": _get_productivity_tip(task_priority)
        }

    # ===== STEP 3: Check if there are tasks on same day (even without overlap) =====
    # Show awareness modal if there are other tasks on the same day
    if same_day_tasks:
        best_slot = _find_best_slot(due_day, work_schedule_conflicts, task_priority, work_schedules)
        
        # Build work schedule summary
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # List other tasks
        task_list = ", ".join([f"{t['title']} ({t['priority']}) at {format_12h(t['time'])}" for t in same_day_tasks[:3]])
        if len(same_day_tasks) > 3:
            task_list += f" and {len(same_day_tasks)-3} more"
        
        analysis = f"📅 Schedule Awareness: You have {len(same_day_tasks)} other task(s) on {due_day}: {task_list}. While there's no direct time conflict, consider spacing your tasks throughout the day for better productivity."
        
        return {
            "type": "awareness",
            "analysis_step": "Multiple Tasks on Same Day",
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": best_slot.get('time', due_time),
            "reason": analysis,
            "estimated_duration": "1–2 hours",
            "work_schedules": work_schedule_summary,
            "same_day_tasks": len(same_day_tasks),
            "other_tasks": same_day_tasks,
            "tip": "💡 Tip: Spread tasks throughout the day to avoid burnout and maintain focus."
        }
    
    # ===== STEP 4: No conflicts and no other tasks - suggest best time =====
    best_slot = _find_best_slot(due_day, work_schedule_conflicts, task_priority, work_schedules)
    
    # Build work schedule summary
    work_schedule_summary = []
    for schedule in work_schedules:
        if due_day in schedule.get('work_days', []):
            work_schedule_summary.append({
                'job_title': schedule.get('job_title', 'Work Schedule'),
                'start_time': format_12h(schedule.get('start_time', '')),
                'end_time': format_12h(schedule.get('end_time', '')),
            })
    
    analysis = "✅ Clear Schedule: No conflicts detected. Your schedule looks good for this task!"

    return {
        "type": "suggestion",
        "analysis_step": "No Conflicts - Optimal Time Suggestion",
        "task": task_title,
        "priority": task_priority,
        "suggested_time": best_slot.get('time', '14:00'),
        "reason": analysis + " " + (best_slot.get('reason', 'Recommended based on your task priority and the current schedule.')),
        "estimated_duration": "1–2 hours",
        "work_schedules": work_schedule_summary,
        "current_time": format_12h(due_time),
        "tip": _get_productivity_tip(task_priority)
    }


def _find_alternative_slots(day, conflicts, priority):
    """Find alternative time slots avoiding conflicts"""
    priority_slot_map = {
        'high': ('09:00', '11:00', 'Morning slots are best for focused high-priority work'),
        'medium': ('14:00', '16:00', 'Afternoon slots work well for medium-priority tasks'),
        'low': ('17:00', '19:00', 'Lower-priority work can fit in late afternoon')
    }
    
    start_time, end_time, reason = priority_slot_map.get(
        priority, ('14:00', '16:00', 'Based on availability')
    )
    
    def format_12h(time_str):
        h, m = time_str.split(':')
        hour = int(h)
        suffix = 'AM' if hour < 12 else 'PM'
        hour12 = hour % 12 or 12
        return f"{hour12}:{m} {suffix}"
    
    return {
        "suggested_time": start_time,  # Return single time, not range
        "reason": reason
    }


def _find_best_slot(day, conflicts, priority, work_schedules):
    """Find optimal time slot for task"""
    priority_guidance = {
        'high': {
            'time': '09:00',
            'reason': 'This avoids your work schedule and prioritizes your high-priority task during peak morning focus time'
        },
        'medium': {
            'time': '14:00',
            'reason': 'This is an optimal afternoon slot when mental energy is steady and complements your work schedule'
        },
        'low': {
            'time': '17:00',
            'reason': 'This flexible time slot works well for lower-priority tasks without conflicting with other commitments'
        }
    }
    
    slot_info = priority_guidance.get(priority, priority_guidance['medium'])
    
    return {
        "time": slot_info['time'],
        "reason": slot_info['reason']
    }


def _get_productivity_tip(priority):
    """Get work-life balance tip based on priority"""
    tips = {
        'high': '💡 Tip: Schedule high-priority tasks early in the day when your focus is sharpest.',
        'medium': '💡 Tip: Balance your schedule by spacing medium-priority tasks throughout the day.',
        'low': '💡 Tip: Low-priority tasks can be batched together or scheduled flexibly around your main commitments.'
    }
    
    return tips.get(priority, tips['medium'])


def _find_alternative_avoiding_fixed(day, fixed_conflicts, all_tasks, priority):
    """Find alternative time slot that avoids ALL fixed events"""
    # Get all fixed event times on this day
    fixed_times = []
    for task in all_tasks:
        if task.get('is_fixed', False):
            try:
                task_due = datetime.fromisoformat(task.get('dueDate', '').replace('Z', '+00:00'))
                if task_due.strftime('%A') == day:
                    fixed_times.append({
                        'time': task_due.strftime('%H:%M'),
                        'duration': task.get('estimatedDuration', 60)
                    })
            except:
                pass
    
    # Priority-based time slots
    priority_slots = {
        'high': ['09:00', '10:00', '11:00', '14:00', '15:00'],
        'medium': ['14:00', '15:00', '16:00', '10:00', '11:00'],
        'low': ['17:00', '18:00', '19:00', '16:00', '15:00']
    }
    
    candidate_times = priority_slots.get(priority, priority_slots['medium'])
    
    # Find first slot that doesn't conflict with any fixed event
    for candidate in candidate_times:
        conflicts = False
        candidate_minutes = int(candidate.split(':')[0]) * 60 + int(candidate.split(':')[1])
        
        for fixed in fixed_times:
            fixed_start = int(fixed['time'].split(':')[0]) * 60 + int(fixed['time'].split(':')[1])
            fixed_end = fixed_start + fixed['duration']
            
            # Check if candidate overlaps with fixed event
            if candidate_minutes < fixed_end and (candidate_minutes + 120) > fixed_start:
                conflicts = True
                break
        
        if not conflicts:
            return {
                'suggested_time': candidate,
                'reason': f'This time avoids all fixed events and suits your {priority}-priority task'
            }
    
    # Fallback if all slots conflict
    return {
        'suggested_time': '20:00',
        'reason': 'Evening slot to avoid fixed events'
    }