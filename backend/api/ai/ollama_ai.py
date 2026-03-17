import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def analyze_task_with_ai(task):

    prompt = f"""
    Analyze this task and return JSON:
    task: {task}

    return:
    difficulty
    estimated_hours
    priority
    """

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "phi3",
            "prompt": prompt,
            "stream": False
        }
    )

    return response.json()["response"]