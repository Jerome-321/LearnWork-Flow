"""
Enhanced Fixed Event Handler for Working Students
Handles non-adjustable events (exams, birthdays, appointments) with intelligent rescheduling
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta


class FixedEventHandler:
    """
    Specialized handler for fixed events that cannot be moved
    Provides intelligent rescheduling with detailed reasoning
    """
    
    # Event types that are automatically marked as fixed
    FIXED_EVENT_KEYWORDS = {
        'exam': [
            'exam', 'test', 'quiz', 'midterm', 'final', 'assessment',
            'finals', 'periodical', 'evaluation', 'board exam',
            'entrance exam', 'certification exam', 'comprehensive exam'
        ],
        'birthday': [
            'birthday', 'bday', 'celebration', 'party',
            'anniversary', 'debut', 'surprise party',
            'birthday dinner', 'birthday celebration'
        ],
        'appointment': [
            'appointment', 'meeting', 'interview', 'consultation',
            'doctor', 'dentist', 'checkup', 'therapy', 'session',
            'clinic visit', 'medical appointment', 'hospital visit',
            'follow-up', 'check-up'
        ],
        'presentation': [
            'presentation', 'demo', 'pitch', 'defense', 'showcase',
            'thesis defense', 'capstone defense', 'final defense',
            'oral presentation', 'reporting', 'project presentation'
        ],
        'ceremony': [
            'ceremony', 'graduation', 'wedding', 'funeral',
            'recognition', 'awarding', 'commencement',
            'formal event', 'rites'
        ],
        'deadline': [
            'deadline', 'submission', 'due date', 'cutoff',
            'final submission', 'closing date', 'last day',
            'due', 'turn in', 'submission deadline'
        ],
        'class': [
            'class', 'lecture', 'lab', 'laboratory', 'subject',
            'course', 'session', 'lesson',
            'online class', 'f2f', 'face to face'
        ],
        'work_shift': [
            'work', 'shift', 'duty', 'office hours', 'job',
            'part-time', 'full-time', 'work hours',
            'shift schedule', 'duty hours'
        ],
        'travel': [
            'flight', 'trip', 'travel', 'departure', 'arrival',
            'boarding', 'vacation', 'outing',
            'airport', 'check-in', 'itinerary'
        ],
        'religious': [
            'mass', 'church', 'prayer', 'service',
            'worship', 'religious event',
            'sunday service', 'devotion', 'holy mass'
        ],
        'competition': [
            'competition', 'contest', 'tournament',
            'hackathon', 'game', 'match',
            'league', 'championship'
        ],
        'family_event': [
            'family gathering', 'reunion', 'family dinner',
            'family lunch', 'family party',
            'get together', 'family time'
        ],
        'school_event': [
            'seminar', 'workshop', 'orientation',
            'academic event', 'conference',
            'forum', 'training'
        ],
        'government': [
            'registration', 'renewal', 'license',
            'passport', 'application', 'clearance',
            'government processing'
        ],
        'financial': [
            'payment', 'billing', 'tuition',
            'installment', 'loan', 'bank',
            'payment deadline'
        ],
        'health': [
            'vaccination', 'medical test',
            'lab test', 'x-ray',
            'health check', 'screening'
        ],
        'social': [
            'hangout', 'meetup', 'gathering',
            'outing', 'bonding', 'chill'
        ],
        'delivery': [
            'delivery', 'pickup',
            'package', 'courier',
            'parcel', 'shipment'
        ],
        'maintenance': [
            'repair', 'maintenance',
            'service', 'inspection',
            'technician visit'
        ],
        'legal': [
            'hearing', 'court',
            'legal appointment',
            'case meeting'
        ],
        'sports': [
            'practice', 'training',
            'game day', 'match day',
            'sports event'
        ],
        'internship': [
            'internship', 'ojt',
            'on the job training',
            'intern duty'
        ],
        'club_activity': [
            'club meeting',
            'organization meeting',
            'org event'
        ],
        'review': [
            'review session',
            'exam review',
            'study review'
        ]
    }
    
    def __init__(self):
        self.conflict_log = []
        self.reschedule_log = []
    
    def detect_fixed_event(self, task: Dict) -> Tuple[bool, str, str]:
        """
        Detect if a task should be marked as a fixed event
        
        Returns:
            (is_fixed, event_type, reason)
        """
        title = task.get('title', '').lower()
        description = task.get('description', '').lower()
        combined = f"{title} {description}"
        
        # Check if already marked as fixed
        if task.get('is_fixed', False):
            return True, 'manual', 'Manually marked as fixed event'
        
        # Check for fixed event keywords
        for event_type, keywords in self.FIXED_EVENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in combined:
                    reason = f"Detected '{keyword}' - {event_type.title()} events are non-adjustable"
                    return True, event_type, reason
        
        return False, 'none', ''
    
    def validate_fixed_events(self, tasks: List[Dict], fixed_events: List[Dict]) -> Dict:
        """
        Validate that fixed events don't overlap with each other
        
        Returns:
            Validation report with conflicts
        """
        conflicts = []
        
        for i, event1 in enumerate(fixed_events):
            for event2 in fixed_events[i+1:]:
                if self._events_overlap(event1, event2):
                    conflicts.append({
                        'event1': event1.get('title'),
                        'event2': event2.get('title'),
                        'day': event1.get('day'),
                        'time1': event1.get('time'),
                        'time2': event2.get('time'),
                        'severity': 'CRITICAL',
                        'message': 'Two fixed events cannot occupy the same time slot'
                    })
        
        return {
            'valid': len(conflicts) == 0,
            'conflicts': conflicts,
            'total_fixed_events': len(fixed_events)
        }
    
    def find_conflicts_with_fixed(self, task: Dict, fixed_events: List[Dict]) -> List[Dict]:
        """
        Find all conflicts between a task and fixed events
        
        Returns:
            List of conflicts with detailed information
        """
        conflicts = []
        task_day = task.get('day')
        task_time = task.get('scheduled_time') or task.get('time')
        task_duration = task.get('estimatedDuration', 60)
        
        if not task_time:
            return conflicts
        
        for fixed_event in fixed_events:
            if fixed_event.get('day') != task_day:
                continue
            
            if self._times_overlap(
                task_time, task_duration,
                fixed_event.get('time'), fixed_event.get('duration', 60)
            ):
                conflicts.append({
                    'fixed_event': fixed_event.get('title'),
                    'fixed_time': fixed_event.get('time'),
                    'fixed_duration': fixed_event.get('duration', 60),
                    'task': task.get('title'),
                    'task_time': task_time,
                    'task_duration': task_duration,
                    'day': task_day,
                    'overlap_minutes': self._calculate_overlap(
                        task_time, task_duration,
                        fixed_event.get('time'), fixed_event.get('duration', 60)
                    )
                })
        
        return conflicts
    
    def reschedule_around_fixed(self, task: Dict, fixed_events: List[Dict], 
                                work_schedules: List[Dict], all_tasks: List[Dict]) -> Dict:
        """
        Intelligently reschedule a task to avoid fixed events
        
        Returns:
            Rescheduling recommendation with detailed reasoning
        """
        task_day = task.get('day')
        task_priority = task.get('priority', 'medium')
        task_duration = task.get('estimatedDuration', 60)
        
        # Get all occupied time slots on this day
        occupied_slots = self._get_occupied_slots(task_day, fixed_events, work_schedules, all_tasks)
        
        # Generate candidate time slots based on priority
        candidates = self._generate_candidate_slots(task_priority, task_duration)
        
        # Find best available slot
        best_slot = None
        best_score = -1
        reasoning_parts = []
        
        for candidate_time in candidates:
            # Check if slot is available
            if self._is_slot_available(candidate_time, task_duration, occupied_slots):
                # Calculate quality score
                score = self._calculate_slot_quality(
                    candidate_time, task_priority, task_duration, task_day
                )
                
                if score > best_score:
                    best_score = score
                    best_slot = candidate_time
        
        if best_slot:
            # Build detailed reasoning
            reasoning = self._build_rescheduling_reasoning(
                task, best_slot, fixed_events, work_schedules, best_score
            )
            
            return {
                'success': True,
                'original_time': task.get('scheduled_time') or task.get('time'),
                'new_time': best_slot,
                'day': task_day,
                'quality_score': best_score,
                'reasoning': reasoning,
                'conflicts_avoided': len(self.find_conflicts_with_fixed(task, fixed_events)),
                'recommendation': f"Reschedule '{task.get('title')}' to {best_slot} on {task_day}"
            }
        else:
            # No available slot found
            return {
                'success': False,
                'message': 'No available time slots found',
                'reasoning': self._build_no_slot_reasoning(task, task_day, occupied_slots),
                'suggestion': 'Consider moving to a different day or adjusting task duration'
            }
    
    def generate_balance_report(self, schedule: Dict, tasks: List[Dict], 
                                fixed_events: List[Dict], work_schedules: List[Dict]) -> Dict:
        """
        Generate a comprehensive balance report for study, work, and rest
        
        Returns:
            Balance analysis with recommendations
        """
        # Calculate time allocation by day
        daily_allocation = {}
        
        for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            study_time = 0
            work_time = 0
            fixed_time = 0
            
            # Count study time (academic tasks)
            for task in tasks:
                if task.get('day') == day and task.get('id') in schedule:
                    if task.get('category') == 'academic':
                        study_time += task.get('estimatedDuration', 60)
            
            # Count fixed event time
            for event in fixed_events:
                if event.get('day') == day:
                    fixed_time += event.get('duration', 60)
            
            # Count work time
            for work in work_schedules:
                if day in work.get('work_days', []):
                    start = self._time_to_minutes(work.get('start_time', '09:00'))
                    end = self._time_to_minutes(work.get('end_time', '17:00'))
                    work_time += (end - start)
            
            total_committed = study_time + work_time + fixed_time
            rest_time = max(0, 960 - total_committed)  # 16 hours available (8 for sleep)
            
            daily_allocation[day] = {
                'study_minutes': study_time,
                'work_minutes': work_time,
                'fixed_minutes': fixed_time,
                'rest_minutes': rest_time,
                'total_committed': total_committed,
                'balance_score': self._calculate_balance_score(study_time, work_time, rest_time)
            }
        
        # Overall analysis
        total_study = sum(d['study_minutes'] for d in daily_allocation.values())
        total_work = sum(d['work_minutes'] for d in daily_allocation.values())
        total_fixed = sum(d['fixed_minutes'] for d in daily_allocation.values())
        
        return {
            'daily_breakdown': daily_allocation,
            'weekly_totals': {
                'study_hours': round(total_study / 60, 1),
                'work_hours': round(total_work / 60, 1),
                'fixed_hours': round(total_fixed / 60, 1)
            },
            'balance_assessment': self._assess_overall_balance(daily_allocation),
            'recommendations': self._generate_balance_recommendations(daily_allocation)
        }
    
    def _events_overlap(self, event1: Dict, event2: Dict) -> bool:
        """Check if two events overlap"""
        if event1.get('day') != event2.get('day'):
            return False
        
        return self._times_overlap(
            event1.get('time'), event1.get('duration', 60),
            event2.get('time'), event2.get('duration', 60)
        )
    
    def _times_overlap(self, time1: str, duration1: int, time2: str, duration2: int) -> bool:
        """Check if two time slots overlap"""
        start1 = self._time_to_minutes(time1)
        end1 = start1 + duration1
        
        start2 = self._time_to_minutes(time2)
        end2 = start2 + duration2
        
        return start1 < end2 and end1 > start2
    
    def _calculate_overlap(self, time1: str, duration1: int, time2: str, duration2: int) -> int:
        """Calculate overlap in minutes"""
        start1 = self._time_to_minutes(time1)
        end1 = start1 + duration1
        
        start2 = self._time_to_minutes(time2)
        end2 = start2 + duration2
        
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        
        return max(0, overlap_end - overlap_start)
    
    def _get_occupied_slots(self, day: str, fixed_events: List[Dict], 
                           work_schedules: List[Dict], all_tasks: List[Dict]) -> List[Tuple[int, int]]:
        """Get all occupied time slots for a day"""
        occupied = []
        
        # Add fixed events
        for event in fixed_events:
            if event.get('day') == day:
                start = self._time_to_minutes(event.get('time'))
                end = start + event.get('duration', 60)
                occupied.append((start, end))
        
        # Add work schedules
        for work in work_schedules:
            if day in work.get('work_days', []):
                start = self._time_to_minutes(work.get('start_time', '09:00'))
                end = self._time_to_minutes(work.get('end_time', '17:00'))
                occupied.append((start, end))
        
        # Add other scheduled tasks
        for task in all_tasks:
            if task.get('day') == day and task.get('scheduled_time'):
                start = self._time_to_minutes(task.get('scheduled_time'))
                end = start + task.get('estimatedDuration', 60)
                occupied.append((start, end))
        
        return occupied
    
    def _generate_candidate_slots(self, priority: str, duration: int) -> List[str]:
        """Generate candidate time slots based on priority"""
        if priority in ['critical', 'high']:
            # Morning slots for high priority
            return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
        elif priority == 'medium':
            # Afternoon slots for medium priority
            return ['13:00', '14:00', '15:00', '16:00', '10:00', '11:00', '17:00']
        else:
            # Flexible slots for low priority
            return ['17:00', '18:00', '19:00', '20:00', '15:00', '16:00', '14:00']
    
    def _is_slot_available(self, time: str, duration: int, occupied_slots: List[Tuple[int, int]]) -> bool:
        """Check if a time slot is available"""
        start = self._time_to_minutes(time)
        end = start + duration
        
        for occ_start, occ_end in occupied_slots:
            if start < occ_end and end > occ_start:
                return False
        
        return True
    
    def _calculate_slot_quality(self, time: str, priority: str, duration: int, day: str) -> float:
        """Calculate quality score for a time slot"""
        score = 100.0
        time_minutes = self._time_to_minutes(time)
        
        # Priority-time alignment
        if priority in ['critical', 'high'] and 540 <= time_minutes <= 720:  # 9-12
            score += 20
        elif priority == 'medium' and 780 <= time_minutes <= 1020:  # 13-17
            score += 15
        elif priority == 'low' and 1020 <= time_minutes <= 1200:  # 17-20
            score += 10
        
        # Avoid very early or very late
        if time_minutes < 480 or time_minutes > 1320:  # Before 8 AM or after 10 PM
            score -= 30
        
        # Weekend bonus for flexibility
        if day in ['Saturday', 'Sunday']:
            score += 5
        
        return score
    
    def _build_rescheduling_reasoning(self, task: Dict, new_time: str, 
                                     fixed_events: List[Dict], work_schedules: List[Dict], 
                                     quality_score: float) -> str:
        """Build detailed reasoning for rescheduling"""
        reasons = []
        
        # Identify conflicting fixed events
        conflicts = self.find_conflicts_with_fixed(
            {**task, 'scheduled_time': task.get('time')}, 
            fixed_events
        )
        
        if conflicts:
            fixed_titles = [c['fixed_event'] for c in conflicts]
            reasons.append(
                f"Original time conflicts with fixed event(s): {', '.join(fixed_titles)}"
            )
        
        # Explain new time choice
        time_minutes = self._time_to_minutes(new_time)
        priority = task.get('priority', 'medium')
        
        if priority in ['critical', 'high'] and 540 <= time_minutes <= 720:
            reasons.append(
                f"Scheduled at {new_time} during peak morning hours, optimal for {priority}-priority tasks"
            )
        elif priority == 'medium' and 780 <= time_minutes <= 1020:
            reasons.append(
                f"Scheduled at {new_time} during productive afternoon hours for {priority}-priority work"
            )
        else:
            reasons.append(
                f"Scheduled at {new_time}, a suitable time slot for {priority}-priority tasks"
            )
        
        # Quality assessment
        if quality_score >= 90:
            reasons.append("This time slot provides excellent productivity conditions")
        elif quality_score >= 75:
            reasons.append("This time slot offers good productivity conditions")
        
        # Balance consideration
        reasons.append("Maintains healthy balance between study, work, and rest")
        
        return ". ".join(reasons) + "."
    
    def _build_no_slot_reasoning(self, task: Dict, day: str, occupied_slots: List[Tuple[int, int]]) -> str:
        """Build reasoning when no slot is available"""
        total_occupied = sum(end - start for start, end in occupied_slots)
        hours_occupied = total_occupied / 60
        
        return (
            f"No available time slots found on {day}. "
            f"Day has {hours_occupied:.1f} hours already committed. "
            f"Recommendation: Consider moving this task to a less busy day or "
            f"reducing task duration from {task.get('estimatedDuration', 60)} minutes."
        )
    
    def _calculate_balance_score(self, study: int, work: int, rest: int) -> float:
        """Calculate balance score for a day"""
        total = study + work
        
        if total > 960:  # More than 16 hours
            return 0.0
        elif total > 720:  # More than 12 hours
            return 50.0
        elif total > 480:  # 8-12 hours
            return 100.0
        else:
            return 75.0
    
    def _assess_overall_balance(self, daily_allocation: Dict) -> str:
        """Assess overall weekly balance"""
        avg_score = sum(d['balance_score'] for d in daily_allocation.values()) / 7
        
        if avg_score >= 90:
            return "Excellent - Well-balanced schedule with adequate rest"
        elif avg_score >= 75:
            return "Good - Balanced schedule with minor adjustments possible"
        elif avg_score >= 60:
            return "Fair - Consider redistributing workload for better balance"
        else:
            return "Poor - Schedule is overloaded, rest time is insufficient"
    
    def _generate_balance_recommendations(self, daily_allocation: Dict) -> List[str]:
        """Generate recommendations for better balance"""
        recommendations = []
        
        # Check for overloaded days
        overloaded = [day for day, data in daily_allocation.items() 
                     if data['total_committed'] > 720]
        
        if overloaded:
            recommendations.append(
                f"Days {', '.join(overloaded)} are overloaded (>12 hours). "
                f"Consider redistributing tasks to lighter days."
            )
        
        # Check for rest time
        low_rest = [day for day, data in daily_allocation.items() 
                   if data['rest_minutes'] < 240]
        
        if low_rest:
            recommendations.append(
                f"Insufficient rest time on {', '.join(low_rest)}. "
                f"Ensure at least 4 hours of free time daily."
            )
        
        # Check for study-work balance
        for day, data in daily_allocation.items():
            if data['work_minutes'] > 0 and data['study_minutes'] > 360:
                recommendations.append(
                    f"{day}: Heavy study load ({data['study_minutes']//60}h) combined with work. "
                    f"Consider lighter study tasks on work days."
                )
        
        if not recommendations:
            recommendations.append("Schedule is well-balanced. Maintain current distribution.")
        
        return recommendations
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes"""
        try:
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        except:
            return 0
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes to HH:MM"""
        h = minutes // 60
        m = minutes % 60
        return f"{h:02d}:{m:02d}"
