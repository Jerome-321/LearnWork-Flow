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