#!/usr/bin/env python3
"""
Verify the current groq_ai.py file and show first functions
"""

with open('backend/api/ai/groq_ai.py', 'r') as f:
    content = f.read()

# Check if is_fixed_event already exists
if 'def is_fixed_event' in content:
    print("✓ is_fixed_event function already exists in the file")
else:
    print("✗ is_fixed_event function NOT FOUND in the file")

# Show function names
print("\nFunctions found in groq_ai.py:")
for line in content.split('\n'):
    if line.startswith('def '):
        func_name = line.split('(')[0].replace('def ', '')
        print(f"  - {func_name}")

print(f"\nTotal file size: {len(content)} bytes")
print(f"Total lines: {len(content.split(chr(10)))}")
