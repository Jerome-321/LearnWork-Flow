from datetime import datetime, timedelta

def rule_scheduler(task_data):
    """
    ✅ FIX #5: Improved rule-based task scheduling
    Uses priority, deadline, duration, and category for optimal scheduling
    """
    
    category = task_data.get("category", "personal")
    priority = task_data.get("priority", "medium")
    dueDate = task_data.get("dueDate")
    duration = task_data.get("estimatedDuration", 60)
    existing_tasks = task_data.get("existingTasks", [])
    
    # Rule 1: Category-based default slots
    category_times = {
        "academic": "19:00",   # Evening (study time)
        "work": "10:00",       # Morning (work hours)
        "personal": "18:00"    # Late afternoon
    }
    
    best_time = category_times.get(category, "18:00")
    
    # Rule 2: Priority-based time shifting
    if priority == "high":
        # High priority → earlier in day
        if category == "academic":
            best_time = "17:00"  # 2 hours earlier
        elif category == "work":
            best_time = "09:00"  # 1 hour earlier
        else:
            best_time = "14:00"  # 4 hours earlier
    
    elif priority == "low":
        # Low priority → later (fill gaps)
        if category == "academic":
            best_time = "21:00"  # 2 hours later
        elif category == "work":
            best_time = "15:00"  # Afternoon slot
        else:
            best_time = "20:00"  # Later evening
    
    # Rule 3: Deadline urgency (if due date is very close)
    if dueDate:
        try:
            due = datetime.fromisoformat(str(dueDate).replace('Z', '+00:00'))
            now = datetime.now(due.tzinfo) if due.tzinfo else datetime.now()
            hours_until_due = (due - now).total_seconds() / 3600
            
            # If due in less than 24 hours → schedule ASAP
            if hours_until_due < 24:
                best_time = "09:00"  # Start of day
            # If due in 1-3 days → schedule early
            elif hours_until_due < 72:
                best_time = "10:00"  # Morning
        except:
            pass  # Invalid date format, use default
    
    # Rule 4: Duration-based scheduling (short tasks fill gaps)
    if duration <= 30:
        # Short tasks (<=30 min) → can fit in morning
        if "morning" not in best_time.lower():
            best_time = "11:00"
    
    # Rule 5: Avoid past times
    current_hour = datetime.now().hour
    try:
        scheduled_hour = int(best_time.split(":")[0])
        if scheduled_hour <= current_hour:
            # If scheduled time is in the past → push to next available slot
            scheduled_hour = max(current_hour + 1, 10)
            if scheduled_hour > 22:
                scheduled_hour = 10  # Next day morning
            best_time = f"{scheduled_hour:02d}:00"
    except:
        pass
    
    return best_time