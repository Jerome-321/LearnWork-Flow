def _find_best_slot_with_ml(day, conflicts, priority, work_schedules):
    """Find optimal time slot for task using ML Predictor"""
    try:
        from .ml_predictor import ProductivityPredictor
        predictor = ProductivityPredictor()
        candidate_slots = [f"{h:02d}:00" for h in range(7, 23)]
        scored_slots = predictor.find_optimal_time_slots(priority, day, candidate_slots)
        
        def time_to_minutes(time_str):
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        
        for slot, score in scored_slots:
            slot_minutes = time_to_minutes(slot)
            conflicts_work = False
            for schedule in work_schedules:
                if day in schedule.get('work_days', []):
                    work_start = time_to_minutes(schedule.get('start_time', '09:00'))
                    work_end = time_to_minutes(schedule.get('end_time', '17:00'))
                    if work_end < work_start:
                        if slot_minutes >= work_start or slot_minutes < work_end:
                            conflicts_work = True
                            break
                    else:
                        if work_start <= slot_minutes < work_end:
                            conflicts_work = True
                            break
            if not conflicts_work:
                insights = predictor.get_productivity_insights(slot, priority, day)
                return {"time": slot, "reason": insights['recommendation'], "score": insights['productivity_score']}
    except Exception as e:
        print(f"[ML PREDICTOR] Failed: {e}. Using fallback.")
    
    priority_guidance = {'high': {'time': '09:00', 'reason': 'Morning slot for peak focus'}, 'medium': {'time': '14:00', 'reason': 'Afternoon slot for steady productivity'}, 'low': {'time': '17:00', 'reason': 'Evening slot for flexible tasks'}}
    slot_info = priority_guidance.get(priority, priority_guidance['medium'])
    return {"time": slot_info['time'], "reason": slot_info['reason']}
