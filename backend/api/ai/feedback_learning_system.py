"""
Q6 Feedback Learning System
Implements lightweight feedback loop for personalized ML adaptation
Tracks user task completions and learns actual productivity rhythm
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from django.db.models import Q, Avg, Count
from decimal import Decimal


class FeedbackLearningSystem:
    """
    Implements Q6 feedback learning:
    - Track where users complete tasks (completion log)
    - Detect patterns (weekend vs weekday, post-shift recovery)
    - Adjust ML scores based on actual behavior (after 2-3 weeks)
    - Generate learning notifications for user
    """
    
    MIN_HISTORY_FOR_ADAPTATION = 10  # Need 10+ completions to adapt
    COMPLETION_BOOST_FACTOR = 15.0   # Boost score for consistent completions
    ABANDONMENT_PENALTY_FACTOR = -20.0  # Penalty for consistent abandonments
    CONFIDENCE_GROWTH_PER_COMPLETION = 0.05  # ML confidence increases per data point
    
    def __init__(self):
        self.user = None
        self.completion_logs = []
        self.behavior_history = []
    
    def record_task_completion(self, task, scheduled_time: str, scheduled_day: str,
                              actual_completion_time: str, actual_completion_date,
                              actual_duration_minutes: int = None,
                              user_satisfaction: int = None) -> Dict:
        """
        Record when user completed a task. Called on task completion (Q6).
        
        Args:
            task: Task object
            scheduled_time: Time AI recommended (HH:MM)
            scheduled_day: Day of week (Monday, etc.)
            actual_completion_time: When user actually completed (HH:MM)
            actual_completion_date: Date of completion
            actual_duration_minutes: How long task took
            user_satisfaction: 1-5 star rating
            
        Returns:
            Dict with learning insights
        """
        from .models import CompletionLog, BehaviorHistory
        
        # Import here to avoid circular imports
        try:
            from api.models import CompletionLog, BehaviorHistory
        except ImportError:
            return {"status": "error", "message": "Models not available"}
        
        # Calculate if this was an early completion or late completion
        scheduled_minutes = self._time_to_minutes(scheduled_time)
        actual_minutes = self._time_to_minutes(actual_completion_time)
        time_offset_minutes = actual_minutes - scheduled_minutes
        
        # Create completion log
        try:
            completion_log = CompletionLog.objects.create(
                user=task.user,
                task=task,
                scheduled_time=scheduled_time,
                scheduled_day=scheduled_day,
                actual_completion_time=actual_completion_time,
                actual_completion_date=actual_completion_date,
                task_title=task.title,
                task_category=task.category,
                task_priority=task.priority,
                estimated_duration=task.estimatedDuration,
                actual_duration=actual_duration_minutes,
                was_completed=True,
                user_satisfaction=user_satisfaction
            )
        except Exception as e:
            return {"status": "error", "message": str(e)}
        
        # Update or create BehaviorHistory for this time slot
        time_window = self._get_time_window(scheduled_day, scheduled_time)
        
        try:
            behavior_record, created = BehaviorHistory.objects.get_or_create(
                user=task.user,
                day_of_week=scheduled_day,
                time_slot=scheduled_time,
                defaults={
                    'time_window': time_window,
                }
            )
            
            # Update completion metrics
            behavior_record.completed_tasks += 1
            behavior_record.total_tasks_scheduled += 1
            behavior_record.completion_rate = behavior_record.completed_tasks / max(behavior_record.total_tasks_scheduled, 1)
            
            # Update average completion time
            if actual_duration_minutes:
                old_avg = behavior_record.avg_completion_time
                behavior_record.avg_completion_time = int(
                    (old_avg * (behavior_record.completed_tasks - 1) + actual_duration_minutes) 
                    / behavior_record.completed_tasks
                )
            
            # Update satisfaction rating if provided
            if user_satisfaction:
                old_avg = behavior_record.avg_satisfaction_rating
                total_ratings = behavior_record.completed_tasks
                behavior_record.avg_satisfaction_rating = (
                    (old_avg * (total_ratings - 1) + user_satisfaction) / total_ratings
                )
            
            # Update ML confidence and productivity score
            old_productivity = behavior_record.historical_productivity_score
            behavior_record.update_count += 1
            
            # New productivity score = base + completion boost + satisfaction bonus
            completion_boost = self.COMPLETION_BOOST_FACTOR * behavior_record.completion_rate
            satisfaction_bonus = (behavior_record.avg_satisfaction_rating / 5.0) * 10.0 if user_satisfaction else 0
            behavior_record.historical_productivity_score = max(0, min(100, 50 + completion_boost + satisfaction_bonus))
            
            # Increase ML confidence as we get more data
            behavior_record.ml_confidence_score = min(
                1.0,
                behavior_record.ml_confidence_score + self.CONFIDENCE_GROWTH_PER_COMPLETION
            )
            
            behavior_record.save()
            
            # Track the score adjustment for user explanation
            if old_productivity != behavior_record.historical_productivity_score:
                from api.models import UserFeedbackScore
                UserFeedbackScore.objects.create(
                    user=task.user,
                    day_of_week=scheduled_day,
                    time_slot=scheduled_time,
                    old_score=old_productivity,
                    new_score=behavior_record.historical_productivity_score,
                    adjustment_reason=f"User completed task here - completion rate now {behavior_record.completion_rate:.0%}",
                    completion_rate_change=behavior_record.completion_rate,
                    recent_task_count=behavior_record.completed_tasks
                )
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
        
        # Generate learning insight for user
        insight = self._generate_learning_insight(task.user, scheduled_day, scheduled_time, time_offset_minutes)
        
        return {
            "status": "success",
            "message": "Task completion recorded",
            "completion_log_id": completion_log.id,
            "time_offset_minutes": time_offset_minutes,
            "learning_insight": insight
        }
    
    def record_task_abandonment(self, task, scheduled_time: str, scheduled_day: str) -> Dict:
        """
        Record when user marks task as incomplete/abandoned (Q6).
        This is negative feedback that reduces score for that time slot.
        """
        from api.models import BehaviorHistory
        
        try:
            behavior_record, created = BehaviorHistory.objects.get_or_create(
                user=task.user,
                day_of_week=scheduled_day,
                time_slot=scheduled_time,
                defaults={'time_window': self._get_time_window(scheduled_day, scheduled_time)}
            )
            
            # Update abandonment metrics
            behavior_record.abandoned_tasks += 1
            behavior_record.total_tasks_scheduled += 1
            behavior_record.completion_rate = behavior_record.completed_tasks / max(behavior_record.total_tasks_scheduled, 1)
            
            # Apply penalty to productivity score
            old_productivity = behavior_record.historical_productivity_score
            abandonment_penalty = self.ABANDONMENT_PENALTY_FACTOR * (behavior_record.abandoned_tasks / max(behavior_record.total_tasks_scheduled, 1))
            behavior_record.historical_productivity_score = max(0, old_productivity + abandonment_penalty)
            
            behavior_record.ml_confidence_score = min(
                1.0,
                behavior_record.ml_confidence_score + self.CONFIDENCE_GROWTH_PER_COMPLETION
            )
            
            behavior_record.save()
            
            # Track score adjustment
            if old_productivity != behavior_record.historical_productivity_score:
                from api.models import UserFeedbackScore
                UserFeedbackScore.objects.create(
                    user=task.user,
                    day_of_week=scheduled_day,
                    time_slot=scheduled_time,
                    old_score=old_productivity,
                    new_score=behavior_record.historical_productivity_score,
                    adjustment_reason=f"User consistently abandons tasks here - completion rate {behavior_record.completion_rate:.0%}",
                    completion_rate_change=behavior_record.completion_rate,
                    recent_task_count=behavior_record.total_tasks_scheduled
                )
            
            return {
                "status": "success",
                "message": "Task abandonment recorded - time slot score adjusted down",
                "new_score": behavior_record.historical_productivity_score
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def detect_recurring_conflicts(self, user) -> List[Dict]:
        """
        Detect recurring conflicts after 3 weeks (Q2).
        Suggests permanent schedule restructuring.
        """
        from api.models import RecurringConflict
        from datetime import timedelta
        
        try:
            # Find conflicts acknowledged in past 3 weeks
            three_weeks_ago = datetime.now().date() - timedelta(days=21)
            
            recent_conflicts = RecurringConflict.objects.filter(
                user=user,
                last_occurred__gte=three_weeks_ago,
                is_active=True
            )
            
            recommendations = []
            
            for conflict in recent_conflicts:
                if conflict.occurrence_count >= 3 and conflict.acknowledged_count >= 2:
                    # This is a recurring, acknowledged conflict - suggest restructuring
                    recommendations.append({
                        "conflict_id": conflict.id,
                        "recurring_items": f"{conflict.item1_title} vs {conflict.item2_title}",
                        "day": conflict.day_of_week,
                        "time": f"{conflict.start_time}-{conflict.end_time}",
                        "occurrences": conflict.occurrence_count,
                        "message": f"This conflict happens every week on {conflict.day_of_week}. Would you like to permanently adjust your schedule?",
                        "suggestion_type": "restructure"
                    })
            
            return recommendations
        
        except Exception as e:
            return []
    
    def detect_weekend_vs_weekday_patterns(self, user) -> Dict:
        """
        Detect if user has different productivity on weekends vs weekdays (Q6 Scenario B).
        """
        from api.models import BehaviorHistory
        
        weekday_scores = {}
        weekend_scores = {}
        
        try:
            behaviors = BehaviorHistory.objects.filter(user=user)
            
            for behavior in behaviors:
                is_weekend = behavior.day_of_week in ['Saturday', 'Sunday']
                scores = weekend_scores if is_weekend else weekday_scores
                
                if behavior.day_of_week not in scores:
                    scores[behavior.day_of_week] = []
                scores[behavior.day_of_week].append(behavior.historical_productivity_score)
            
            # Calculate averages
            weekday_avg = sum(sum(v) for v in weekday_scores.values()) / max(sum(len(v) for v in weekday_scores.values()), 1)
            weekend_avg = sum(sum(v) for v in weekend_scores.values()) / max(sum(len(v) for v in weekend_scores.values()), 1)
            
            patterns = {
                "weekday_productivity": weekday_avg,
                "weekend_productivity": weekend_avg,
                "split_detected": abs(weekday_avg - weekend_avg) > 15,
                "weekday_days": list(weekday_scores.keys()),
                "weekend_days": list(weekend_scores.keys()),
            }
            
            # Set pattern flags in all behavior records
            if patterns['split_detected']:
                for behavior in behaviors:
                    if behavior.day_of_week in ['Saturday', 'Sunday']:
                        if weekend_avg > weekday_avg:
                            behavior.weekend_pattern = True
                            behavior.save()
            
            return patterns
        
        except Exception as e:
            return {}
    
    def get_productivity_explanation(self, user, day: str, time_slot: str) -> Dict:
        """
        Generate user-facing explanation of productivity score (Q6 Scenario C).
        Shows what influenced the score and alternative recommendations.
        """
        from api.models import BehaviorHistory
        
        try:
            behavior = BehaviorHistory.objects.get(
                user=user,
                day_of_week=day,
                time_slot=time_slot
            )
            
            # Find best alternative time slot that day
            best_alternatives = BehaviorHistory.objects.filter(
                user=user,
                day_of_week=day
            ).order_by('-historical_productivity_score')[:3]
            
            explanation = {
                "current_slot": time_slot,
                "current_score": behavior.historical_productivity_score,
                "confidence": behavior.ml_confidence_score,
                "completion_rate": f"{behavior.completion_rate:.0%}",
                "avg_satisfaction": behavior.avg_satisfaction_rating,
                "total_tasks_here": behavior.completed_tasks + behavior.abandoned_tasks,
                "reason": f"Your historical completion rate here is {behavior.completion_rate:.0%}",
                "alternatives": [
                    {
                        "time": alt.time_slot.strftime("%H:%M"),
                        "score": alt.historical_productivity_score,
                        "completion_rate": f"{alt.completion_rate:.0%}"
                    }
                    for alt in best_alternatives if alt.time_slot != behavior.time_slot
                ]
            }
            
            return explanation
        
        except Exception as e:
            return {}
    
    def _generate_learning_insight(self, user, day: str, time_slot: str, time_offset: int) -> str:
        """
        Generate toast notification insight for user about their learning pattern (Q6).
        """
        from api.models import BehaviorHistory
        
        try:
            behavior = BehaviorHistory.objects.get(
                user=user,
                day_of_week=day,
                time_slot=time_slot
            )
            
            # Generate insight based on pattern
            if behavior.completion_rate > 0.8 and behavior.update_count >= self.MIN_HISTORY_FOR_ADAPTATION:
                return f"We've noticed you work best at {time_slot} - your schedule has been updated to reflect this."
            
            if time_offset < -30:
                return f"Great! You finished early by {abs(time_offset)} minutes - we'll account for this in future scheduling."
            
            if time_offset > 30:
                return f"This took longer than expected - we're adjusting time estimates for similar tasks."
            
            return ""
        
        except:
            return ""
    
    def _get_time_window(self, day: str, time_str: str) -> str:
        """Classify time into morning/afternoon/evening/night"""
        try:
            hour = int(time_str.split(':')[0])
            if 6 <= hour < 12:
                return "morning"
            elif 12 <= hour < 18:
                return "afternoon"
            elif 18 <= hour < 22:
                return "evening"
            else:
                return "night"
        except:
            return "afternoon"
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight"""
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except:
            return 0
