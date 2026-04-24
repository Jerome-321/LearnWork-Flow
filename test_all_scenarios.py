#!/usr/bin/env python3
"""
Test script for various fixed event scenarios
"""

def test_scenario(title, description, scenario_name):
    title_lower = title.lower()
    desc_lower = (description or '').lower()
    combined = f"{title_lower} {desc_lower}"
    
    print("=" * 70)
    print(f"SCENARIO: {scenario_name}")
    print("=" * 70)
    print(f"Title: {title}")
    print(f"Description: {description}")
    print()
    
    # Verb analysis
    has_review_verb = any(word in combined for word in ['review', 'study', 'prepare for', 'read about'])
    has_attend_verb = any(word in combined for word in ['attend', 'go to', 'participate in', 'join'])
    has_take_verb = any(word in combined for word in ['take', 'sit for', 'complete'])
    
    # Context detection
    is_exam = any(word in combined for word in ['exam', 'test', 'quiz', 'midterm', 'final'])
    is_meeting = any(word in combined for word in ['meeting', 'appointment', 'interview', 'consultation'])
    is_birthday = any(word in combined for word in ['birthday', 'bday', 'celebration', 'party'])
    is_presentation = any(word in combined for word in ['presentation', 'present', 'demo', 'pitch'])
    is_boss_birthday = any(word in combined for word in ['boss', 'manager', 'supervisor', 'director']) and any(word in combined for word in ['birthday', 'bday'])
    is_thesis_defense = any(word in combined for word in ['thesis', 'dissertation', 'defense', 'defence', 'capstone'])
    
    # Prep detection
    is_meeting_prep = has_review_verb and 'meeting' in combined and not has_attend_verb
    is_exam_prep = (has_review_verb or 'practice' in combined) and is_exam and not has_take_verb
    
    # Title keywords
    title_has_exam = any(word in title_lower for word in ['exam', 'examination', 'midterm', 'final', 'quiz', 'test'])
    
    # Should be fixed calculation
    should_be_fixed = (
        (is_exam and (has_take_verb or title_has_exam)) or 
        is_meeting or 
        is_birthday or 
        is_presentation or
        is_boss_birthday or
        is_thesis_defense
    )
    
    print("DETECTION RESULTS:")
    print(f"  Verbs: take={has_take_verb}, attend={has_attend_verb}, review={has_review_verb}")
    print(f"  Context: exam={is_exam}, meeting={is_meeting}, birthday={is_birthday}, presentation={is_presentation}")
    print(f"  Special: boss_birthday={is_boss_birthday}, thesis_defense={is_thesis_defense}")
    print(f"  Prep: exam_prep={is_exam_prep}, meeting_prep={is_meeting_prep}")
    print(f"  Title has exam keywords: {title_has_exam}")
    print()
    
    if should_be_fixed:
        print(f"RESULT: [FIXED EVENT] should_be_fixed = TRUE")
        print(f"  -> Backend will return: suggested_time = ORIGINAL TIME (e.g., 09:30)")
        print(f"  -> Backend will return: should_mark_fixed = True")
        print(f"  -> Frontend will show: ORIGINAL TIME (NOT 2:00 PM)")
    else:
        print(f"RESULT: [FLEXIBLE TASK] should_be_fixed = FALSE")
        print(f"  -> Backend will return: suggested_time = OPTIMIZED TIME (e.g., 14:00 for medium priority)")
        print(f"  -> Backend will return: should_mark_fixed = False")
        print(f"  -> Frontend will show: SUGGESTED TIME based on priority")
    
    print()

# Test scenarios
print("\n" + "=" * 70)
print("TESTING VARIOUS FIXED EVENT SCENARIOS")
print("=" * 70 + "\n")

# Scenario 1: Meeting (Fixed)
test_scenario(
    "Attend project meeting with team",
    "Discuss Q2 roadmap and deliverables",
    "Meeting - Fixed Event"
)

# Scenario 2: Meeting Prep (Flexible)
test_scenario(
    "Review meeting notes from yesterday",
    "Go through action items and follow-ups",
    "Meeting Prep - Flexible Task"
)

# Scenario 3: Boss's Birthday (Fixed - Professional Significance)
test_scenario(
    "Boss's birthday celebration",
    "Team lunch at 12:00 PM, attendance expected",
    "Boss's Birthday - Professionally Significant"
)

# Scenario 4: Friend's Birthday (Fixed)
test_scenario(
    "Sarah's birthday party",
    "Dinner at 7 PM, bring gift",
    "Friend's Birthday - Fixed Event"
)

# Scenario 5: Thesis Defense (Fixed - Academic Milestone)
test_scenario(
    "Thesis defense presentation",
    "Final presentation for graduation requirement",
    "Thesis Defense - Once-in-a-Semester Milestone"
)

# Scenario 6: Presentation (Fixed)
test_scenario(
    "Present capstone project to faculty",
    "20-minute presentation followed by Q&A",
    "Presentation - Fixed Event"
)

# Scenario 7: Job Interview (Fixed)
test_scenario(
    "Job interview at Google",
    "Technical interview with hiring manager",
    "Job Interview - Fixed Appointment"
)

# Scenario 8: Doctor Appointment (Fixed)
test_scenario(
    "Doctor appointment",
    "Annual checkup at 10:00 AM",
    "Doctor Appointment - Fixed Time"
)

# Scenario 9: Study Session (Flexible)
test_scenario(
    "Study for algorithms exam",
    "Review sorting algorithms and practice problems",
    "Study Session - Flexible Task"
)

# Scenario 10: Exam without 'take' verb (Fixed)
test_scenario(
    "EXAMINATION - Data Structures Final",
    "Comprehensive final exam, cannot be rescheduled",
    "Exam without 'take' verb - Should still be Fixed"
)

# Scenario 11: Quiz (Fixed)
test_scenario(
    "Take weekly quiz in Calculus",
    "15-minute quiz on derivatives",
    "Quiz - Fixed Event"
)

# Scenario 12: Homework (Flexible)
test_scenario(
    "Complete homework assignment",
    "Finish problems 1-20 from chapter 5",
    "Homework - Flexible Task"
)

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
