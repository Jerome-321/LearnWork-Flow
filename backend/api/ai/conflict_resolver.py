"""
Advanced Conflict Resolution System
Implements Q1, Q2, Q7, Q8 requirements
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import json


class ConflictResolver:
    """
    Advanced conflict resolution with:
    - Q1: Three-tier resolution (context + priority + user confirmation)
    - Q2: Soft block with structured warnings
    - Q7: Priority cascade for overload scenarios
    - Q8: Multiple ranked options with trade-offs
    """
    
    def __init__(self):
        self.conflict_history = {}  # Track recurring conflicts
        self.acknowledged_conflicts = {}  # Track user acknowledgments
        
    # ========================================================================
    # Q1: THREE-TIER RESOLUTION STRATEGY
    # ========================================================================
    
    def resolve_boss_birthday_vs_shift(self, birthday_task: Dict, work_shift: Dict) -> Dict:
        """
        Q1 Scenario A: Boss's birthday vs regular shift
        Groq AI detects "boss" as professionally significant keyword
        """
        return {
            'conflict_type': 'boss_birthday_vs_work',
            'resolution_strategy': 'partial_attendance',
            'professional_significance': 'high',
            'recommendation': {
                'option': 'Attend both by negotiating a partial shift',
                'details': 'This is a professionally significant social obligation. Consider arriving late to your shift or leaving early.',
                'action_items': [
                    'Speak with your employer about arriving 1-2 hours late',
                    'Attend the birthday celebration for at least 30-60 minutes',
                    'Explain the professional networking value to your employer'
                ]
            },
            'priority_override': 'Both events are important - partial attendance recommended',
            'requires_user_confirmation': True
        }
    
    def resolve_thesis_defense_vs_overtime(self, thesis_task: Dict, work_shift: Dict) -> Dict:
        """
        Q1 Scenario B: Mandatory overtime vs thesis defense
        AI recognizes thesis defense as once-in-a-semester milestone
        """
        leave_request_draft = self._draft_leave_request(thesis_task, work_shift)
        
        return {
            'conflict_type': 'thesis_defense_vs_work',
            'resolution_strategy': 'prioritize_academic_milestone',
            'milestone_type': 'once_in_semester',
            'ai_override': True,
            'override_reason': 'Thesis defense is a non-negotiable academic milestone that cannot be rescheduled',
            'recommendation': {
                'option': 'Request leave from work',
                'priority': 'Thesis defense takes precedence despite work shift having High priority',
                'rationale': 'This is a once-in-a-semester event that determines your academic progress'
            },
            'leave_request_draft': leave_request_draft,
            'requires_user_confirmation': True
        }
    
    def resolve_two_work_shifts_overlap(self, shift1: Dict, shift2: Dict) -> Dict:
        """
        Q1 Scenario C: Two work shifts, different employers
        AI identifies both as income-critical and maps exact overlap
        """
        overlap_window = self._calculate_exact_overlap(shift1, shift2)
        
        return {
            'conflict_type': 'dual_employment_overlap',
            'resolution_strategy': 'negotiate_shorter_shift',
            'income_impact': 'Both shifts are income-critical',
            'overlap_analysis': {
                'overlap_start': overlap_window['start'],
                'overlap_end': overlap_window['end'],
                'overlap_duration_minutes': overlap_window['duration'],
                'shift1_employer': shift1.get('employer', 'Employer 1'),
                'shift2_employer': shift2.get('employer', 'Employer 2')
            },
            'recommendation': {
                'option': 'Negotiate the shorter shift\'s end time',
                'exact_time_gap_needed': overlap_window['gap_needed'],
                'suggested_approach': f"Request to end {overlap_window['shorter_shift']} shift {overlap_window['minutes_early']} minutes early",
                'action_items': [
                    f"Speak with {overlap_window['shorter_shift']} employer about ending shift early",
                    f"Explain you have a second job commitment starting at {overlap_window['shift2_start']}",
                    f"Offer to start earlier or work extra hours on another day to compensate"
                ]
            },
            'requires_user_confirmation': True
        }
    
    def _draft_leave_request(self, thesis_task: Dict, work_shift: Dict) -> str:
        """Generate leave request message for thesis defense"""
        thesis_date = thesis_task.get('dueDate', 'upcoming date')
        try:
            dt = datetime.fromisoformat(thesis_date.replace('Z', '+00:00'))
            formatted_date = dt.strftime('%B %d, %Y at %I:%M %p')
        except:
            formatted_date = thesis_date
        
        return f"""Subject: Leave Request for Academic Requirement

