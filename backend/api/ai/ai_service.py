from .ollama_ai import analyze_task_with_ai
from .rule_scheduler import rule_scheduler
from .ml_optimizer import optimize_time
from .groq_ai import groq_schedule, groq_work_schedule_suggestion, groq_task_schedule_suggestion
from .task_analyzer import TaskAnalyzer
from datetime import datetime

def generate_schedule(task):
    """
    ✅ IMPROVED: AI schedule generation with DEEP task analysis
    Now understands task intent, difficulty, focus requirements
    """
    
    # ✅ STEP 1: Deep analysis of task content
    title = task.get("title", "")
    description = task.get("description", "")
    category = task.get("category", "personal")
    due_date = task.get("dueDate", "")
    
    # Get comprehensive task analysis
    analysis = TaskAnalyzer.analyze(title, description, category, due_date)
    
    # Get AI reasoning (Groq)
    ai_analysis = groq_schedule(task)
    
    # Get smart rule-based scheduling time
    best_time = rule_scheduler(task)
    
    # ML productivity optimization
    productivity_score = optimize_time(18)
    
    # ✅ STEP 2: Combine analysis + AI for smarter scheduling
    suggested_start = ai_analysis.get("suggestedStart") or best_time
    suggested_end = ai_analysis.get("suggestedEnd")
    reason = ai_analysis.get("reason", "")
    
    # Calculate duration if we have both times
    estimated_duration = analysis.get("duration_display", "1–2 hours")
    if suggested_start and suggested_end:
        try:
            start_time = datetime.strptime(suggested_start, "%H:%M")
            end_time = datetime.strptime(suggested_end, "%H:%M")
            duration_minutes = (end_time - start_time).total_seconds() / 60
            
            if duration_minutes <= 30:
                estimated_duration = f"~{int(duration_minutes)} minutes"
            elif duration_minutes <= 120:
                estimated_duration = f"{int(duration_minutes // 60)}–{int((duration_minutes + 30) // 60)} hour(s)"
            else:
                estimated_duration = f"{int(duration_minutes // 60)}+ hours"
        except:
            pass
    
    # ✅ STEP 3: Generate context-aware explanation
    if not reason or reason.strip() == "":
        reason = _generate_context_aware_explanation(
            title,
            description,
            analysis,
            suggested_start,
            category
        )
    
    return {
        "suggested_time": suggested_start,
        "estimated_duration": estimated_duration,
        "reason": reason,
        "priority": task.get("priority", "medium"),
        "timeOfDay": _get_time_of_day(suggested_start),
        "productivity_score": productivity_score,
        "analysis_summary": analysis.get("summary", {}),
        "task_intent": analysis.get("intent"),
        "task_difficulty": analysis.get("difficulty"),
        "focus_level": analysis.get("focus_level"),
        "urgency": analysis.get("urgency"),
    }


def _generate_context_aware_explanation(
    title: str,
    description: str,
    analysis: dict,
    suggested_time: str,
    category: str
) -> str:
    """
    ✅ IMPROVED: Generate explanation based on DEEP analysis
    """
    
    intent = analysis.get("intent", "task")
    difficulty = analysis.get("difficulty", "medium")
    focus_level = analysis.get("focus_level", "light_task")
    urgency = analysis.get("urgency", "medium")
    duration_str = analysis.get("duration_display", "1–2 hours")
    
    try:
        hour = int(suggested_time.split(":")[0])
    except:
        hour = 18
    
    # Time of day context
    if hour < 12:
        time_period = "morning"
        availability = "you're likely free before classes or work"
        energy = "peak mental energy"
    elif hour < 17:
        time_period = "afternoon"
        availability = "you have time during your afternoon break"
        energy = "steady focus"
    else:
        time_period = "evening"
        availability = "you're free after school or work"
        energy = "calm focus without rush"
    
    # Build explanation based on task analysis
    explanations = []
    
    # Time context
    explanations.append(f"I recommend working on this at {suggested_time}.")
    
    # Availability context
    explanations.append(f"Since {availability},")
    
    # Task-specific context
    if focus_level == "deep_work":
        if difficulty == "hard":
            explanations.append(
                f"this {intent} work demands your full {energy}. "
                f"This window gives you uninterrupted time to deep dive "
                f"into complex thinking without distractions."
            )
        else:
            explanations.append(
                f"this {intent} deserves focused attention. "
                f"You'll work through it efficiently with {energy}."
            )
    else:
        # Light task context
        explanations.append(
            f"this {intent} fits perfectly in your available time. "
            f"Quick turnaround keeps momentum going."
        )
    
    # Urgency context
    if urgency == "high":
        explanations.append(
            f"Since this is high priority, tackling it now prevents last-minute stress."
        )
    
    # Duration context
    if duration_str:
        explanations.append(
            f"Budget {duration_str} for this task."
        )
    
    # Category-specific benefit
    if category == "academic":
        explanations.append(
            "Evening study sessions after your daily activities give you mental clarity "
            "for deep learning and retention."
        )
    elif category == "work":
        explanations.append(
            "Working on this during peak hours ensures quality output and professional results."
        )
    else:
        explanations.append(
            "This timing maintains your productivity balance without overload."
        )
    
    return " ".join(explanations)


def _get_time_of_day(time_str: str) -> str:
    """
    ✅ Helper: Get time of day from time string
    """
    try:
        hour = int(time_str.split(":")[0])
        if hour < 12:
            return "morning"
        elif hour < 17:
            return "afternoon"
        else:
            return "evening"
    except:
        return "evening"


def generate_work_schedule_suggestion(work_schedule, tasks):
    """
    AI-powered work schedule optimization suggestions
    """
    # Get AI suggestion from Groq
    ai_suggestion = groq_work_schedule_suggestion(work_schedule, tasks)
    
    return ai_suggestion