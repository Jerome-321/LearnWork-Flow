import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def groq_schedule(task_data):

    prompt = f"""
You are an AI productivity assistant.

Analyze the following task and suggest the best time to complete it.

Task Title: {task_data.get('title')}
Description: {task_data.get('description')}
Category: {task_data.get('category')}
Priority: {task_data.get('priority')}
Due Date: {task_data.get('dueDate')}
Existing Tasks: {task_data.get('existingTasks')}

Respond ONLY in JSON:

{{
  "suggestedStart": "HH:MM",
  "suggestedEnd": "HH:MM",
  "reason": "short explanation"
}}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    text = response.choices[0].message.content.strip()

    try:
        return json.loads(text)
    except:
        return {
            "suggestedStart": None,
            "suggestedEnd": None,
            "reason": text
        }