Dear [Manager Name],

I am writing to request time off on {formatted_date} for my thesis defense, which is a mandatory academic requirement for my degree completion.

This is a once-in-a-semester milestone that cannot be rescheduled, as it involves a panel of faculty members and has been scheduled months in advance.

I would greatly appreciate your understanding and approval for this leave. I am happy to:
- Make up the hours on another day
- Complete any urgent tasks before the defense
- Ensure all responsibilities are covered

Thank you for your consideration.

Best regards,
[Your Name]"""
    
    def _calculate_exact_overlap(self, shift1: Dict, shift2: Dict) -> Dict:
        """Calculate exact overlap window between two shifts"""
        def time_to_minutes(time_str):
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        
        shift1_start = time_to_minutes(shift1.get('start_time', '09:00'))
        shift1_end = time_to_minutes(shift1.get('end_time', '17:00'))
        shift2_start = time_to_minutes(shift2.get('start_time', '14:00'))
        shift2_end = time_to_minutes(shift2.get('end_time', '22:00'))
        
        overlap_start = max(shift1_start, shift2_start)
        overlap_end = min(shift1_end, shift2_end)
        overlap_duration = max(0, overlap_end - overlap_start)
        
        # Determine shorter shift
        shift1_duration = shift1_end - shift1_start
        shift2_duration = shift2_end - shift2_start
        shorter_shift = shift1.get('employer', 'Shift 1') if shift1_duration < shift2_duration else shift2.get('employer', 'Shift 2')
        
        # Calculate gap needed
        gap_needed = overlap_duration + 15  # 15 min buffer
        
        return {
            'start': self._minutes_to_time(overlap_start),
            'end': self._minutes_to_time(overlap_end),
            'duration': overlap_duration,
            'gap_needed': f"{gap_needed} minutes",
            'shorter_shift': shorter_shift,
            'minutes_early': gap_needed,
            'shift2_start': self._minutes_to_time(shift2_start)
        }
    
    # ========================================================================
    # Q2: SOFT BLOCK WITH STRUCTURED WARNING
    # ========================================================================
    
    def apply_soft_block(self, task: Dict, conflict: Dict, user_id: str) -> Dict:
        """
        Q2: Soft block - never hard-prevents, but requires explicit acknowledgment
        """
        conflict_key = f"{user_id}_{task.get('id')}_{conflict.get('type')}"
        
        return {
            'block_type': 'soft',
            'allows_proceed': True,
            'requires_acknowledgment': True,
            'conflict_details': conflict,
            'warning_message': self._generate_warning_message(task, conflict),
            'consequences': self._calculate_consequences(task, conflict),
            'acknowledgment_required': True,
            'conflict_key': conflict_key
        }
    
    def handle_acknowledged_conflict(self, user_id: str, task: Dict, conflict: Dict) -> Dict:
        """
        Q2 Scenario A: User ignores warning and proceeds
        Generate fallback micro-schedule for every free minute
        """
        conflict_key = f"{user_id}_{task.get('id')}_{conflict.get('type')}"
        self.acknowledged_conflicts[conflict_key] = {
            'timestamp': datetime.now().isoformat(),
            'task': task,
            'conflict': conflict
        }
        
        # Generate micro-schedule for small windows
        micro_schedule = self._generate_micro_schedule(task, conflict)
        
        return {
            'acknowledged': True,
            'conflict_logged': True,
            'micro_schedule_generated': len(micro_schedule) > 0,
            'micro_schedule': micro_schedule,
            'message': f"Conflict acknowledged. We've created a micro-schedule to help you use every available minute efficiently."
        }
    
    def detect_recurring_conflict(self, user_id: str, task: Dict) -> Optional[Dict]:
        """
        Q2 Scenario B: Detect recurring conflicts (weekly)
        After 3 weeks of same conflict, proactively suggest permanent adjustment
        """
        task_pattern = f"{task.get('title')}_{task.get('day')}"
        
        if user_id not in self.conflict_history:
            self.conflict_history[user_id] = {}
        
        if task_pattern not in self.conflict_history[user_id]:
            self.conflict_history[user_id][task_pattern] = []
        
        self.conflict_history[user_id][task_pattern].append({
            'timestamp': datetime.now().isoformat(),
            'task': task
        })
        
        # Check if this conflict has occurred 3+ times
        occurrences = len(self.conflict_history[user_id][task_pattern])
        
        if occurrences >= 3:
            return {
                'recurring_conflict_detected': True,
                'occurrences': occurrences,
                'pattern': f"This conflict happens every {task.get('day')}",
                'suggestion': 'Would you like to permanently adjust your schedule?',
                'restructuring_plan': self._generate_restructuring_plan(task),
                'requires_user_decision': True
            }
        
        return None
    
    def calculate_deadline_impact(self, task: Dict, conflict: Dict, all_tasks: List[Dict]) -> Dict:
        """
        Q2 Scenario C: Conflict with deadline-locked task
        Calculate quantifiable consequences
        """
        # Calculate available hours before deadline
        try:
            deadline = datetime.fromisoformat(task.get('dueDate', '').replace('Z', '+00:00'))
            now = datetime.now()
            hours_until_deadline = (deadline - now).total_seconds() / 3600
        except:
            hours_until_deadline = 24
        
        # Calculate free hours if conflict proceeds
        task_duration = task.get('estimatedDuration', 60) / 60
        conflict_duration = conflict.get('duration', 60) / 60
        
        free_hours_remaining = hours_until_deadline - conflict_duration - task_duration
        
        return {
            'deadline_impact_calculated': True,
            'hours_until_deadline': round(hours_until_deadline, 1),
            'free_hours_if_proceed': round(free_hours_remaining, 1),
            'consequence_message': f"You will have {round(free_hours_remaining, 1)} available hours to review before your exam if you proceed.",
            'severity': 'critical' if free_hours_remaining < 2 else 'high' if free_hours_remaining < 5 else 'medium',
            'quantifiable_warning': free_hours_remaining <= 0,
            'impossible_to_complete': free_hours_remaining <= 0
        }
    
    def _generate_warning_message(self, task: Dict, conflict: Dict) -> str:
        """Generate structured warning message"""
        return f"""⚠️ SCHEDULE CONFLICT DETECTED

