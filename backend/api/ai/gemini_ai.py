import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.0-flash")


def gemini_schedule(task_data):

    prompt = f"""
You are an AI productivity assistant.

Analyze the following task and suggest the best time to complete it.

Task Title: {task_data.get('title')}
Description: {task_data.get('description')}
Category: {task_data.get('category')}
Priority: {task_data.get('priority')}
Due Date: {task_data.get('dueDate')}
Existing Tasks: {task_data.get('existingTasks')}

Respond ONLY in JSON format:

{{
  "suggestedStart": "HH:MM",
  "suggestedEnd": "HH:MM",
  "reason": "short explanation"
}}
"""

    try:
        response = model.generate_content(prompt)

    # Handle free-tier rate limits
    except Exception as e:
        print("Gemini API error:", e)
        time.sleep(20)
        response = model.generate_content(prompt)

    text = response.text.strip()

    # Remove markdown code blocks if Gemini adds them
    text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)

    except Exception:
        return {
            "suggestedStart": None,
            "suggestedEnd": None,
            "reason": text
        }