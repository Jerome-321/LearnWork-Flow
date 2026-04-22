"""
Genetic Algorithm for Complex Schedule Optimization
Explores multiple scheduling solutions for optimal task arrangement
"""

import random
from typing import List, Dict, Tuple
from datetime import datetime

class GeneticScheduler:
    """
    Genetic Algorithm for schedule optimization:
    1. Generate initial population of schedules
    2. Evaluate fitness of each schedule
    3. Select best schedules (selection)
    4. Crossover to create new schedules
    5. Mutate for diversity
    6. Repeat until optimal solution found
    """
    
    def __init__(self, population_size=50, generations=100, mutation_rate=0.1):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.best_schedule = None
        self.best_fitness = 0.0
        
    def optimize_schedule(self, tasks: List[Dict], fixed_events: List[Dict], 
                         work_schedules: List[Dict]) -> Tuple[Dict, float]:
        """
        Find optimal schedule using genetic algorithm
        
        Args:
            tasks: Tasks to schedule
            fixed_events: Fixed events (constraints)
            work_schedules: Work schedule constraints
            
        Returns:
            Tuple of (best_schedule, fitness_score)
        """
        # Generate initial population
        population = self._generate_initial_population(tasks, fixed_events, work_schedules)
        
        # Evolution loop
        for generation in range(self.generations):
            # Evaluate fitness
            fitness_scores = [self._calculate_fitness(schedule, tasks, fixed_events, work_schedules) 
                            for schedule in population]
            
            # Track best solution
            max_fitness_idx = fitness_scores.index(max(fitness_scores))
            if fitness_scores[max_fitness_idx] > self.best_fitness:
                self.best_fitness = fitness_scores[max_fitness_idx]
                self.best_schedule = population[max_fitness_idx].copy()
            
            # Early stopping if perfect solution found
            if self.best_fitness >= 95.0:
                break
            
            # Selection
            selected = self._selection(population, fitness_scores)
            
            # Crossover
            offspring = self._crossover(selected, tasks)
            
            # Mutation
            offspring = self._mutation(offspring, tasks, fixed_events, work_schedules)
            
            # New population
            population = offspring
        
        return self.best_schedule, self.best_fitness
    
    def _generate_initial_population(self, tasks: List[Dict], fixed_events: List[Dict], 
                                    work_schedules: List[Dict]) -> List[Dict]:
        """Generate initial population of random schedules"""
        population = []
        
        for _ in range(self.population_size):
            schedule = {}
            for task in tasks:
                # Random time slot
                time_slot = self._random_time_slot(task.get('priority', 'medium'))
                schedule[task.get('id')] = time_slot
            population.append(schedule)
        
        return population
    
    def _calculate_fitness(self, schedule: Dict, tasks: List[Dict], 
                          fixed_events: List[Dict], work_schedules: List[Dict]) -> float:
        """
        Calculate fitness score for a schedule (0-100)
        
        Fitness criteria:
        1. No conflicts with fixed events (hard constraint)
        2. No conflicts with work schedules (hard constraint)
        3. No task overlaps (hard constraint)
        4. Priority-time alignment (soft constraint)
        5. Deadline adherence (soft constraint)
        6. Productivity optimization (soft constraint)
        """
        score = 100.0
        
        # Penalty for constraint violations
        conflict_penalty = 0
        
        # Check fixed event conflicts
        for task in tasks:
            task_id = task.get('id')
            if task_id not in schedule:
                continue
            
            task_time = schedule[task_id]
            task_day = task.get('day', 'Monday')
            task_duration = task.get('estimatedDuration', 60)
            
            # Check against fixed events
            for event in fixed_events:
                if event.get('day') != task_day:
                    continue
                
                if self._times_overlap(task_time, task_duration, 
                                      event.get('time'), event.get('duration', 60)):
                    conflict_penalty += 30  # Heavy penalty
            
            # Check against work schedules
            for work in work_schedules:
                if task_day not in work.get('work_days', []):
                    continue
                
                work_start = work.get('start_time', '09:00')
                work_end = work.get('end_time', '17:00')
                work_duration = self._time_to_minutes(work_end) - self._time_to_minutes(work_start)
                
                if self._times_overlap(task_time, task_duration, work_start, work_duration):
                    conflict_penalty += 25  # Heavy penalty
        
        # Check task-task overlaps
        task_times = {}
        for task in tasks:
            task_id = task.get('id')
            if task_id in schedule:
                day = task.get('day', 'Monday')
                if day not in task_times:
                    task_times[day] = []
                task_times[day].append({
                    'time': schedule[task_id],
                    'duration': task.get('estimatedDuration', 60)
                })
        
        for day, times in task_times.items():
            for i in range(len(times)):
                for j in range(i + 1, len(times)):
                    if self._times_overlap(times[i]['time'], times[i]['duration'],
                                          times[j]['time'], times[j]['duration']):
                        conflict_penalty += 20  # Heavy penalty
        
        score -= conflict_penalty
        
        # Reward priority-time alignment
        alignment_bonus = 0
        for task in tasks:
            task_id = task.get('id')
            if task_id not in schedule:
                continue
            
            task_time = schedule[task_id]
            priority = task.get('priority', 'medium')
            time_minutes = self._time_to_minutes(task_time)
            
            # High-priority in morning
            if priority in ['critical', 'high'] and 540 <= time_minutes <= 720:
                alignment_bonus += 5
            # Medium-priority in afternoon
            elif priority == 'medium' and 840 <= time_minutes <= 1020:
                alignment_bonus += 5
            # Low-priority in evening
            elif priority == 'low' and 1020 <= time_minutes <= 1200:
                alignment_bonus += 5
        
        score += alignment_bonus
        
        # Ensure score is in valid range
        return max(0.0, min(100.0, score))
    
    def _selection(self, population: List[Dict], fitness_scores: List[float]) -> List[Dict]:
        """
        Tournament selection: select best individuals for breeding
        """
        selected = []
        tournament_size = 5
        
        for _ in range(self.population_size):
            # Random tournament
            tournament_indices = random.sample(range(len(population)), tournament_size)
            tournament_fitness = [fitness_scores[i] for i in tournament_indices]
            winner_idx = tournament_indices[tournament_fitness.index(max(tournament_fitness))]
            selected.append(population[winner_idx].copy())
        
        return selected
    
    def _crossover(self, selected: List[Dict], tasks: List[Dict]) -> List[Dict]:
        """
        Single-point crossover: combine two parent schedules
        """
        offspring = []
        
        for i in range(0, len(selected), 2):
            if i + 1 < len(selected):
                parent1 = selected[i]
                parent2 = selected[i + 1]
                
                # Crossover point
                task_ids = list(parent1.keys())
                if len(task_ids) > 1:
                    crossover_point = random.randint(1, len(task_ids) - 1)
                    
                    # Create offspring
                    child1 = {}
                    child2 = {}
                    
                    for idx, task_id in enumerate(task_ids):
                        if idx < crossover_point:
                            child1[task_id] = parent1[task_id]
                            child2[task_id] = parent2[task_id]
                        else:
                            child1[task_id] = parent2[task_id]
                            child2[task_id] = parent1[task_id]
                    
                    offspring.append(child1)
                    offspring.append(child2)
                else:
                    offspring.append(parent1)
                    offspring.append(parent2)
            else:
                offspring.append(selected[i])
        
        return offspring
    
    def _mutation(self, offspring: List[Dict], tasks: List[Dict], 
                 fixed_events: List[Dict], work_schedules: List[Dict]) -> List[Dict]:
        """
        Mutation: randomly change time slots for diversity
        """
        for schedule in offspring:
            if random.random() < self.mutation_rate:
                # Mutate random task
                task_ids = list(schedule.keys())
                if task_ids:
                    mutate_id = random.choice(task_ids)
                    
                    # Find task
                    task = next((t for t in tasks if t.get('id') == mutate_id), None)
                    if task:
                        # Assign new random time
                        schedule[mutate_id] = self._random_time_slot(task.get('priority', 'medium'))
        
        return offspring
    
    def _random_time_slot(self, priority: str) -> str:
        """Generate random time slot based on priority"""
        if priority in ['critical', 'high']:
            slots = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00']
        elif priority == 'medium':
            slots = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
        else:
            slots = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
        
        return random.choice(slots)
    
    def _times_overlap(self, time1: str, duration1: int, time2: str, duration2: int) -> bool:
        """Check if two time slots overlap"""
        start1 = self._time_to_minutes(time1)
        end1 = start1 + duration1
        
        start2 = self._time_to_minutes(time2)
        end2 = start2 + duration2
        
        return start1 < end2 and end1 > start2
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes since midnight"""
        try:
            h, m = time_str.split(':')
            return int(h) * 60 + int(m)
        except:
            return 0
    
    def get_optimization_stats(self) -> Dict:
        """Get statistics about the optimization process"""
        return {
            'best_fitness': self.best_fitness,
            'population_size': self.population_size,
            'generations': self.generations,
            'mutation_rate': self.mutation_rate,
            'optimization_quality': 'Excellent' if self.best_fitness >= 90 else 
                                   'Good' if self.best_fitness >= 75 else
                                   'Fair' if self.best_fitness >= 60 else 'Poor'
        }
