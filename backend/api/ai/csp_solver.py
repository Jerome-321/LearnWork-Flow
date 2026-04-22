"""
Constraint Satisfaction Problem (CSP) Solver for Task Scheduling
Enforces strict constraints: no overlapping tasks, preserve fixed events
"""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional

class SchedulingCSP:
    """
    CSP Solver for task scheduling with hard constraints:
    1. No overlapping tasks
    2. Fixed events cannot be moved
    3. Work schedules must be respected
    4. Tasks must fit within available time slots
    """
    
    def __init__(self):
        self.constraints = []
        self.variables = []  # Tasks to schedule
        self.domains = {}    # Possible time slots for each task
        
    def add_constraint(self, constraint_type: str, data: Dict):
        """Add a hard constraint to the CSP"""
        self.constraints.append({
            'type': constraint_type,
            'data': data
        })
    
    def is_consistent(self, task: Dict, time_slot: str, assignments: Dict) -> bool:
        """
        Check if assigning task to time_slot violates any constraints
        
        Args:
            task: Task to schedule
            time_slot: Proposed time slot (HH:MM format)
            assignments: Current task assignments
            
        Returns:
            True if assignment is consistent with all constraints
        """
        task_start = self._time_to_minutes(time_slot)
        task_duration = task.get('estimatedDuration', 60)
        task_end = task_start + task_duration
        task_day = task.get('day', 'Monday')
        
        # Check each constraint
        for constraint in self.constraints:
            if constraint['type'] == 'no_overlap':
                # Check against all assigned tasks
                for assigned_task_id, assigned_time in assignments.items():
                    if assigned_task_id == task.get('id'):
                        continue
                    
                    assigned_task = constraint['data'].get(assigned_task_id)
                    if not assigned_task:
                        continue
                    
                    # Only check same-day tasks
                    if assigned_task.get('day') != task_day:
                        continue
                    
                    assigned_start = self._time_to_minutes(assigned_time)
                    assigned_duration = assigned_task.get('estimatedDuration', 60)
                    assigned_end = assigned_start + assigned_duration
                    
                    # Check for overlap
                    if task_start < assigned_end and task_end > assigned_start:
                        return False
            
            elif constraint['type'] == 'fixed_event':
                # Check against fixed events
                fixed_events = constraint['data'].get('events', [])
                for event in fixed_events:
                    if event.get('day') != task_day:
                        continue
                    
                    event_start = self._time_to_minutes(event.get('time', '00:00'))
                    event_duration = event.get('duration', 60)
                    event_end = event_start + event_duration
                    
                    # Task cannot overlap with fixed event
                    if task_start < event_end and task_end > event_start:
                        return False
            
            elif constraint['type'] == 'work_schedule':
                # Check against work schedules
                work_schedules = constraint['data'].get('schedules', [])
                for schedule in work_schedules:
                    if task_day not in schedule.get('work_days', []):
                        continue
                    
                    work_start = self._time_to_minutes(schedule.get('start_time', '09:00'))
                    work_end = self._time_to_minutes(schedule.get('end_time', '17:00'))
                    
                    # Handle overnight shifts
                    if work_end < work_start:
                        # Overnight: task cannot be during work hours
                        if task_start >= work_start or task_end <= work_end:
                            return False
                    else:
                        # Same day: task cannot overlap with work
                        if task_start < work_end and task_end > work_start:
                            return False
        
        return True
    
    def backtracking_search(self, tasks: List[Dict], assignments: Dict = None) -> Optional[Dict]:
        """
        Backtracking search to find valid assignment
        
        Args:
            tasks: List of tasks to schedule
            assignments: Current partial assignment
            
        Returns:
            Complete assignment if solution exists, None otherwise
        """
        if assignments is None:
            assignments = {}
        
        # Base case: all tasks assigned
        if len(assignments) == len(tasks):
            return assignments
        
        # Select unassigned task
        unassigned = [t for t in tasks if t.get('id') not in assignments]
        if not unassigned:
            return assignments
        
        task = unassigned[0]
        task_id = task.get('id')
        
        # Try each value in domain
        domain = self.domains.get(task_id, self._generate_default_domain(task))
        
        for time_slot in domain:
            if self.is_consistent(task, time_slot, assignments):
                # Make assignment
                assignments[task_id] = time_slot
                
                # Recursive call
                result = self.backtracking_search(tasks, assignments)
                if result is not None:
                    return result
                
                # Backtrack
                del assignments[task_id]
        
        return None
    
    def solve(self, tasks: List[Dict], fixed_events: List[Dict], work_schedules: List[Dict]) -> Dict:
        """
        Solve the CSP and return valid schedule
        
        Args:
            tasks: Tasks to schedule
            fixed_events: Fixed events that cannot be moved
            work_schedules: Work schedule constraints
            
        Returns:
            Dictionary mapping task IDs to time slots
        """
        # Add constraints
        self.add_constraint('no_overlap', {t.get('id'): t for t in tasks})
        self.add_constraint('fixed_event', {'events': fixed_events})
        self.add_constraint('work_schedule', {'schedules': work_schedules})
        
        # Generate domains for each task
        for task in tasks:
            self.domains[task.get('id')] = self._generate_domain(task, fixed_events, work_schedules)
        
        # Solve using backtracking
        solution = self.backtracking_search(tasks)
        
        return solution if solution else {}
    
    def _generate_domain(self, task: Dict, fixed_events: List[Dict], work_schedules: List[Dict]) -> List[str]:
        """Generate possible time slots for a task"""
        priority = task.get('priority', 'medium')
        
        # Priority-based time preferences
        if priority == 'high' or priority == 'critical':
            slots = ['09:00', '10:00', '11:00', '08:00', '14:00', '15:00']
        elif priority == 'medium':
            slots = ['14:00', '15:00', '16:00', '10:00', '11:00', '13:00']
        else:  # low
            slots = ['17:00', '18:00', '19:00', '16:00', '20:00']
        
        return slots
    
    def _generate_default_domain(self, task: Dict) -> List[str]:
        """Generate default domain if not set"""
        return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight"""
        try:
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        except:
            return 0
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to HH:MM"""
        h = minutes // 60
        m = minutes % 60
        return f"{h:02d}:{m:02d}"
