import os
import json
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime

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
    Generate intelligent task scheduling suggestions considering:
    - Work schedules as fixed constraints
    - Task priority (High, Medium, Low)
    - Optimal time slots around work schedule
    - Conflict detection
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
        """
        Check if task overlaps with schedule
        Condition: startA < endB AND endA > startB
        """
        task_start_min = time_to_minutes(task_time)
        task_end_min = task_start_min + task_duration
        
        schedule_start_min = time_to_minutes(schedule_start)
        schedule_end_min = time_to_minutes(schedule_end)
        
        # Handle overnight shifts
        if schedule_end_min < schedule_start_min:  # overnight
            # Task overlaps if it's after start OR before end
            return (task_start_min >= schedule_start_min) or (task_end_min <= schedule_end_min)
        else:  # same day
            # Standard overlap check
            return task_start_min < schedule_end_min and task_end_min > schedule_start_min
    
    task_title = task.get('title', 'Task')
    task_priority = task.get('priority', 'medium').lower()
    task_due_date = task.get('dueDate', '')
    task_duration = 120  # Default 2 hours
    
    # Validate priority
    if task_priority not in ['high', 'medium', 'low']:
        task_priority = 'medium'
    
    # Parse due date to get day
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
    
    # Check for conflicts with work schedules
    conflicts = []
    for schedule in work_schedules:
        if due_day in schedule.get('work_days', []):
            schedule_start = schedule.get('start_time', '')
            schedule_end = schedule.get('end_time', '')
            
            if check_overlap(due_time, task_duration, schedule_start, schedule_end):
                conflicts.append({
                    'schedule_title': schedule.get('job_title', 'Work Schedule'),
                    'schedule_start': format_12h(schedule_start),
                    'schedule_end': format_12h(schedule_end),
                })
    
    # If conflicts exist, generate conflict warning + alternative
    if conflicts:
        conflict_info = conflicts[0]
        
        # Find alternative time slots
        alternative_slots = _find_alternative_slots(
            due_day, conflicts, task_priority
        )
        
        return {
            "type": "conflict",
            "title": "⚠ Conflict Detected",
            "conflict": {
                "task": task_title,
                "priority": task_priority,
                "scheduled_time": format_12h(due_time),
                "work_schedule": conflict_info['schedule_title'],
                "work_schedule_time": f"{conflict_info['schedule_start']} – {conflict_info['schedule_end']}"
            },
            "suggestion": alternative_slots.get('suggestion', 'Please check your calendar'),
            "reason": alternative_slots.get('reason', 'Rescheduling based on availability'),
            "tip": _get_productivity_tip(task_priority)
        }
    
    # No conflict - suggest best time
    best_slot = _find_best_slot(due_day, conflicts, task_priority, work_schedules)
    
    return {
        "type": "suggestion",
        "title": "💡 Suggested Schedule",
        "task": task_title,
        "priority": task_priority,
        "suggested_time": best_slot.get('time', format_12h(due_time)),
        "reason": best_slot.get('reason', 'Optimal time based on your priority and availability'),
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
        "suggestion": f"Move task to {format_12h(start_time)} – {format_12h(end_time)}",
        "reason": reason
    }


def _find_best_slot(day, conflicts, priority, work_schedules):
    """Find optimal time slot for task"""
    priority_guidance = {
        'high': {
            'slot': '09:00 – 11:00',
            'reason': 'This avoids your work schedule and prioritizes your high-priority task during peak morning focus time'
        },
        'medium': {
            'slot': '14:00 – 16:00',
            'reason': 'This is an optimal afternoon slot when mental energy is steady and complements your work schedule'
        },
        'low': {
            'slot': '17:00 – 19:00',
            'reason': 'This flexible time slot works well for lower-priority tasks without conflicting with other commitments'
        }
    }
    
    slot_info = priority_guidance.get(priority, priority_guidance['medium'])
    
    return {
        "time": slot_info['slot'],
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