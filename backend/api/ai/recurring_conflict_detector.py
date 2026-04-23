"""
Q2 Recurring Conflict Detection System
Detects patterns after 3 occurrences and suggests permanent schedule restructuring
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import Counter


class RecurringConflictDetector:
    """
    Q2: Soft block with recurring conflict tracking.
    
    After 3 weeks of the same Wednesday conflict being acknowledged:
    AI flags it: "This conflict happens every week — would you like to permanently adjust your schedule?"
    and offers a restructuring plan.
    """
    
    RECURRENCE_THRESHOLD = 3  # Trigger after 3 occurrences
    TIME_WINDOW_DAYS = 21  # Look back 3 weeks
    ACKNOWLEDGMENT_THRESHOLD = 2  # After 2 acknowledged conflicts
    
    def __init__(self):
        self.conflict_patterns = {}
    
    def track_conflict_acknowledgment(self, user, conflict_type: str,
                                     day_of_week: str, start_time: str, end_time: str,
                                     item1_title: str, item2_title: str,
                                     item1_type: str, item2_type: str) -> Dict:
        """
        Track when user acknowledges a conflict warning (Q2).
        Detect recurring patterns after multiple acknowledgments.
        
        Args:
            user: Django user
            conflict_type: 'task_vs_work', 'task_vs_task', 'task_vs_fixed'
            day_of_week: Monday, Tuesday, etc.
            start_time: Conflict start (HH:MM)
            end_time: Conflict end (HH:MM)
            item1_title, item2_title: What's conflicting
            item1_type, item2_type: Type of each item
        """
        from api.models import RecurringConflict
        from django.utils import timezone
        
        try:
            # Try to find or create recurring conflict record
            conflict, created = RecurringConflict.objects.get_or_create(
                user=user,
                conflict_type=conflict_type,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
                item1_title=item1_title,
                item2_title=item2_title,
                defaults={
                    'item1_type': item1_type,
                    'item2_type': item2_type,
                }
            )
            
            # Increment acknowledgment count
            conflict.acknowledged_count += 1
            conflict.occurrence_count += 1
            conflict.last_occurred = timezone.now().date()
            conflict.save()
            
            # Check if we should trigger recommendation
            trigger_recommendation = False
            recommendation = None
            
            if conflict.occurrence_count >= self.RECURRENCE_THRESHOLD:
                if conflict.acknowledged_count >= self.ACKNOWLEDGMENT_THRESHOLD:
                    trigger_recommendation = True
                    recommendation = self._generate_restructure_plan(
                        user, conflict, item1_type, item2_type
                    )
            
            return {
                "status": "success",
                "conflict_id": conflict.id,
                "occurrence_count": conflict.occurrence_count,
                "acknowledged_count": conflict.acknowledged_count,
                "trigger_recommendation": trigger_recommendation,
                "recommendation": recommendation,
                "message": self._generate_status_message(conflict)
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_active_recurring_conflicts(self, user) -> List[Dict]:
        """
        Get list of recurring conflicts for user (Q2).
        Shows which patterns are being tracked.
        """
        from api.models import RecurringConflict
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            three_weeks_ago = timezone.now().date() - timedelta(days=21)
            
            conflicts = RecurringConflict.objects.filter(
                user=user,
                is_active=True,
                last_occurred__gte=three_weeks_ago
            ).order_by('-last_occurred')
            
            active_list = []
            for conflict in conflicts:
                active_list.append({
                    'conflict_id': conflict.id,
                    'recurring_items': f"{conflict.item1_title} vs {conflict.item2_title}",
                    'day': conflict.day_of_week,
                    'time': f"{conflict.start_time}-{conflict.end_time}",
                    'occurrences': conflict.occurrence_count,
                    'is_recurring': conflict.occurrence_count >= self.RECURRENCE_THRESHOLD,
                    'user_suggested_resolution': conflict.user_suggested_resolution,
                    'ai_suggestion_accepted': conflict.ai_suggestion_accepted,
                })
            
            return active_list
        
        except Exception as e:
            return []
    
    def suggest_conflict_resolution(self, user, conflict_id: int) -> Dict:
        """
        Generate AI-powered resolution suggestions for recurring conflict (Q2).
        Offers restructuring plan with specifics.
        """
        from api.models import RecurringConflict
        
        try:
            conflict = RecurringConflict.objects.get(id=conflict_id, user=user)
            
            # Generate options based on conflict type
            options = self._generate_resolution_options(user, conflict)
            
            return {
                "status": "success",
                "conflict_id": conflict.id,
                "conflict_description": f"{conflict.item1_title} vs {conflict.item2_title}",
                "day": conflict.day_of_week,
                "time": f"{conflict.start_time}-{conflict.end_time}",
                "occurrences": conflict.occurrence_count,
                "message": f"This conflict has occurred {conflict.occurrence_count} times. Here are options to resolve it permanently:",
                "options": options,
            }
        
        except RecurringConflict.DoesNotExist:
            return {"status": "error", "message": "Conflict not found"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def accept_recurring_resolution(self, user, conflict_id: int, resolution: str) -> Dict:
        """
        User accepts a resolution for recurring conflict.
        Mark conflict as resolved and update user's preferences.
        """
        from api.models import RecurringConflict
        
        try:
            conflict = RecurringConflict.objects.get(id=conflict_id, user=user)
            
            conflict.user_suggested_resolution = resolution
            conflict.ai_suggestion_accepted = True
            conflict.is_active = False  # Mark as resolved
            conflict.save()
            
            return {
                "status": "success",
                "message": f"Resolution accepted. Future instances of this conflict will use: {resolution}",
                "conflict_id": conflict.id,
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def _generate_restructure_plan(self, user, conflict, item1_type: str, item2_type: str) -> Dict:
        """
        Generate restructuring plan based on conflict type (Q2).
        Provides concrete, actionable suggestions.
        """
        plan = {
            "type": "restructure_plan",
            "title": f"Resolve recurring {conflict.conflict_type} conflict",
            "day": conflict.day_of_week,
            "time": f"{conflict.start_time}-{conflict.end_time}",
            "occurrences": conflict.occurrence_count,
        }
        
        # Generate options based on conflict types
        if item1_type == 'work_shift' and item2_type == 'task':
            plan["options"] = [
                {
                    "id": 1,
                    "title": "Shift the conflicting task",
                    "description": f"Move {conflict.item2_title} to a different day/time",
                    "feasibility": "High - tasks are flexible",
                    "impact": "Non-negotiable work shift preserved"
                },
                {
                    "id": 2,
                    "title": "Request shift modification",
                    "description": f"Ask employer to adjust {conflict.item1_title} on {conflict.day_of_week}s",
                    "feasibility": "Medium - requires employer approval",
                    "impact": "Both commitments preserved if approved"
                },
                {
                    "id": 3,
                    "title": "Break task into smaller pieces",
                    "description": "Split task across multiple days to fit around shift",
                    "feasibility": "High - works for most tasks",
                    "impact": "Task completed gradually around work"
                }
            ]
        
        elif item1_type == 'task' and item2_type == 'fixed_event':
            plan["options"] = [
                {
                    "id": 1,
                    "title": "Complete task before event",
                    "description": f"Schedule {conflict.item1_title} earlier in {conflict.day_of_week}",
                    "feasibility": "High - tasks are flexible",
                    "impact": "Event protected, task completed earlier"
                },
                {
                    "id": 2,
                    "title": "Complete task after event",
                    "description": f"Schedule {conflict.item1_title} after {conflict.item2_title} ends",
                    "feasibility": "High",
                    "impact": "Event protected, task done post-event"
                },
                {
                    "id": 3,
                    "title": "Move to different day",
                    "description": f"Reschedule {conflict.item1_title} to {conflict.day_of_week} + 1 day",
                    "feasibility": "High - unless hard deadline",
                    "impact": "Clear separation of events"
                }
            ]
        
        else:
            # Generic resolution options
            plan["options"] = [
                {
                    "id": 1,
                    "title": "Reschedule first item",
                    "description": f"Move {conflict.item1_title} to different time",
                    "feasibility": "Depends on flexibility"
                },
                {
                    "id": 2,
                    "title": "Reschedule second item",
                    "description": f"Move {conflict.item2_title} to different time",
                    "feasibility": "Depends on flexibility"
                },
            ]
        
        return plan
    
    def _generate_resolution_options(self, user, conflict) -> List[Dict]:
        """
        Generate multiple ranked options for resolving recurring conflict (Q8-style).
        Each shows what it preserves and sacrifices.
        """
        options = [
            {
                "rank": 1,
                "title": f"Adjust {conflict.item1_title}",
                "description": f"Reschedule {conflict.item1_title} to a different time slot",
                "preserves": conflict.item2_title,
                "sacrifices": f"Flexibility of {conflict.item1_title} timing",
                "feasibility": "85%",
                "effort": "Low"
            },
            {
                "rank": 2,
                "title": f"Adjust {conflict.item2_title}",
                "description": f"Reschedule {conflict.item2_title} to a different time slot",
                "preserves": conflict.item1_title,
                "sacrifices": f"Flexibility of {conflict.item2_title} timing",
                "feasibility": "75%",
                "effort": "Medium"
            },
            {
                "rank": 3,
                "title": "Split into smaller pieces",
                "description": "Break one item into parts that fit around the other",
                "preserves": "Both items partially",
                "sacrifices": "Continuity and focus",
                "feasibility": "60%",
                "effort": "High"
            }
        ]
        
        return options
    
    def _generate_status_message(self, conflict) -> str:
        """Generate user-friendly status message"""
        if conflict.occurrence_count == 1:
            return f"Conflict tracked. This is the first time this conflict occurred."
        elif conflict.occurrence_count < self.RECURRENCE_THRESHOLD:
            remaining = self.RECURRENCE_THRESHOLD - conflict.occurrence_count
            return f"Conflict tracked. Occurs {conflict.occurrence_count} times. {remaining} more to trigger restructuring suggestion."
        else:
            return f"**RECURRING CONFLICT** - Occurred {conflict.occurrence_count} times. Would you like to restructure your schedule?"
