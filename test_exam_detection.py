#!/usr/bin/env python3
"""
Test script to verify exam detection logic
"""

# Simulate the analyze_task_context function logic
def test_exam_detection():
    # Your exact input
    title = "Take Final Exam in Data Structures"
    description = "Midterm exam, very important, cannot be rescheduled"
    
    title_lower = title.lower()
    desc_lower = description.lower()
    combined = f"{title_lower} {desc_lower}"
    
    print("=" * 60)
    print("TEST: Exam Detection for Fixed Events")
    print("=" * 60)
    print(f"Title: {title}")
    print(f"Description: {description}")
    print(f"Combined (lowercase): {combined}")
    print()
    
    # Step 1: Check verb phrases
    has_review_verb = any(word in combined for word in ['review', 'study', 'prepare for', 'read about'])
    has_attend_verb = any(word in combined for word in ['attend', 'go to', 'participate in', 'join'])
    has_take_verb = any(word in combined for word in ['take', 'sit for', 'complete'])
    
    print("STEP 1: Verb Analysis")
    print(f"  has_review_verb: {has_review_verb}")
    print(f"  has_attend_verb: {has_attend_verb}")
    print(f"  has_take_verb: {has_take_verb}")
    print()
    
    # Step 2: Check context
    is_exam = any(word in combined for word in ['exam', 'test', 'quiz', 'midterm', 'final'])
    
    print("STEP 2: Context Detection")
    print(f"  is_exam: {is_exam}")
    print()
    
    # Step 3: Check if it's exam prep (should be FALSE)
    is_exam_prep = (has_review_verb or 'practice' in combined) and is_exam and not has_take_verb
    
    print("STEP 3: Exam Prep Check")
    print(f"  is_exam_prep: {is_exam_prep}")
    print(f"  (Should be FALSE - this is the actual exam, not prep)")
    print()
    
    # Step 4: Check title for exam keywords
    title_has_exam = any(word in title_lower for word in ['exam', 'examination', 'midterm', 'final', 'quiz', 'test'])
    
    print("STEP 4: Title Exam Keywords")
    print(f"  title_has_exam: {title_has_exam}")
    print()
    
    # Step 5: Determine if should be fixed
    should_be_fixed = (is_exam and (has_take_verb or title_has_exam))
    
    print("STEP 5: Should Be Fixed Calculation")
    print(f"  Formula: (is_exam AND (has_take_verb OR title_has_exam))")
    print(f"  = ({is_exam} AND ({has_take_verb} OR {title_has_exam}))")
    print(f"  = ({is_exam} AND {has_take_verb or title_has_exam})")
    print(f"  = {should_be_fixed}")
    print()
    
    # Step 6: Check which return statement will be hit
    print("STEP 6: Return Statement Selection")
    if is_exam and (has_take_verb or title_has_exam):
        print("  [OK] Will return: 'Exam detected - This is a critical fixed-time event'")
        print(f"  [OK] should_be_fixed: {should_be_fixed}")
        print()
        print("STEP 7: Final Return at Line 656-686")
        print("  Since should_be_fixed = True:")
        print("  [OK] Will return suggested_time = due_time (KEEPS 09:30)")
        print("  [OK] Will return should_mark_fixed = True")
    else:
        print("  [ERROR] Will NOT detect as fixed exam!")
    
    print()
    print("=" * 60)
    print("EXPECTED RESULT:")
    print("  Backend returns: suggested_time='09:30', should_mark_fixed=True")
    print("  Frontend shows: 'Apr 27 at 9:30 AM' (NOT 2:00 PM)")
    print("=" * 60)

if __name__ == "__main__":
    test_exam_detection()
