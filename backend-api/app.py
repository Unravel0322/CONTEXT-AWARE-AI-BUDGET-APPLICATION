from flask import Flask, request, jsonify
from dotenv import load_dotenv
from google import genai
import joblib
import os

load_dotenv()

app = Flask(__name__)

# Load ML model + vectorizer
model = joblib.load("expense_model.pkl")
vectorizer = joblib.load("expense_vectorizer.pkl")

# Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

CATEGORY_MAP = {
    "Groceries": "groceries",
    "Rent": "rent",
    "Utilities": "utilities",
    "Transportation": "transportation",
    "Entertainment": "entertainment",
    "Dining": "dining",
    "Health": "health",
    "Insurance": "insurance",
    "Savings": "savings",
    "Clothing": "clothing",
    "Personal": "personal",
    "Others": "others",
}

def predict_category(text, threshold=0.5):
    text_vec = vectorizer.transform([text])
    prediction = model.predict(text_vec)[0]
    probabilities = model.predict_proba(text_vec)[0]
    max_prob = float(max(probabilities))

    if max_prob < threshold:
        prediction = "Others"

    app_value = CATEGORY_MAP.get(prediction, "others")

    return {
        "category": app_value,
        "label": prediction,
        "confidence": max_prob,
    }

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({
            "category": "",
            "label": "",
            "confidence": 0.0,
        })

    return jsonify(predict_category(text))

@app.route("/generate-reminder-message", methods=["POST"])
def generate_reminder_message():
    data = request.get_json(silent=True) or {}

    event_title = str(data.get("eventTitle", "")).strip()
    days_before = data.get("daysBefore", None)
    event_type = str(data.get("eventType", "general")).strip()
    dining_high = bool(data.get("diningHigh", False))
    entertainment_high = bool(data.get("entertainmentHigh", False))
    transport_high = bool(data.get("transportHigh", False))

    if not os.getenv("GEMINI_API_KEY"):
        return jsonify({
            "success": False,
            "message": "GEMINI_API_KEY is missing."
        }), 500

    prompt = f"""
Generate one short mobile notification message for a student expense tracker app.

Context:
- Event title: {event_title}
- Days before event: {days_before}
- Event type: {event_type}
- Dining spending recently high: {dining_high}
- Entertainment spending recently high: {entertainment_high}
- Transport spending recently high: {transport_high}

Requirements:
- Keep it under 22 words.
- Friendly, concise, natural.
- Mention likely spending only if relevant.
- No emojis.
- Return only the notification body text.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        message = (response.text or "").strip()

        if not message:
            return jsonify({
                "success": False,
                "message": "Empty Gemini response."
            }), 500

        return jsonify({
            "success": True,
            "message": message
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Gemini generation failed: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)