"""
Greedy Algorithm for Efficient Initial Task Scheduling
Selects best available time slot based on priority and productivity heuristics
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta

class GreedyScheduler:
    """
    Greedy algorithm for task scheduling:
    1. Sort tasks by priority and deadline
    2. Assign each task to best available slot
    3. Optimize for productivity patterns
    """
    
    def __init__(self):
        self.scheduled_tasks = []
        self.time_slots = {}  # Track occupied time slots
        
    def schedule_tasks(self, tasks: List[Dict], fixed_events: List[Dict], work_schedules: List[Dict]) -> Dict:
        """
        Schedule tasks using greedy approach
        
        Args:
            tasks: List of tasks to schedule
            fixed_events: Fixed events that block time slots
            work_schedules: Work schedule constraints
            
        Returns:
            Dictionary mapping task IDs to scheduled times
        """
        schedule = {}
        
        # Step 1: Sort tasks by priority and deadline (greedy selection)
        sorted_tasks = self._sort_tasks_by_priority(tasks)
        
        # Step 2: Mark fixed events as occupied
        occupied_slots = self._mark_fixed_events(fixed_events)
        
        # Step 3: Mark work schedules as occupied
        occupied_slots = self._mark_work_schedules(work_schedules, occupied_slots)
        
        # Step 4: Assign each task to best available slot
        for task in sorted_tasks:
            best_slot = self._find_best_slot(task, occupied_slots, work_schedules)
            
            if best_slot:
                task_id = task.get('id')
                schedule[task_id] = best_slot
                
                # Mark slot as occupied
                day = task.get('day', 'Monday')
                duration = task.get('estimatedDuration', 60)
                self._occupy_slot(occupied_slots, day, best_slot, duration)
        
        return schedule
    
    def _sort_tasks_by_priority(self, tasks: List[Dict]) -> List[Dict]:
        """
        Sort tasks by priority (critical > high > medium > low) and deadline
        Greedy criterion: handle most important tasks first
        """
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        
        def task_key(task):
            priority = task.get('priority', 'medium')
            priority_value = priority_order.get(priority, 2)
            
            # Parse deadline
            try:
                due_date = datetime.fromisoformat(task.get('dueDate', '').replace('Z', '+00:00'))
                deadline_value = due_date.timestamp()
            except:
                deadline_value = float('inf')
            
            # Sort by priority first, then deadline
            return (priority_value, deadline_value)
        
        return sorted(tasks, key=task_key)
    
    def _mark_fixed_events(self, fixed_events: List[Dict]) -> Dict:
        """Mark fixed events as occupied time slots"""
        occupied = {}
        
        for event in fixed_events:
            day = event.get('day', 'Monday')
            time = event.get('time', '00:00')
            duration = event.get('duration', 60)
            
            if day not in occupied:
                occupied[day] = []
            
            start_minutes = self._time_to_minutes(time)
            end_minutes = start_minutes + duration
            
            occupied[day].append({
                'start': start_minutes,
                'end': end_minutes,
                'type': 'fixed_event'
            })
        
        return occupied
    
    def _mark_work_schedules(self, work_schedules: List[Dict], occupied: Dict) -> Dict:
        """Mark work schedules as occupied time slots"""
        for schedule in work_schedules:
            work_days = schedule.get('work_days', [])
            start_time = schedule.get('start_time', '09:00')
            end_time = schedule.get('end_time', '17:00')
            
            start_minutes = self._time_to_minutes(start_time)
            end_minutes = self._time_to_minutes(end_time)
            
            for day in work_days:
                if day not in occupied:
                    occupied[day] = []
                
                occupied[day].append({
                    'start': start_minutes,
                    'end': end_minutes,
                    'type': 'work_schedule'
                })
        
        return occupied
    
    def _find_best_slot(self, task: Dict, occupied_slots: Dict, work_schedules: List[Dict]) -> str:
        """
        Find best available time slot for task using heuristics
        
        Heuristics:
        - High-priority tasks: morning slots (9-12)
        - Medium-priority tasks: afternoon slots (14-17)
        - Low-priority tasks: evening slots (17-20)
        - Avoid occupied slots
        """
        priority = task.get('priority', 'medium')
        day = task.get('day', 'Monday')
        duration = task.get('estimatedDuration', 60)
        
        # Get candidate slots based on priority (heuristic)
        candidate_slots = self._get_priority_slots(priority)
        
        # Get occupied slots for this day
        day_occupied = occupied_slots.get(day, [])
        
        # Find first available slot
        for slot_time in candidate_slots:
            slot_minutes = self._time_to_minutes(slot_time)
            slot_end = slot_minutes + duration
            
            # Check if slot is available
            is_available = True
            for occupied in day_occupied:
                # Check overlap
                if slot_minutes < occupied['end'] and slot_end > occupied['start']:
                    is_available = False
                    break
            
            if is_available:
                return slot_time
        
        # Fallback: return late evening slot
        return '20:00'
    
    def _get_priority_slots(self, priority: str) -> List[str]:
        """
        Get candidate time slots based on priority (heuristic-based)
        
        Heuristics:
        - Critical/High: Peak focus hours (morning)
        - Medium: Steady productivity hours (afternoon)
        - Low: Flexible hours (evening)
        """
        if priority in ['critical', 'high']:
            return ['09:00', '10:00', '11:00', '08:00', '14:00']
        elif priority == 'medium':
            return ['14:00', '15:00', '16:00', '13:00', '10:00']
        else:  # low
            return ['17:00', '18:00', '19:00', '20:00', '16:00']
    
    def _occupy_slot(self, occupied_slots: Dict, day: str, time: str, duration: int):
        """Mark a time slot as occupied"""
        if day not in occupied_slots:
            occupied_slots[day] = []
        
        start_minutes = self._time_to_minutes(time)
        end_minutes = start_minutes + duration
        
        occupied_slots[day].append({
            'start': start_minutes,
            'end': end_minutes,
            'type': 'scheduled_task'
        })
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight"""
        try:
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        except:
            return 0
    
    def calculate_schedule_quality(self, schedule: Dict, tasks: List[Dict]) -> float:
        """
        Calculate quality score of schedule (0-100)
        
        Metrics:
        - Priority alignment: high-priority tasks in optimal slots
        - Time distribution: tasks spread throughout day
        - Deadline adherence: tasks scheduled before deadlines
        """
        if not schedule:
            return 0.0
        
        total_score = 0.0
        task_count = len(schedule)
        
        for task in tasks:
            task_id = task.get('id')
            if task_id not in schedule:
                continue
            
            scheduled_time = schedule[task_id]
            priority = task.get('priority', 'medium')
            
            # Score based on priority-time alignment
            time_minutes = self._time_to_minutes(scheduled_time)
            
            if priority in ['critical', 'high']:
                # Prefer morning slots (9-12)
                if 540 <= time_minutes <= 720:  # 9:00-12:00
                    total_score += 100
                elif 480 <= time_minutes <= 900:  # 8:00-15:00
                    total_score += 70
                else:
                    total_score += 40
            elif priority == 'medium':
                # Prefer afternoon slots (14-17)
                if 840 <= time_minutes <= 1020:  # 14:00-17:00
                    total_score += 100
                elif 600 <= time_minutes <= 1080:  # 10:00-18:00
                    total_score += 70
                else:
                    total_score += 40
            else:  # low
                # Flexible, prefer evening
                if 1020 <= time_minutes <= 1200:  # 17:00-20:00
                    total_score += 100
                else:
                    total_score += 60
        
        return total_score / task_count if task_count > 0 else 0.0
