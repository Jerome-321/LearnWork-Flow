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
    1. Analyze task title and description for context (exam, meeting, birthday, etc.)
    2. Check task vs existing tasks for conflicts
    3. Check task vs work schedules for conflicts
    4. Suggest best available time
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
    
    def analyze_task_context(title, description):
        """Analyze task title and description for important context with Q1/Q3 enhancements"""
        title_lower = title.lower()
        desc_lower = (description or '').lower()
        combined = f"{title_lower} {desc_lower}"
        
        # Q3: Verb phrase analysis for intent extraction
        has_review_verb = any(word in combined for word in ['review', 'study', 'prepare for', 'read about'])
        has_attend_verb = any(word in combined for word in ['attend', 'go to', 'participate in', 'join'])
        has_take_verb = any(word in combined for word in ['take', 'sit for', 'complete'])
        
        context = {
            'is_exam': any(word in combined for word in ['exam', 'test', 'quiz', 'midterm', 'final']),
            'is_meeting': any(word in combined for word in ['meeting', 'appointment', 'interview', 'consultation']),
            'is_birthday': any(word in combined for word in ['birthday', 'bday', 'celebration', 'party']),
            'is_deadline': any(word in combined for word in ['deadline', 'due', 'submission', 'submit']),
            'is_presentation': any(word in combined for word in ['presentation', 'present', 'demo', 'pitch']),
            'is_study': any(word in combined for word in ['study', 'review', 'practice', 'prepare', 'read']),
            'is_project': any(word in combined for word in ['project', 'assignment', 'homework', 'essay']),
            'is_workout': any(word in combined for word in ['workout', 'exercise', 'gym', 'fitness']),
            'is_social': any(word in combined for word in ['hangout', 'dinner', 'lunch', 'coffee', 'date']),
            # Q1: Professional significance detection
            'is_boss_birthday': any(word in combined for word in ['boss', 'manager', 'supervisor', 'director']) and any(word in combined for word in ['birthday', 'bday']),
            'is_thesis_defense': any(word in combined for word in ['thesis', 'dissertation', 'defense', 'defence', 'capstone']),
            # Q3: Distinguish "review meeting notes" from "attend meeting"
            'is_meeting_prep': has_review_verb and 'meeting' in combined and not has_attend_verb,
            'is_exam_prep': (has_review_verb or 'practice' in combined) and context.get('is_exam', False) and not has_take_verb,
        }
        
        # Q3: Confidence scoring for ambiguous inputs
        confidence_score = 1.0
        if len(combined.split()) < 3:  # Very short input
            confidence_score = 0.4
        elif not any(context.values()):
            confidence_score = 0.5
        
        # Q1 Scenario A: Boss's birthday - professionally significant
        if context['is_boss_birthday']:
            return {
                'should_be_fixed': True,
                'message': 'Boss\'s birthday detected - Professionally significant social obligation',
                'professional_significance': 'high',
                'suggestion': 'Consider attending both by negotiating a partial shift with your employer',
                'confidence': confidence_score
            }
        
        # Q1 Scenario B: Thesis defense - once-in-a-semester milestone
        if context['is_thesis_defense']:
            return {
                'should_be_fixed': True,
                'message': 'Thesis defense detected - Once-in-a-semester academic milestone (non-negotiable)',
                'milestone_type': 'academic_critical',
                'override_work': True,
                'draft_leave_request': True,
                'confidence': confidence_score
            }
        
        # Q3 Scenario A: "Review meeting notes" - follow-up task, not live meeting
        if context['is_meeting_prep']:
            return {
                'should_be_fixed': False,
                'message': 'Meeting preparation detected - Follow-up task (flexible)',
                'task_type': 'preparation',
                'suggested_duration': 30,
                'confidence': confidence_score
            }
        
        # Q3 Scenario C: "Exam practice" vs "Take exam"
        if context['is_exam_prep']:
            return {
                'should_be_fixed': False,
                'message': 'Exam preparation detected - Flexible study session',
                'task_type': 'preparation',
                'add_buffer': False,
                'confidence': confidence_score
            }
        
        # Determine if this should be auto-marked as fixed
        should_be_fixed = (context['is_exam'] and has_take_verb) or context['is_meeting'] or context['is_birthday'] or context['is_presentation']
        
        # Q3: Add 30-min buffer before fixed events
        add_buffer = should_be_fixed and (context['is_exam'] or context['is_presentation'])
        
        # Generate context-aware message
        if context['is_exam'] and has_take_verb:
            return {'should_be_fixed': should_be_fixed, 'message': 'Exam detected - This is a critical fixed-time event', 'add_buffer': add_buffer, 'confidence': confidence_score}
        elif context['is_meeting']:
            return {'should_be_fixed': should_be_fixed, 'message': 'Meeting/Appointment detected - Fixed time commitment', 'add_buffer': False, 'confidence': confidence_score}
        elif context['is_birthday']:
            return {'should_be_fixed': should_be_fixed, 'message': 'Birthday/Celebration detected - Fixed event', 'add_buffer': False, 'confidence': confidence_score}
        elif context['is_presentation']:
            return {'should_be_fixed': should_be_fixed, 'message': 'Presentation detected - Fixed time event', 'add_buffer': add_buffer, 'confidence': confidence_score}
        elif context['is_deadline']:
            return {'should_be_fixed': False, 'message': 'Deadline detected - Plan ahead to avoid last-minute stress', 'confidence': confidence_score}
        elif context['is_study']:
            return {'should_be_fixed': False, 'message': 'Study session - Flexible timing recommended', 'confidence': confidence_score}
        elif context['is_project']:
            return {'should_be_fixed': False, 'message': 'Project work - Break into smaller sessions if needed', 'confidence': confidence_score}
        elif context['is_workout']:
            return {'should_be_fixed': False, 'message': 'Workout - Morning or evening slots work best', 'confidence': confidence_score}
        elif context['is_social']:
            return {'should_be_fixed': False, 'message': 'Social event - Consider your energy levels', 'confidence': confidence_score}
        
        # Q3 Scenario B: Low confidence - need clarification
        if confidence_score < 0.6:
            return {
                'should_be_fixed': False,
                'message': '',
                'confidence': confidence_score,
                'needs_clarification': True,
                'clarification_question': 'Is this a meeting, a social event, or a task preparation?'
            }
        
        return {'should_be_fixed': False, 'message': '', 'confidence': confidence_score}
    
    task_title = task.get('title', 'Task')
    task_description = task.get('description', '')
    task_priority = task.get('priority', 'medium').lower()
    task_due_date = task.get('dueDate', '')
    task_duration = 120  # Default 2 hours
    
    # ===== STEP 0: Analyze task context from title and description =====
    task_context = analyze_task_context(task_title, task_description)
    context_message = task_context.get('message', '')
    
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

    # If conflict with FIXED event - check if NEW task is also fixed
    if fixed_event_conflicts:
        fixed_event = fixed_event_conflicts[0]
        context_prefix = f"{context_message} " if context_message else ""
        
        # Build work schedule summary for context
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # CRITICAL: If the NEW task is ALSO a fixed event (exam, meeting, birthday)
        # Then KEEP original time and warn about conflict
        if task_context.get('should_be_fixed', False):
            analysis = f"{context_prefix}This is a fixed, non-adjustable event and cannot be rescheduled. However, it conflicts with '{fixed_event['title']}' at {format_12h(fixed_event['time'])}."
            
            return {
                "type": "fixed_vs_fixed_conflict",
                "analysis_step": "CRITICAL: Two Fixed Events Conflict",
                "conflict_with_fixed": fixed_event['title'],
                "conflict_time": format_12h(fixed_event['time']),
                "task": task_title,
                "priority": task_priority,
                "scheduled_time": format_12h(due_time),
                "suggested_time": due_time,  # KEEP ORIGINAL TIME
                "reason": analysis + " Both events are fixed and cannot be moved. You may need to choose which one to attend or find a way to attend both.",
                "estimated_duration": "1-2 hours",
                "work_schedules": work_schedule_summary,
                "tip": "⚠️ CRITICAL: Both events are fixed and cannot be rescheduled. Consider:
• Requesting schedule changes from organizers
• Partial attendance if possible
• Prioritizing based on importance",
                "context_detected": context_message,
                "should_mark_fixed": True
            }
        
        # If NEW task is flexible, reschedule it to avoid fixed event
        analysis = f"{context_prefix}FIXED EVENT CONFLICT: Your '{task_title}' conflicts with FIXED EVENT '{fixed_event['title']}' at {format_12h(fixed_event['time'])}. This event cannot be moved."
        
        # Find alternative time avoiding ALL fixed events
        alternative_time = _find_alternative_avoiding_fixed(due_day, fixed_event_conflicts, all_tasks, task_priority)
        
        return {
            "type": "fixed_conflict",
            "analysis_step": "CRITICAL: Conflict with Fixed Event Detected",
            "conflict_with_fixed": fixed_event['title'],
            "conflict_time": format_12h(fixed_event['time']),
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": alternative_time.get('suggested_time', '14:00'),
            "reason": analysis + f" MUST RESCHEDULE to {format_12h(alternative_time.get('suggested_time', '14:00'))} to avoid fixed event." + (f" {context_message}" if context_message and not context_message in analysis else ""),
            "estimated_duration": "1-2 hours",
            "work_schedules": work_schedule_summary,
            "tip": "CRITICAL: Fixed events (exams, meetings, birthdays, appointments) cannot be moved. Other tasks must work around them.",
            "context_detected": context_message,
            "should_mark_fixed": task_context.get('should_be_fixed', False)
        }
    
    # If task vs task conflict found (non-fixed)
    if task_conflicts:
        conflict_task = task_conflicts[0]
        context_prefix = f"{context_message} " if context_message else ""
        
        # Priority-aware conflict resolution
        if task_priority == 'high' and conflict_task['priority'] in ['medium', 'low']:
            priority_note = f" Your HIGH-priority task should take precedence over the {conflict_task['priority']}-priority '{conflict_task['title']}'."
        elif task_priority == 'low' and conflict_task['priority'] in ['high', 'critical']:
            priority_note = f" The {conflict_task['priority']}-priority '{conflict_task['title']}' should take precedence over your low-priority task."
        else:
            priority_note = f" Both tasks have similar priority levels ({task_priority} vs {conflict_task['priority']})."
        
        analysis = f"{context_prefix}TASK CONFLICT: Your '{task_title}' ({task_priority} priority) overlaps with '{conflict_task['title']}' ({conflict_task['priority']} priority) at {format_12h(conflict_task['time'])}.{priority_note}"
        
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
        
        # Find alternative considering priority
        alternative = _find_alternative_by_priority(due_day, same_day_tasks, task_priority, work_schedules)
        
        return {
            "type": "conflict",
            "analysis_step": "Task Overlap Detected - Priority-Based Resolution",
            "conflict_with_task": conflict_task['title'],
            "conflict_time": format_12h(conflict_task['time']),
            "conflict_priority": conflict_task['priority'],
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": alternative.get('suggested_time', '14:00'),
            "reason": analysis + other_tasks_info + f" Rescheduling to {format_12h(alternative.get('suggested_time', '14:00'))} to avoid overlap. {alternative.get('reason', '')}",
            "estimated_duration": "1-2 hours",
            "work_schedules": work_schedule_summary,
            "same_day_tasks": len(same_day_tasks),
            "tip": _get_productivity_tip(task_priority),
            "priority_guidance": priority_note
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
        context_prefix = f"{context_message} " if context_message else ""
        
        # Build work schedule summary (show all for context)
        work_schedule_summary = []
        for schedule in work_schedules:
            if due_day in schedule.get('work_days', []):
                work_schedule_summary.append({
                    'job_title': schedule.get('job_title', 'Work Schedule'),
                    'start_time': format_12h(schedule.get('start_time', '')),
                    'end_time': format_12h(schedule.get('end_time', '')),
                })
        
        # CRITICAL: If task is FIXED (exam, meeting, birthday), KEEP original time
        if task_context.get('should_be_fixed', False):
            work_details = f"WORK SCHEDULE CONFLICT: Your '{task_title}' at {format_12h(due_time)} conflicts with '{conflict_info['schedule_title']}' ({conflict_info['schedule_start']} - {conflict_info['schedule_end']})."
            analysis = f"{context_prefix}{work_details} However, this is a fixed, non-adjustable event and cannot be rescheduled."
            
            return {
                "type": "fixed_vs_work_conflict",
                "analysis_step": "Fixed Event Conflicts with Work Schedule",
                "conflict_with": conflict_info['schedule_title'],
                "work_schedule_time": f"{conflict_info['schedule_start']} - {conflict_info['schedule_end']}",
                "task": task_title,
                "priority": task_priority,
                "scheduled_time": format_12h(due_time),
                "suggested_time": due_time,  # KEEP ORIGINAL TIME
                "reason": analysis + " Recommended actions:\n• Request leave or shift adjustment\n• Notify employer in advance\n• Prioritize this event (cannot be rescheduled)",
                "estimated_duration": "1-2 hours",
                "work_schedules": work_schedule_summary,
                "tip": "⚠️ This event cannot be rescheduled. You may need to adjust your work schedule.",
                "work_conflict_details": f"You work {conflict_info['schedule_start']}-{conflict_info['schedule_end']} on {due_day}s",
                "should_mark_fixed": True
            }
        
        # If task is flexible, reschedule to avoid work
        work_details = f"WORK SCHEDULE CONFLICT: Your '{task_title}' at {format_12h(due_time)} conflicts with '{conflict_info['schedule_title']}' ({conflict_info['schedule_start']} - {conflict_info['schedule_end']})."
        analysis = f"{context_prefix}{work_details} You are scheduled to work during this time and cannot complete academic tasks."
        
        # Find time that avoids work schedule
        alternative = _find_alternative_avoiding_work(due_day, work_schedules, task_priority)
        
        return {
            "type": "conflict",
            "analysis_step": "Work Schedule Conflict Detected",
            "conflict_with": conflict_info['schedule_title'],
            "work_schedule_time": f"{conflict_info['schedule_start']} - {conflict_info['schedule_end']}",
            "task": task_title,
            "priority": task_priority,
            "scheduled_time": format_12h(due_time),
            "suggested_time": alternative.get('suggested_time', '14:00'),
            "reason": analysis + f" Rescheduling to {format_12h(alternative.get('suggested_time', '14:00'))} to avoid work hours. {alternative.get('reason', '')}",
            "estimated_duration": "1-2 hours",
            "work_schedules": work_schedule_summary,
            "tip": _get_productivity_tip(task_priority),
            "work_conflict_details": f"You work {conflict_info['schedule_start']}-{conflict_info['schedule_end']} on {due_day}s"
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
        
        context_prefix = f"{context_message} " if context_message else ""
        analysis = f"{context_prefix}📅 Schedule Awareness: You have {len(same_day_tasks)} other task(s) on {due_day}: {task_list}. While there's no direct time conflict, consider spacing your tasks throughout the day for better productivity."
        
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
    
    context_prefix = f"{context_message} " if context_message else ""
    analysis = f"{context_prefix}✅ Clear Schedule: No conflicts detected. Your schedule looks good for this task!"

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
        'high': ' Tip: Schedule high-priority tasks early in the day when your focus is sharpest.',
        'medium': ' Tip: Balance your schedule by spacing medium-priority tasks throughout the day.',
        'low': ' Tip: Low-priority tasks can be batched together or scheduled flexibly around your main commitments.'
    }
    
    return tips.get(priority, tips['medium'])


def _find_alternative_by_priority(day, same_day_tasks, priority, work_schedules):
    """Find alternative time slot based on task priority and existing schedule"""
    # Priority-based time slots (ordered by preference)
    priority_slots = {
        'critical': ['09:00', '10:00', '08:00', '11:00', '14:00'],
        'high': ['09:00', '10:00', '11:00', '14:00', '15:00'],
        'medium': ['14:00', '15:00', '16:00', '10:00', '11:00'],
        'low': ['17:00', '18:00', '19:00', '16:00', '15:00']
    }
    
    candidate_times = priority_slots.get(priority, priority_slots['medium'])
    
    def time_to_minutes(time_str):
        h, m = time_str.split(':')
        return int(h) * 60 + int(m)
    
    # Get occupied times
    occupied = []
    for task in same_day_tasks:
        occupied.append(time_to_minutes(task['time']))
    
    # Get work schedule times
    work_times = []
    for schedule in work_schedules:
        if day in schedule.get('work_days', []):
            work_times.append({
                'start': time_to_minutes(schedule.get('start_time', '09:00')),
                'end': time_to_minutes(schedule.get('end_time', '17:00'))
            })
    
    # Find first available slot
    for candidate in candidate_times:
        candidate_minutes = time_to_minutes(candidate)
        
        # Check if occupied by other tasks
        if candidate_minutes in occupied:
            continue
        
        # Check if conflicts with work
        conflicts_work = False
        for work in work_times:
            if work['start'] <= candidate_minutes < work['end']:
                conflicts_work = True
                break
        
        if not conflicts_work:
            time_desc = "morning" if candidate_minutes < 720 else "afternoon" if candidate_minutes < 1020 else "evening"
            priority_desc = "Critical tasks need your peak focus time" if priority == 'critical' else \
                           "High-priority tasks work best in focused time blocks" if priority == 'high' else \
                           "Medium-priority tasks fit well in steady productivity hours" if priority == 'medium' else \
                           "Low-priority tasks can be scheduled flexibly"
            
            return {
                'suggested_time': candidate,
                'reason': f'{priority_desc}. This {time_desc} slot is optimal for your {priority}-priority task.'
            }
    
    # Fallback
    return {
        'suggested_time': '20:00',
        'reason': 'Evening slot available'
    }


def _find_alternative_avoiding_work(day, work_schedules, priority):
    """Find alternative time slot that avoids work schedules"""
    # Get all work times on this day
    work_times = []
    for schedule in work_schedules:
        if day in schedule.get('work_days', []):
            work_times.append({
                'start': schedule.get('start_time', ''),
                'end': schedule.get('end_time', '')
            })
    
    # Priority-based time slots
    priority_slots = {
        'high': ['09:00', '10:00', '11:00', '08:00', '07:00'],
        'medium': ['14:00', '15:00', '13:00', '16:00', '10:00'],
        'low': ['17:00', '18:00', '19:00', '20:00', '16:00']
    }
    
    candidate_times = priority_slots.get(priority, priority_slots['medium'])
    
    def time_to_minutes(time_str):
        h, m = time_str.split(':')
        return int(h) * 60 + int(m)
    
    # Find first slot that doesn't conflict with work
    for candidate in candidate_times:
        conflicts = False
        candidate_minutes = time_to_minutes(candidate)
        
        for work in work_times:
            work_start = time_to_minutes(work['start'])
            work_end = time_to_minutes(work['end'])
            
            # Handle overnight shifts
            if work_end < work_start:
                if candidate_minutes >= work_start or candidate_minutes < work_end:
                    conflicts = True
                    break
            else:
                if work_start <= candidate_minutes < work_end:
                    conflicts = True
                    break
        
        if not conflicts:
            time_desc = "morning" if candidate_minutes < 720 else "afternoon" if candidate_minutes < 1020 else "evening"
            return {
                'suggested_time': candidate,
                'reason': f'This {time_desc} slot avoids your work schedule and suits your {priority}-priority task'
            }
    
    # Fallback
    return {
        'suggested_time': '20:00',
        'reason': 'Evening slot after work hours'
    }


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