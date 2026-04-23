"""
Q10 Conflict History Replay System
Stores past conflict resolutions and suggests "apply same resolution?" for similar conflicts
Implements memory-based adaptive decision-making (Q10 Planned feature)
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json


class ConflictHistoryReplay:
    """
    Q10 Planned Feature: Conflict history replay and memory-based adaptation.
    
    When a new conflict resembles a past one (e.g., birthday vs work shift on 3rd occurrence),
    AI surfaces: "You resolved this same conflict on Oct 3rd — apply the same resolution?"
    
    True memory-based adaptive decision-making.
    """
    
    SIMILARITY_THRESHOLD = 0.65  # How similar must items be to match
    MIN_HISTORY_FOR_SUGGESTION = 2  # Need 2+ past resolutions to suggest
    
    def __init__(self):
        self.similarity_cache = {}
    
    def record_conflict_resolution(self, user, conflict_type: str, 
                                   item1_title: str, item1_category: str,
                                   item2_title: str, item2_category: str,
                                   resolution_type: str, resolution_details: Dict,
                                   resolution_description: str, groq_reasoning: str,
                                   user_selected_option: int, user_satisfaction: int = None) -> Dict:
        """
        Record how user resolved a conflict for future replay.
        
        Args:
            user: Django user object
            conflict_type: 'task_vs_work', 'task_vs_task', 'task_vs_fixed'
            item1_title: Title of first item
            item1_category: Category of first item
            item2_title: Title of second item
            item2_category: Category of second item
            resolution_type: 'reschedule', 'split', 'negotiate', 'defer'
            resolution_details: JSON dict with specifics
            resolution_description: Human-readable explanation
            groq_reasoning: What AI said about this conflict
            user_selected_option: Which option (1, 2, 3) user picked
            user_satisfaction: 1-5 star rating of resolution
        """
        from api.models import ConflictHistory
        
        try:
            # Extract keywords for similarity matching
            item1_keywords = self._extract_keywords(item1_title)
            item2_keywords = self._extract_keywords(item2_title)
            
            conflict = ConflictHistory.objects.create(
                user=user,
                conflict_date=datetime.now().date(),
                conflict_type=conflict_type,
                item1_title=item1_title,
                item2_title=item2_title,
                item1_category=item1_category,
                item2_category=item2_category,
                resolution_type=resolution_type,
                resolution_details=resolution_details,
                resolution_description=resolution_description,
                groq_reasoning=groq_reasoning,
                user_selected_option=user_selected_option,
                user_satisfaction_with_resolution=user_satisfaction,
                item1_keywords=item1_keywords,
                item2_keywords=item2_keywords,
            )
            
            return {
                "status": "success",
                "conflict_id": conflict.id,
                "message": "Conflict resolution recorded for future reference"
            }
        
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def find_similar_past_conflicts(self, user, item1_title: str, item1_category: str,
                                    item2_title: str, item2_category: str,
                                    conflict_type: str) -> List[Dict]:
        """
        Find similar past conflicts that user already resolved.
        Returns ranked list of similar conflicts user can reapply.
        
        Returns:
            List of past conflicts with similarity scores, ranked by similarity
        """
        from api.models import ConflictHistory
        
        try:
            past_conflicts = ConflictHistory.objects.filter(
                user=user,
                conflict_type=conflict_type
            ).order_by('-conflict_date')[:20]  # Look at recent resolutions
            
            similar_conflicts = []
            
            for past in past_conflicts:
                similarity = self._calculate_similarity(
                    item1_title, item1_category, item2_title, item2_category,
                    past.item1_title, past.item1_category, past.item2_title, past.item2_category
                )
                
                if similarity >= self.SIMILARITY_THRESHOLD:
                    similar_conflicts.append({
                        'past_conflict_id': past.id,
                        'past_item1': past.item1_title,
                        'past_item2': past.item2_title,
                        'similarity_score': similarity,
                        'resolution_type': past.resolution_type,
                        'resolution_description': past.resolution_description,
                        'resolved_date': past.conflict_date.isoformat(),
                        'user_satisfaction': past.user_satisfaction_with_resolution,
                        'suggestion_text': self._generate_replay_suggestion(
                            past.item1_title, past.item2_title,
                            item1_title, item2_title,
                            past.resolution_description, similarity
                        )
                    })
            
            # Sort by similarity
            similar_conflicts.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            return similar_conflicts
        
        except Exception as e:
            return []
    
    def apply_past_resolution(self, user, new_conflict_id: int, 
                             past_conflict_id: int) -> Dict:
        """
        User chose to apply a past resolution to new conflict.
        Copy resolution approach to new conflict.
        """
        from api.models import ConflictHistory, RecurringConflict
        
        try:
            # Get the past resolution
            past_conflict = ConflictHistory.objects.get(id=past_conflict_id, user=user)
            
            # Return the resolution details for new conflict
            return {
                "status": "success",
                "resolution_type": past_conflict.resolution_type,
                "resolution_details": past_conflict.resolution_details,
                "resolution_description": past_conflict.resolution_description,
                "copied_from_past": True,
                "past_conflict_date": past_conflict.conflict_date.isoformat(),
                "message": f"Applied resolution from {past_conflict.conflict_date}: {past_conflict.resolution_description}"
            }
        
        except ConflictHistory.DoesNotExist:
            return {"status": "error", "message": "Past conflict not found"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_conflict_resolution_stats(self, user) -> Dict:
        """
        Show user their conflict resolution history stats (Q10).
        Insights into which strategies work best for them.
        """
        from api.models import ConflictHistory
        from django.db.models import Count, Avg
        
        try:
            all_conflicts = ConflictHistory.objects.filter(user=user)
            
            if not all_conflicts.exists():
                return {"total_conflicts_resolved": 0}
            
            # Group by resolution type
            by_type = all_conflicts.values('resolution_type').annotate(
                count=Count('id'),
                avg_satisfaction=Avg('user_satisfaction_with_resolution')
            )
            
            # Group by conflict type
            by_conflict = all_conflicts.values('conflict_type').annotate(
                count=Count('id')
            )
            
            # Most common pairings
            pairings = all_conflicts.values('item1_category', 'item2_category').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            stats = {
                "total_conflicts_resolved": all_conflicts.count(),
                "by_resolution_type": [
                    {
                        "type": r['resolution_type'],
                        "count": r['count'],
                        "avg_satisfaction": r['avg_satisfaction'] or 0
                    }
                    for r in by_type
                ],
                "by_conflict_type": [
                    {
                        "type": c['conflict_type'],
                        "count": c['count']
                    }
                    for c in by_conflict
                ],
                "most_common_pairings": [
                    {
                        "item1_type": p['item1_category'],
                        "item2_type": p['item2_category'],
                        "count": p['count']
                    }
                    for p in pairings
                ],
                "preferred_resolution_strategy": self._get_preferred_strategy(by_type),
            }
            
            return stats
        
        except Exception as e:
            return {}
    
    def _calculate_similarity(self, item1_t: str, item1_c: str, item2_t: str, item2_c: str,
                             past1_t: str, past1_c: str, past2_t: str, past2_c: str) -> float:
        """
        Calculate similarity between two conflicts (0-1).
        Considers both items and categories.
        """
        # Category matching (stronger weight)
        category_match1 = 1.0 if (item1_c == past1_c and item2_c == past2_c) else 0.0
        category_match2 = 1.0 if (item1_c == past2_c and item2_c == past1_c) else 0.0
        category_score = max(category_match1, category_match2) * 0.6
        
        # Text similarity (semantic - simple substring matching for now)
        title_sim1 = self._string_similarity(item1_t, past1_t) + self._string_similarity(item2_t, past2_t)
        title_sim2 = self._string_similarity(item1_t, past2_t) + self._string_similarity(item2_t, past1_t)
        title_score = max(title_sim1, title_sim2) / 2.0 * 0.4
        
        return category_score + title_score
    
    def _string_similarity(self, s1: str, s2: str) -> float:
        """Simple string similarity using keyword overlap (0-1)"""
        words1 = set(s1.lower().split())
        words2 = set(s2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        overlap = len(words1 & words2)
        union = len(words1 | words2)
        
        return overlap / union if union > 0 else 0.0
    
    def _extract_keywords(self, text: str) -> str:
        """Extract main keywords from text for similarity matching"""
        # Remove common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        words = [w.lower() for w in text.split() if w.lower() not in stop_words and len(w) > 2]
        return ','.join(words[:5])  # Top 5 keywords
    
    def _generate_replay_suggestion(self, past_item1: str, past_item2: str,
                                   new_item1: str, new_item2: str,
                                   resolution: str, similarity: float) -> str:
        """Generate UI-friendly suggestion text"""
        confidence_text = {
            0.9: "very similar to",
            0.8: "very similar to",
            0.7: "similar to",
            0.65: "somewhat similar to"
        }
        
        confidence_level = max(k for k in confidence_text.keys() if k <= similarity)
        confidence = confidence_text[confidence_level]
        
        return (f"This conflict between '{new_item1}' and '{new_item2}' is {confidence} "
               f"a past conflict between '{past_item1}' and '{past_item2}'. "
               f"You resolved it by: {resolution}. Apply same resolution?")
    
    def _get_preferred_strategy(self, by_type_data) -> Dict:
        """Determine which resolution strategy works best for this user"""
        if not by_type_data:
            return {}
        
        # Sort by satisfaction rating
        sorted_types = sorted(
            by_type_data,
            key=lambda x: x['avg_satisfaction'] or 0,
            reverse=True
        )
        
        if sorted_types:
            best = sorted_types[0]
            return {
                "strategy": best['resolution_type'],
                "satisfaction_score": best['avg_satisfaction'] or 0,
                "times_used": best['count']
            }
        
        return {}
