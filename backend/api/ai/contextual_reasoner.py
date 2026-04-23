"""
Contextual Reasoning Engine
Implements Q4 requirements: deadline proximity, duration estimation, night-shift detection
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import statistics


class ContextualReasoner:
    """
    Advanced contextual reasoning for:
    - Q4 Scenario A: Deadline proximity triggers urgency re-ranking
    - Q4 Scenario B: Contextual duration estimation from past tasks
    - Q4 Scenario C: Night-shift student context detection
    """
    
    def __init__(self):
        self.task_history = {}  # Store historical task durations
        self.user_patterns = {}  # Store user work patterns
    
    # ========================================================================
    # Q4 SCENARIO A: DEADLINE PROXIMITY URGENCY RE-RANKING
    # ========================================================================
    
    def check_deadline_urgency(self, task: Dict) -> Dict:
        """
        Q4 Scenario A: Automatically re-rank low-priority task if deadline is 2 hours away
        """
        original_priority = task.get('priority', 'medium')
        due_date_str = task.get('dueDate')
        
        if not due_date_str:
            return {'urgency_upgrade': False, 'original_priority': original_priority}
        
        try:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            now = datetime.now()
            hours_until_deadline = (due_date - now).total_seconds() / 3600
            
            # Urgency thresholds
            if hours_until_deadline < 0:
                urgency_level = 'overdue'
                new_priority = 'critical'
            elif hours_until_deadline <= 2:
                urgency_level = 'critical'
                new_priority = 'critical'
            elif hours_until_deadline <= 6:
                urgency_level = 'urgent'
                new_priority = 'high' if original_priority in ['low', 'medium'] else original_priority
            elif hours_until_deadline <= 24:
                urgency_level = 'high'
                new_priority = 'high' if original_priority == 'low' else original_priority
            else:
                urgency_level = 'normal'
                new_priority = original_priority
            
            urgency_upgraded = new_priority != original_priority
            
            result = {
                'urgency_upgrade': urgency_upgraded,
                'original_priority': original_priority,
                'new_priority': new_priority,
                'urgency_level': urgency_level,
                'hours_until_deadline': round(hours_until_deadline, 1),
                'explanation': self._generate_urgency_explanation(
                    task.get('title'), 
                    original_priority, 
                    new_priority, 
                    hours_until_deadline
                )
            }
            
            return result
            
        except ValueError:
            return {'urgency_upgrade': False, 'original_priority': original_priority}
    
    def _generate_urgency_explanation(self, title: str, old_priority: str, 
                                     new_priority: str, hours: float) -> str:
        """Generate explanation for urgency upgrade"""
        if hours < 0:
            return f"⚠️ OVERDUE: '{title}' is past its deadline. Upgrading to CRITICAL priority."
        elif hours <= 2:
            return f"🚨 CRITICAL: '{title}' becomes critical in {round(hours, 1)} hours — upgrading priority from {old_priority.upper()} to {new_priority.upper()}."
        elif hours <= 6:
            return f"⏰ URGENT: '{title}' is due in {round(hours, 1)} hours — upgrading priority to {new_priority.upper()}."
        elif hours <= 24:
            return f"📅 Due soon: '{title}' is due in {round(hours, 1)} hours — upgrading priority to {new_priority.upper()}."
        else:
            return f"'{title}' has {round(hours, 1)} hours until deadline."
    
    # ========================================================================
    # Q4 SCENARIO B: CONTEXTUAL DURATION ESTIMATION
    # ========================================================================
    
    def estimate_task_duration(self, task: Dict, user_id: str) -> Dict:
        """
        Q4 Scenario B: Analyze past tasks with similar titles and suggest duration
        Example: "Write lab report" → "Based on your previous lab reports, this usually takes 2.5 hours"
        """
        task_title = task.get('title', '').lower()
        
        # Extract task type keywords
        task_type = self._extract_task_type(task_title)
        
        # Get historical durations for this task type
        historical_durations = self._get_historical_durations(user_id, task_type)
        
        if not historical_durations:
            # No history - use default estimates
            return self._get_default_duration_estimate(task_type)
        
        # Calculate statistics from history
        avg_duration = statistics.mean(historical_durations)
        median_duration = statistics.median(historical_durations)
        
        # Use median (more robust to outliers)
        suggested_duration = median_duration
        
        return {
            'duration_estimated': True,
            'suggested_duration_minutes': round(suggested_duration),
            'suggested_duration_hours': round(suggested_duration / 60, 1),
            'based_on_history': True,
            'historical_count': len(historical_durations),
            'task_type': task_type,
            'explanation': f"Based on your previous {task_type} tasks, this usually takes {round(suggested_duration / 60, 1)} hours — scheduling accordingly.",
            'confidence': 'high' if len(historical_durations) >= 3 else 'medium',
            'no_manual_input_needed': True
        }
    
    def record_task_completion(self, user_id: str, task: Dict, actual_duration: int):
        """Record actual task duration for future estimation"""
        task_title = task.get('title', '').lower()
        task_type = self._extract_task_type(task_title)
        
        if user_id not in self.task_history:
            self.task_history[user_id] = {}
        
        if task_type not in self.task_history[user_id]:
            self.task_history[user_id][task_type] = []
        
        self.task_history[user_id][task_type].append(actual_duration)
        
        # Keep only last 10 entries per task type
        if len(self.task_history[user_id][task_type]) > 10:
            self.task_history[user_id][task_type] = self.task_history[user_id][task_type][-10:]
    
    def _extract_task_type(self, title: str) -> str:
        """Extract task type from title"""
        title_lower = title.lower()
        
        # Common task types
        if any(word in title_lower for word in ['lab report', 'report']):
            return 'lab_report'
        elif any(word in title_lower for word in ['essay', 'paper', 'write']):
            return 'essay'
        elif any(word in title_lower for word in ['assignment', 'homework']):
            return 'assignment'
        elif any(word in title_lower for word in ['study', 'review']):
            return 'study_session'
        elif any(word in title_lower for word in ['project', 'coding', 'programming']):
            return 'project'
        elif any(word in title_lower for word in ['reading', 'read']):
            return 'reading'
        elif any(word in title_lower for word in ['practice', 'exercise']):
            return 'practice'
        else:
            return 'general_task'
    
    def _get_historical_durations(self, user_id: str, task_type: str) -> List[int]:
        """Get historical durations for task type"""
        if user_id not in self.task_history:
            return []
        
        return self.task_history[user_id].get(task_type, [])
    
    def _get_default_duration_estimate(self, task_type: str) -> Dict:
        """Get default duration estimate when no history exists"""
        default_durations = {
            'lab_report': 150,  # 2.5 hours
            'essay': 180,       # 3 hours
            'assignment': 90,   # 1.5 hours
            'study_session': 120,  # 2 hours
            'project': 240,     # 4 hours
            'reading': 60,      # 1 hour
            'practice': 90,     # 1.5 hours
            'general_task': 60  # 1 hour
        }
        
        duration = default_durations.get(task_type, 60)
        
        return {
            'duration_estimated': True,
            'suggested_duration_minutes': duration,
            'suggested_duration_hours': round(duration / 60, 1),
            'based_on_history': False,
            'task_type': task_type,
            'explanation': f"Estimated duration: {round(duration / 60, 1)} hours (based on typical {task_type.replace('_', ' ')} tasks)",
            'confidence': 'low',
            'no_manual_input_needed': True
        }
    
    # ========================================================================
    # Q4 SCENARIO C: NIGHT-SHIFT STUDENT CONTEXT DETECTION
    # ========================================================================
    
    def detect_night_shift_pattern(self, user_id: str, fixed_events: List[Dict], 
                                   work_schedules: List[Dict]) -> Dict:
        """
        Q4 Scenario C: Detect if user works night shift (10PM-6AM)
        Automatically shift peak productivity recommendations to afternoon (2PM-5PM)
        """
        # Analyze fixed events and work schedules for night shift pattern
        night_shift_indicators = []
        
        # Check work schedules
        for schedule in work_schedules:
            start_time = schedule.get('start_time', '09:00')
            end_time = schedule.get('end_time', '17:00')
            
            start_hour = int(start_time.split(':')[0])
            end_hour = int(end_time.split(':')[0])
            
            # Night shift: starts after 8PM or ends before 8AM
            if start_hour >= 20 or end_hour <= 8:
                night_shift_indicators.append({
                    'type': 'work_schedule',
                    'start': start_time,
                    'end': end_time,
                    'job': schedule.get('job_title', 'Work')
                })
        
        # Check fixed events clustered at night
        night_events = 0
        for event in fixed_events:
            event_time = event.get('time', '12:00')
            event_hour = int(event_time.split(':')[0])
            
            if event_hour >= 22 or event_hour <= 6:
                night_events += 1
        
        # Determine if night shift pattern exists
        is_night_shift = len(night_shift_indicators) > 0 or night_events >= 3
        
        if is_night_shift:
            # Store pattern
            if user_id not in self.user_patterns:
                self.user_patterns[user_id] = {}
            
            self.user_patterns[user_id]['night_shift'] = True
            self.user_patterns[user_id]['peak_hours'] = ['14:00', '15:00', '16:00', '17:00']  # 2PM-5PM
            
            return {
                'night_shift_detected': True,
                'pattern': 'Night shift (10PM-6AM)',
                'indicators': night_shift_indicators,
                'night_events_count': night_events,
                'peak_productivity_override': 'Afternoon (2PM-5PM)',
                'explanation': "AI detected your fixed events are clustered between 10PM–6AM (night shift pattern). Automatically shifting all 'peak productivity' recommendations to afternoon hours (2PM–5PM), overriding the default morning bias.",
                'recommended_schedule': {
                    'sleep': '8AM-2PM',
                    'peak_work': '2PM-5PM',
                    'evening': '5PM-9PM',
                    'night_shift': '10PM-6AM'
                }
            }
        
        return {
            'night_shift_detected': False,
            'pattern': 'Standard schedule',
            'peak_productivity_override': None
        }
    
    def get_adjusted_peak_hours(self, user_id: str) -> List[str]:
        """Get peak hours adjusted for user's schedule pattern"""
        if user_id in self.user_patterns and self.user_patterns[user_id].get('night_shift'):
            # Night shift: afternoon peak
            return ['14:00', '15:00', '16:00', '17:00']
        else:
            # Standard: morning peak
            return ['09:00', '10:00', '11:00']
    
    def apply_contextual_adjustments(self, task: Dict, user_id: str, 
                                    all_tasks: List[Dict]) -> Dict:
        """
        Apply all contextual adjustments to task scheduling
        Combines deadline urgency, duration estimation, and pattern detection
        """
        adjustments = {}
        
        # Check deadline urgency
        urgency_check = self.check_deadline_urgency(task)
        if urgency_check['urgency_upgrade']:
            adjustments['urgency'] = urgency_check
        
        # Estimate duration
        duration_estimate = self.estimate_task_duration(task, user_id)
        if duration_estimate['duration_estimated']:
            adjustments['duration'] = duration_estimate
        
        # Get adjusted peak hours
        peak_hours = self.get_adjusted_peak_hours(user_id)
        adjustments['peak_hours'] = peak_hours
        
        return {
            'contextual_adjustments_applied': len(adjustments) > 0,
            'adjustments': adjustments,
            'task_id': task.get('id'),
            'task_title': task.get('title')
        }
    
    def generate_context_report(self, user_id: str, tasks: List[Dict], 
                               fixed_events: List[Dict], 
                               work_schedules: List[Dict]) -> Dict:
        """Generate comprehensive context analysis report"""
        report = {
            'user_id': user_id,
            'analysis_timestamp': datetime.now().isoformat(),
            'total_tasks': len(tasks),
            'urgent_tasks': [],
            'duration_estimates': [],
            'schedule_pattern': {}
        }
        
        # Analyze each task for urgency
        for task in tasks:
            urgency = self.check_deadline_urgency(task)
            if urgency['urgency_upgrade']:
                report['urgent_tasks'].append({
                    'title': task.get('title'),
                    'original_priority': urgency['original_priority'],
                    'new_priority': urgency['new_priority'],
                    'hours_until_deadline': urgency['hours_until_deadline']
                })
        
        # Detect schedule pattern
        pattern = self.detect_night_shift_pattern(user_id, fixed_events, work_schedules)
        report['schedule_pattern'] = pattern
        
        return report