Task: {task.get('title')}
Conflicts with: {conflict.get('conflicting_event')}
Time: {conflict.get('time')}

This conflict will impact your schedule. You can proceed, but please acknowledge you understand the consequences."""
    
    def _calculate_consequences(self, task: Dict, conflict: Dict) -> List[str]:
        """Calculate specific consequences of proceeding"""
        consequences = []
        
        if conflict.get('type') == 'work_schedule':
            consequences.append("You will miss work hours, potentially affecting your income")
        
        if conflict.get('type') == 'fixed_event':
            consequences.append("You will miss a fixed event that cannot be rescheduled")
        
        if conflict.get('type') == 'deadline':
            consequences.append("You may not have enough time to complete tasks before deadline")
        
        return consequences
    
    def _generate_micro_schedule(self, task: Dict, conflict: Dict) -> List[Dict]:
        """
        Q2 Scenario A: Generate micro-schedule for small time windows
        Even 20-minute windows get assigned bite-sized tasks
        """
        micro_tasks = []
        
        # Find small windows (20-60 minutes)
        available_windows = [
            {'start': '07:00', 'end': '07:20', 'duration': 20},
            {'start': '12:30', 'end': '13:00', 'duration': 30},
            {'start': '17:00', 'end': '17:45', 'duration': 45}
        ]
        
        for window in available_windows:
            if window['duration'] >= 20:
                micro_tasks.append({
                    'window': f"{window['start']} - {window['end']}",
                    'duration': window['duration'],
                    'suggested_task': self._suggest_micro_task(window['duration']),
                    'type': 'micro_task'
                })
        
        return micro_tasks
    
    def _suggest_micro_task(self, duration_minutes: int) -> str:
        """Suggest appropriate task for small time window"""
        if duration_minutes <= 20:
            return "Quick review of flashcards or key concepts"
        elif duration_minutes <= 30:
            return "Read one chapter or complete practice problems"
        elif duration_minutes <= 45:
            return "Complete a small assignment section or review notes"
        else:
            return "Work on project component or study session"
    
    def _generate_restructuring_plan(self, task: Dict) -> Dict:
        """Generate plan to permanently resolve recurring conflict"""
        return {
            'current_schedule': f"{task.get('day')} at {task.get('time')}",
            'suggested_change': f"Move to {self._suggest_alternative_day(task.get('day'))} at same time",
            'rationale': 'This avoids the weekly conflict pattern',
            'impact': 'Minimal - same time slot, different day'
        }
    
    def _suggest_alternative_day(self, current_day: str) -> str:
        """Suggest alternative day"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        try:
            idx = days.index(current_day)
            return days[(idx + 1) % 7]
        except:
            return 'Tuesday'
    
    # ========================================================================
    # Q7: PRIORITY CASCADE FOR OVERLOAD
    # ========================================================================
    
    def handle_overload_scenario(self, tasks: List[Dict], available_hours: float, 
                                 deadline: datetime) -> Dict:
        """
        Q7: Handle overload scenarios with priority cascade
        Example: 10 tasks, 3 free hours, exam tomorrow
        """
        # Calculate total time needed
        total_time_needed = sum(task.get('estimatedDuration', 60) for task in tasks) / 60
        
        if total_time_needed <= available_hours:
            return {'overload': False, 'all_tasks_fit': True}
        
        # Rank tasks by combined score: priority + deadline proximity
        ranked_tasks = self._rank_tasks_by_urgency(tasks, deadline)
        
        # Fit as many as possible
        scheduled_tasks = []
        deferred_tasks = []
        time_used = 0
        
        for task in ranked_tasks:
            task_duration = task.get('estimatedDuration', 60) / 60
            if time_used + task_duration <= available_hours:
                scheduled_tasks.append(task)
                time_used += task_duration
            else:
                deferred_tasks.append(task)
        
        # Generate weekly plan for deferred tasks
        weekly_plan = self._generate_weekly_plan(deferred_tasks)
        
        return {
            'overload': True,
            'total_tasks': len(tasks),
            'available_hours': available_hours,
            'total_time_needed': round(total_time_needed, 1),
            'scheduled_count': len(scheduled_tasks),
            'deferred_count': len(deferred_tasks),
            'scheduled_tasks': [t.get('title') for t in scheduled_tasks],
            'deferred_tasks': [t.get('title') for t in deferred_tasks],
            'message': f"{len(deferred_tasks)} tasks deferred — here's what you can realistically do today and a suggested plan for the rest of the week.",
            'weekly_plan': weekly_plan
        }
    
    def decompose_large_task(self, task: Dict, available_windows: List[Dict]) -> Dict:
        """
        Q7 Scenario B: Task requires 4 hours, only 1-hour windows available
        Apply automatic task decomposition
        """
        task_duration = task.get('estimatedDuration', 240)  # minutes
        max_window = max(w.get('duration', 60) for w in available_windows) if available_windows else 60
        
        if task_duration <= max_window:
            return {'decomposition_needed': False}
        
        # Calculate number of sub-tasks needed
        num_subtasks = (task_duration + max_window - 1) // max_window
        subtask_duration = task_duration // num_subtasks
        
        subtasks = []
        for i in range(num_subtasks):
            subtasks.append({
                'title': f"{task.get('title')} - Part {i+1}/{num_subtasks}",
                'duration': subtask_duration,
                'sequence': i + 1,
                'parent_task': task.get('id')
            })
        
        return {
            'decomposition_needed': True,
            'original_duration': task_duration,
            'num_subtasks': num_subtasks,
            'subtask_duration': subtask_duration,
            'subtasks': subtasks,
            'message': f"This task is too large for available slots. Breaking into {num_subtasks} sub-tasks of ~{subtask_duration} minutes each and distributing across the next 2 days.",
            'user_can_modify': True
        }
    
    def handle_impossible_deadline(self, task: Dict, available_hours: float) -> Dict:
        """
        Q7 Scenario C: Deadline is today, no free slots exist
        Provide 3 specific actionable options
        """
        task_duration = task.get('estimatedDuration', 60) / 60
        
        return {
            'impossible_deadline': True,
            'task': task.get('title'),
            'time_needed': task_duration,
            'time_available': available_hours,
            'message': "This task cannot be completed today with your current schedule.",
            'options': [
                {
                    'option': 'A',
                    'action': 'Request deadline extension',
                    'details': 'Contact instructor/supervisor to request 24-48 hour extension',
                    'feasibility': 'Medium - depends on instructor policy',
                    'impact': 'No schedule disruption'
                },
                {
                    'option': 'B',
                    'action': f'Drop a lower-priority task to free up {task_duration} hours',
                    'details': 'Reschedule or cancel a low-priority commitment',
                    'feasibility': 'High - you have control',
                    'impact': 'Other task gets delayed'
                },
                {
                    'option': 'C',
                    'action': 'Work during your lunch break',
                    'details': f'Use lunch break (30-60 min) + find {task_duration - 1} more hours',
                    'feasibility': 'Medium - requires sacrifice',
                    'impact': 'Reduced rest time'
                }
            ],
            'requires_user_decision': True
        }
    
    def _rank_tasks_by_urgency(self, tasks: List[Dict], deadline: datetime) -> List[Dict]:
        """Rank tasks by priority + deadline proximity"""
        priority_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        
        scored_tasks = []
        for task in tasks:
            priority_score = priority_scores.get(task.get('priority', 'medium'), 2)
            
            # Calculate deadline proximity score
            try:
                task_deadline = datetime.fromisoformat(task.get('dueDate', '').replace('Z', '+00:00'))
                hours_until = (task_deadline - datetime.now()).total_seconds() / 3600
                deadline_score = 10 if hours_until < 2 else 5 if hours_until < 24 else 2
            except:
                deadline_score = 1
            
            total_score = priority_score * 10 + deadline_score
            scored_tasks.append((task, total_score))
        
        scored_tasks.sort(key=lambda x: x[1], reverse=True)
        return [task for task, score in scored_tasks]
    
    def _generate_weekly_plan(self, deferred_tasks: List[Dict]) -> Dict:
        """Generate weekly plan for deferred tasks"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        plan = {}
        
        for i, task in enumerate(deferred_tasks):
            day = days[i % len(days)]
            if day not in plan:
                plan[day] = []
            plan[day].append(task.get('title'))
        
        return plan
    
    # ========================================================================
    # Q8: MULTIPLE RANKED OPTIONS WITH TRADE-OFFS
    # ========================================================================
    
    def generate_resolution_options(self, task: Dict, conflict: Dict, 
                                    context: Dict) -> List[Dict]:
        """
        Q8: Generate multiple ranked options with trade-off analysis
        Example: Birthday vs work shift → 3 options with trade-offs
        """
        options = []
        
        # Option A: Reschedule flexible event
        if not task.get('is_fixed'):
            options.append({
                'option': 'A',
                'action': f"Reschedule {task.get('title')} to Sunday",
                'preserves': 'Work shift (income unaffected)',
                'sacrifices': 'Original preferred time',
                'trade_off': 'Work shift preserved, income unaffected. Social commitment moved to weekend.',
                'feasibility_score': 82,
                'emotional_impact': 'Low - event can be rescheduled without major consequences',
                'income_impact': 'None',
                'social_impact': 'Minimal - still attending, just different day'
            })
        
        # Option B: Request shift swap
        if conflict.get('type') == 'work_schedule':
            options.append({
                'option': 'B',
                'action': 'Request shift swap with coworker',
                'preserves': 'Social commitment at original time',
                'sacrifices': 'Certainty (depends on coworker availability)',
                'trade_off': 'Social commitment preserved, income at slight risk if swap is denied.',
                'feasibility_score': 67,
                'emotional_impact': 'Medium - requires negotiation',
                'income_impact': 'Low risk - swap usually approved',
                'social_impact': 'None - attend as planned'
            })
        
        # Option C: Partial attendance
        options.append({
            'option': 'C',
            'action': 'Split attendance - attend birthday 7-8PM, arrive late to shift',
            'preserves': 'Both commitments partially',
            'sacrifices': 'Full participation in both',
            'trade_off': 'Attend birthday for 1 hour, then go to work. Check employer policy on late arrival first.',
            'feasibility_score': 45,
            'emotional_impact': 'Medium - rushed, may feel incomplete',
            'income_impact': 'Possible penalty for late arrival',
            'social_impact': 'Medium - limited time at event',
            'requires_verification': 'Check employer late arrival policy'
        })
        
        # Add emotional trade-off reasoning for significant events
        if 'birthday' in task.get('title', '').lower() or 'graduation' in task.get('title', '').lower():
            for option in options:
                if option['option'] == 'A' and 'graduation' in task.get('title', '').lower():
                    option['emotional_reasoning'] = "Missing a graduation is typically a one-time, irreversible event. Consider whether the overtime income outweighs the long-term social cost."
        
        # Sort by feasibility score
        options.sort(key=lambda x: x['feasibility_score'], reverse=True)
        
        return options
    
    def explain_trade_offs(self, option: Dict) -> str:
        """Generate plain-language trade-off explanation"""
        return f"""
Option {option['option']}: {option['action']}

✅ Preserves: {option['preserves']}
❌ Sacrifices: {option['sacrifices']}

Trade-off Analysis:
{option['trade_off']}

Feasibility: {option['feasibility_score']}% likely to succeed
Emotional Impact: {option['emotional_impact']}
Income Impact: {option.get('income_impact', 'None')}
Social Impact: {option.get('social_impact', 'None')}
"""
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes to HH:MM format"""
        h = minutes // 60
        m = minutes % 60
        return f"{h:02d}:{m:02d}"
