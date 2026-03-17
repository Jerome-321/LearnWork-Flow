"""
✅ DEEP TASK ANALYZER
Analyzes task title + description to understand intent, difficulty, duration, and urgency
"""

import re
from typing import Dict, Any, Tuple

class TaskAnalyzer:
    
    # Keywords for intent detection
    INTENT_KEYWORDS = {
        "study": ["study", "learn", "read", "review", "memorize", "understand"],
        "project": ["project", "build", "create", "develop", "design", "implement"],
        "communication": ["call", "email", "message", "contact", "meet", "discuss"],
        "writing": ["write", "essay", "paper", "article", "report", "document"],
        "coding": ["code", "program", "debug", "fix", "algorithm", "function"],
        "planning": ["plan", "organize", "schedule", "prepare", "arrange"],
        "fitness": ["exercise", "gym", "run", "workout", "yoga", "sport"],
        "admin": ["pay", "bill", "submit", "register", "apply", "form"],
    }
    
    # Keywords for urgency detection
    URGENT_KEYWORDS = [
        "urgent", "asap", "today", "deadline", "exam", "test", "quiz",
        "due", "submit", "presentation", "meeting", "important", "critical"
    ]
    
    # Keywords for difficulty estimation
    DIFFICULTY_KEYWORDS = {
        "hard": [
            "complex", "difficult", "challenging", "advanced", "thesis", "research",
            "algorithm", "debug", "comprehensive", "in-depth", "analyze", "design"
        ],
        "medium": [
            "project", "assignment", "task", "work", "complete", "develop", "build"
        ],
        "easy": [
            "quick", "simple", "easy", "light", "brief", "short", "simple",
            "straightforward", "basic", "elementary", "quick fix", "minor"
        ]
    }
    
    # Keywords for focus level
    DEEP_WORK_KEYWORDS = [
        "write", "code", "design", "analyze", "research", "study", "learn",
        "project", "algorithm", "debug", "essay", "paper", "thesis", "exam"
    ]
    
    LIGHT_TASK_KEYWORDS = [
        "email", "call", "message", "organize", "admin", "quick", "brief",
        "check", "review", "skim", "schedule", "plan", "arrange"
    ]
    
    @staticmethod
    def extract_duration_hints(text: str) -> int:
        """
        Extract duration hints from text.
        Returns estimated minutes.
        """
        text_lower = text.lower()
        
        # Look for explicit time mentions
        duration_patterns = [
            (r'(\d+)\s*-?\s*(\d+)?\s*(?:minute|min|m)', lambda m: int(m.group(1)) if not m.group(2) else sum(map(int, m.groups())) // 2),
            (r'(\d+)\s*hour', lambda m: int(m.group(1)) * 60),
            (r'(\d+)\s*-\s*(\d+)\s*hour', lambda m: (int(m.group(1)) + int(m.group(2))) * 30),
        ]
        
        for pattern, extractor in duration_patterns:
            match = re.search(pattern, text_lower)
            if match:
                return extractor(match)
        
        # Keyword-based duration estimation
        if any(keyword in text_lower for keyword in ["quick", "brief", "short", "simple", "easy"]):
            return 15
        
        if any(keyword in text_lower for keyword in ["email", "call", "message", "check"]):
            return 10
        
        if any(keyword in text_lower for keyword in ["write", "essay", "report", "paper"]):
            return 120
        
        if any(keyword in text_lower for keyword in ["code", "debug", "program", "algorithm"]):
            return 90
        
        if any(keyword in text_lower for keyword in ["exam", "study", "prepare", "research"]):
            return 180
        
        if any(keyword in text_lower for keyword in ["project", "develop", "design", "build"]):
            return 240
        
        # Default to medium
        return 60
    
    @staticmethod
    def estimate_difficulty(title: str, description: str) -> str:
        """
        Estimate task difficulty: easy, medium, hard
        """
        text = (title + " " + description).lower()
        
        # Check hard difficulty keywords
        hard_score = sum(1 for keyword in TaskAnalyzer.DIFFICULTY_KEYWORDS["hard"] 
                        if keyword in text)
        
        # Check easy difficulty keywords
        easy_score = sum(1 for keyword in TaskAnalyzer.DIFFICULTY_KEYWORDS["easy"] 
                        if keyword in text)
        
        # Check medium difficulty keywords
        medium_score = sum(1 for keyword in TaskAnalyzer.DIFFICULTY_KEYWORDS["medium"] 
                          if keyword in text)
        
        if hard_score > easy_score and hard_score > medium_score:
            return "hard"
        elif easy_score > hard_score and easy_score > medium_score:
            return "easy"
        else:
            return "medium"
    
    @staticmethod
    def detect_intent(title: str, description: str) -> str:
        """
        Detect what the task is really about.
        Returns: study, project, communication, writing, coding, planning, fitness, admin
        """
        text = (title + " " + description).lower()
        
        # Score each intent type
        intent_scores = {}
        for intent, keywords in TaskAnalyzer.INTENT_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text)
            intent_scores[intent] = score
        
        # Return highest scoring intent, default to "task"
        if intent_scores and max(intent_scores.values()) > 0:
            return max(intent_scores, key=intent_scores.get)
        
        return "task"
    
    @staticmethod
    def detect_urgency(title: str, description: str, due_date: str = "") -> str:
        """
        Detect urgency: low, medium, high
        """
        text = (title + " " + description).lower()
        
        # Check for explicit urgent keywords
        urgent_count = sum(1 for keyword in TaskAnalyzer.URGENT_KEYWORDS 
                          if keyword in text)
        
        # Priority in text analysis
        if urgent_count >= 2:
            return "high"
        elif urgent_count == 1:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    def detect_focus_level(title: str, description: str) -> str:
        """
        Detect if task requires deep focus or is light.
        Returns: deep_work or light_task
        """
        text = (title + " " + description).lower()
        
        # Score deep work keywords
        deep_work_score = sum(1 for keyword in TaskAnalyzer.DEEP_WORK_KEYWORDS 
                             if keyword in text)
        
        # Score light task keywords
        light_task_score = sum(1 for keyword in TaskAnalyzer.LIGHT_TASK_KEYWORDS 
                              if keyword in text)
        
        if deep_work_score > light_task_score:
            return "deep_work"
        else:
            return "light_task"
    
    @staticmethod
    def recommend_time_of_day(
        title: str,
        description: str,
        focus_level: str,
        difficulty: str,
        intent: str,
        category: str = "personal"
    ) -> str:
        """
        Recommend best time of day based on analysis.
        Returns: morning, afternoon, evening
        """
        text = (title + " " + description).lower()
        
        # Students have high energy in evening after classes
        if category == "academic":
            if focus_level == "deep_work" or difficulty == "hard":
                return "evening"  # 7-10 PM for focused study
            else:
                return "afternoon"  # 3-5 PM for lighter reading
        
        # Work tasks in morning when alert
        if category == "work":
            if difficulty == "hard" or focus_level == "deep_work":
                return "morning"  # 9-11 AM peak focus
            else:
                return "afternoon"  # Afternoon for routine work
        
        # Personal tasks flexible
        if category == "personal":
            if focus_level == "deep_work":
                return "morning"  # Morning energy for projects
            else:
                return "afternoon"  # Afternoon for light tasks
        
        # Default based on focus level
        if focus_level == "deep_work":
            return "evening"  # Evening for focused work
        else:
            return "afternoon"  # Afternoon for light tasks
    
    @staticmethod
    def analyze(
        title: str,
        description: str,
        category: str = "personal",
        due_date: str = ""
    ) -> Dict[str, Any]:
        """
        Comprehensive task analysis combining all methods.
        """
        
        # Detect all attributes
        intent = TaskAnalyzer.detect_intent(title, description)
        duration_minutes = TaskAnalyzer.extract_duration_hints(title + " " + description)
        difficulty = TaskAnalyzer.estimate_difficulty(title, description)
        focus_level = TaskAnalyzer.detect_focus_level(title, description)
        urgency = TaskAnalyzer.detect_urgency(title, description, due_date)
        best_time = TaskAnalyzer.recommend_time_of_day(
            title, description, focus_level, difficulty, intent, category
        )
        
        # Format duration
        if duration_minutes < 60:
            duration_str = f"{duration_minutes} minutes"
        else:
            hours = duration_minutes / 60
            if hours == int(hours):
                duration_str = f"{int(hours)} hour{'s' if hours > 1 else ''}"
            else:
                duration_str = f"{hours:.1f} hours"
        
        return {
            "intent": intent,
            "duration_minutes": duration_minutes,
            "duration_display": duration_str,
            "difficulty": difficulty,
            "focus_level": focus_level,
            "urgency": urgency,
            "best_time_of_day": best_time,
            "summary": {
                "title": title,
                "category": category,
                "analysis": f"This {intent} task is {difficulty} difficulty, requires {focus_level}, "
                           f"and is {urgency} urgency. Est. {duration_str}. Best done in {best_time}."
            }
        }


def analyze_task(title: str, description: str, category: str = "personal", due_date: str = "") -> Dict[str, Any]:
    """Convenience function for task analysis"""
    return TaskAnalyzer.analyze(title, description, category, due_date)
