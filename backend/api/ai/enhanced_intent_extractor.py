"""
Q3 Enhanced Intent Extraction System
Implements phrase-level intent detection with confidence scoring and clarification
"""

from typing import Dict, Tuple, Optional
import re
from datetime import datetime, timedelta


class EnhancedIntentExtractor:
    """
    Q3: Advanced intent extraction beyond keywords.
    - Phrase-level analysis (verb + noun combinations)
    - Confidence scoring
    - Single-question clarification for ambiguous inputs
    """
    
    # Verb phrases that indicate TASK (not event)
    TASK_VERBS = {
        'prepare': ['prepare', 'get ready', 'work on', 'make', 'create'],
        'study': ['study', 'review', 'learn', 'understand', 'master'],
        'complete': ['finish', 'complete', 'do', 'accomplish'],
        'write': ['write', 'compose', 'draft', 'document'],
        'fix': ['fix', 'repair', 'debug', 'solve'],
        'practice': ['practice', 'drill', 'rehearse', 'exercise'],
        'organize': ['organize', 'plan', 'arrange', 'schedule'],
        'research': ['research', 'investigate', 'explore', 'look into'],
    }
    
    # Verb phrases that indicate EVENT (not task)
    EVENT_VERBS = {
        'attend': ['attend', 'go to', 'show up'],
        'meet': ['meet', 'catch up', 'hang out'],
        'celebrate': ['celebrate', 'party', 'have'],
        'take': ['take', 'sit for', 'do'],  # "take exam", "take test"
        'have': ['have', 'schedule', 'book'],  # "have meeting", "have appointment"
        'present': ['present', 'demo', 'show', 'pitch'],
    }
    
    # Noun phrases that are ambiguous
    AMBIGUOUS_NOUNS = [
        'meeting', 'session', 'call', 'review', 'preparation', 'practice',
        'class', 'lecture', 'presentation', 'training', 'interview'
    ]
    
    # Pattern for explicit time/date mentions
    TIME_PATTERNS = [
        r'\b(tomorrow|today|tonight|next week|next monday|this friday)\b',
        r'\b(\d{1,2}[:/]\d{1,2})\b',  # 2:30 or 2/30
        r'\bat\s+(\d{1,2}(?:am|pm|:\d{1,2}))\b',
    ]
    
    # Pattern for duration mentions
    DURATION_PATTERNS = [
        r'(\d+)\s*(?:minute|min|hour|hr|second|sec)',
        r'(?:about|around|roughly)\s*(\d+)\s*(?:minute|hour)',
        r'(\d+)-?\s*(?:minute|hour)\s*(?:task|meeting|session)',
    ]
    
    def __init__(self, confidence_threshold: float = 0.7):
        """
        Initialize extractor with confidence threshold.
        
        Args:
            confidence_threshold: If confidence < this, ask clarification (Q3)
        """
        self.confidence_threshold = confidence_threshold
    
    def extract_with_confidence(self, title: str, description: str = "") -> Dict:
        """
        Q3: Extract intent with confidence score.
        If confidence too low, suggest clarification question.
        
        Returns:
            {
                'intent': 'task' or 'event',
                'type': specific type (meeting, birthday, exam_prep, etc.),
                'confidence': 0-1,
                'requires_clarification': boolean,
                'clarification_question': string if requires_clarification,
                'reasoning': explanation
            }
        """
        # Analyze the text
        combined_text = f"{title} {description}".lower()
        
        # Check for explicit time/date (strong indicator of EVENT)
        has_explicit_time = any(
            re.search(pattern, combined_text, re.IGNORECASE) 
            for pattern in self.TIME_PATTERNS
        )
        
        # Phrase-level analysis
        task_score, task_reason = self._analyze_task_phrases(combined_text)
        event_score, event_reason = self._analyze_event_phrases(combined_text)
        
        # Time mention boost for events
        if has_explicit_time:
            event_score += 0.3
            event_reason += " [has explicit time mention]"
        
        # Determine intent
        if task_score > event_score:
            intent = 'task'
            confidence = min(1.0, task_score)
            reasoning = task_reason
        elif event_score > task_score:
            intent = 'event'
            confidence = min(1.0, event_score)
            reasoning = event_reason
        else:
            # Ambiguous - need clarification (Q3)
            intent = 'ambiguous'
            confidence = 0.5
            reasoning = "Could be either a task or event"
        
        # Check if clarification needed
        requires_clarification = confidence < self.confidence_threshold
        clarification_question = None
        
        if requires_clarification:
            clarification_question = self._generate_clarification_question(
                title, description, combined_text
            )
        
        return {
            'intent': intent,
            'confidence': confidence,
            'requires_clarification': requires_clarification,
            'clarification_question': clarification_question,
            'reasoning': reasoning,
            'raw_scores': {'task': task_score, 'event': event_score},
            'has_explicit_time': has_explicit_time,
        }
    
    def extract_distinction_pair(self, text: str) -> Tuple[bool, str]:
        """
        Q3 Scenario A & C: Distinguish between similar phrases.
        
        Examples:
        - "birthday party" (event) vs "study for birthday gift ideas" (task)
        - "exam practice" (task) vs "take exam" (event)
        - "meeting notes review" (task) vs "attend meeting" (event)
        
        Returns:
            (is_event, reason)
        """
        text_lower = text.lower()
        
        # Pattern: [action verb] + [noun] = usually TASK
        # Pattern: [event verb] + [noun] = usually EVENT
        
        # Q3 Scenario A: Review meeting notes vs attend meeting
        if 'review' in text_lower or 'analyze' in text_lower:
            if 'notes' in text_lower or 'document' in text_lower or 'email' in text_lower:
                return False, "Review-based actions with artifacts are follow-up TASKS, not events"
        
        # Q3 Scenario C: Practice exam vs take exam
        if 'practice' in text_lower or 'mock' in text_lower or 'prep' in text_lower:
            if 'exam' in text_lower or 'test' in text_lower or 'quiz' in text_lower:
                return False, "Practice/mock/prep with exam is a TASK, not the actual event"
        
        if 'take' in text_lower and ('exam' in text_lower or 'test' in text_lower):
            return True, "Taking/sitting for an exam is a fixed EVENT"
        
        # Q3 Scenario A: Study ideas vs birthday party
        if 'study' in text_lower or 'learn' in text_lower or 'research' in text_lower:
            if 'idea' in text_lower or 'topic' in text_lower or 'subject' in text_lower:
                return False, "Study-based actions are TASKS, not events"
        
        if 'birthday' in text_lower or 'celebration' in text_lower or 'party' in text_lower:
            if 'attend' not in text_lower and 'go to' not in text_lower:
                # Ambiguous birthday reference
                return None, "Ambiguous - could be attending party or planning/studying about it"
            return True, "Attending a birthday event is a fixed EVENT"
        
        return None, "No clear distinction pattern matched"
    
    def apply_user_clarification(self, title: str, description: str, 
                                 user_answer: str) -> Dict:
        """
        Q3 Scenario B: User answered clarification question.
        Re-analyze with user's explicit intent.
        """
        user_answer_lower = user_answer.lower()
        
        # Determine intent from answer
        if 'meeting' in user_answer_lower:
            intent = 'meeting'
            intent_type = 'event' if 'attend' in user_answer_lower else 'task'
        elif 'social' in user_answer_lower or 'event' in user_answer_lower:
            intent = 'social_event'
            intent_type = 'event'
        elif 'task' in user_answer_lower or 'preparation' in user_answer_lower or 'prep' in user_answer_lower:
            intent = 'preparation_task'
            intent_type = 'task'
        else:
            intent = 'unclear'
            intent_type = 'unknown'
        
        return {
            'intent': intent,
            'type': intent_type,
            'confidence': 0.95,  # High confidence after user clarification
            'user_clarified': True,
            'user_answer': user_answer,
        }
    
    def extract_estimated_duration(self, text: str) -> Tuple[int, str, float]:
        """
        Q4: Extract duration from text with confidence.
        
        Returns:
            (estimated_minutes, reasoning, confidence)
        """
        text_lower = text.lower()
        
        # Explicit time mentions
        for pattern in self.DURATION_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    value = int(match.group(1))
                    # Scale: minutes -> minutes, hours -> minutes * 60
                    if 'hour' in match.group(0):
                        return value * 60, f"Explicit: {value} hour(s)", 0.95
                    else:
                        return value, f"Explicit: {value} minutes", 0.95
                except:
                    pass
        
        # Keyword-based estimation with reasoning
        if any(word in text_lower for word in ['quick', 'brief', 'short']):
            return 15, "Quick task (keywords: quick, brief, short)", 0.8
        
        if any(word in text_lower for word in ['email', 'message', 'text', 'slack']):
            return 10, "Communication task - typically 10 min", 0.75
        
        if any(word in text_lower for word in ['email', 'call', 'respond']):
            return 20, "Communication with follow-up - typically 20 min", 0.75
        
        if any(word in text_lower for word in ['write', 'essay', 'report', 'document']):
            return 120, "Writing task - typically 2 hours", 0.7
        
        if any(word in text_lower for word in ['code', 'program', 'debug', 'algorithm']):
            return 90, "Coding task - typically 1.5 hours", 0.7
        
        if any(word in text_lower for word in ['exam', 'test', 'study', 'prepare']):
            return 180, "Exam/study preparation - typically 3 hours", 0.7
        
        if any(word in text_lower for word in ['project', 'assignment', 'work', 'develop']):
            return 240, "Project/assignment - typically 4 hours", 0.65
        
        # Default
        return 60, "Default estimate - typical task", 0.5
    
    def _analyze_task_phrases(self, text: str) -> Tuple[float, str]:
        """Phrase-level scoring for TASK intent"""
        score = 0.0
        reasons = []
        
        # Check for task verbs
        for task_verb, keywords in self.TASK_VERBS.items():
            for keyword in keywords:
                if keyword in text:
                    score += 0.3
                    reasons.append(f"Task verb: '{keyword}'")
                    break
        
        # Check for action words that indicate preparation
        if any(word in text for word in ['prepare', 'work on', 'get ready', 'finish']):
            score += 0.2
            reasons.append("Preparation/action language")
        
        # Check for no time constraint (tasks can be flexible)
        if 'tomorrow' not in text and 'today' not in text and 'tonight' not in text:
            score += 0.1
            reasons.append("No fixed time - flexible timing suggests task")
        
        return score, " + ".join(reasons[:3]) if reasons else "Low task indicators"
    
    def _analyze_event_phrases(self, text: str) -> Tuple[float, str]:
        """Phrase-level scoring for EVENT intent"""
        score = 0.0
        reasons = []
        
        # Check for event verbs
        for event_verb, keywords in self.EVENT_VERBS.items():
            for keyword in keywords:
                if keyword in text:
                    score += 0.3
                    reasons.append(f"Event verb: '{keyword}'")
                    break
        
        # Check for event keywords (birthday, exam, meeting, etc.)
        event_keywords = [
            'birthday', 'party', 'meeting', 'appointment', 'exam', 'test',
            'class', 'lecture', 'conference', 'presentation', 'interview',
            'graduation', 'ceremony', 'wedding', 'flight', 'trip'
        ]
        
        for keyword in event_keywords:
            if keyword in text:
                score += 0.25
                reasons.append(f"Event keyword: '{keyword}'")
                break
        
        # Check for definite time reference
        if any(word in text for word in ['tomorrow', 'today', 'tonight', 'at ', 'on ']):
            score += 0.2
            reasons.append("Fixed time reference suggests scheduled event")
        
        return score, " + ".join(reasons[:3]) if reasons else "Low event indicators"
    
    def _generate_clarification_question(self, title: str, description: str, text: str) -> str:
        """
        Q3 Scenario B: Generate a SINGLE clarification question (not a form).
        """
        # Detect ambiguous scenario and ask contextual question
        if any(word in text for word in ['prepare', 'study', 'work on']):
            if any(word in text for word in ['sarah', 'john', 'person name']):
                return "Is this a meeting with Sarah, or preparation/studying for something related to Sarah?"
        
        if any(word in text for word in ['birthday', 'party']):
            if 'attend' not in text and 'go' not in text:
                return "Are you attending a birthday party, or is this a task like party planning?"
        
        if any(word in text for word in ['meeting']):
            if 'attend' not in text and 'review' not in text:
                return "Is this a meeting you need to attend, or a task to prepare meeting materials?"
        
        # Generic clarification
        return "Is this a scheduled event or a task to work on?"
