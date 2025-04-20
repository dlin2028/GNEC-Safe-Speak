from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import uuid
import json
import os
import openai

app = Flask(__name__, static_folder="../frontend/build")
CORS(app)

# Instantiate OpenAI client using latest SDK
openai_client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# In-memory storage
users = {}
conversations = {}
messages = {}

@app.route('/api/login', methods=['POST'])
def login():
    phone = request.json.get('phoneNumber')
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400
    users.setdefault(phone, str(uuid.uuid4()))
    return jsonify({'userId': users[phone], 'phoneNumber': phone})

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    uid = request.args.get('userId')
    if not uid:
        return jsonify({'error': 'User ID required'}), 400
    out = []
    for cid, conv in conversations.items():
        if uid in conv['participants']:
            other = next(
                (p for p,u in users.items() if u in conv['participants'] and u != uid),
                None
            )
            last = messages.get(cid, [])
            last_msg = last[-1]['content'] if last else None
            out.append({'id': cid, 'otherParticipant': other, 'lastMessage': last_msg})
    return jsonify(out)

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    data = request.json
    uid = data.get('userId')
    rec = data.get('recipient')
    if not uid or not rec:
        return jsonify({'error': 'User ID and recipient required'}), 400
    users.setdefault(rec, str(uuid.uuid4()))
    rid = users[rec]
    for cid, conv in conversations.items():
        if uid in conv['participants'] and rid in conv['participants']:
            return jsonify({'conversationId': cid})
    cid = str(uuid.uuid4())
    conversations[cid] = {'participants': [uid, rid]}
    messages[cid] = []
    return jsonify({'conversationId': cid})

@app.route('/api/messages/<conversation_id>', methods=['GET'])
def get_messages(conversation_id):
    return jsonify(messages.get(conversation_id, []))

@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.json
    cid = data.get('conversationId')
    sid = data.get('senderId')
    txt = data.get('content')
    if not (cid and sid and txt):
        return jsonify({'error': 'Conversation ID, sender ID, and content required'}), 400
    if cid not in conversations:
        return jsonify({'error': 'Conversation not found'}), 404
    msg = {
        'id': str(uuid.uuid4()),
        'senderId': sid,
        'content': txt,
        'timestamp': str(uuid.uuid4())
    }
    messages.setdefault(cid, []).append(msg)
    return jsonify(msg)

@app.route('/api/analyze-conversation', methods=['POST'])
def analyze_conversation():
    cid = request.json.get('conversationId')
    if not cid or cid not in messages:
        return jsonify({'error': 'Conversation not found'}), 404

    convo = []
    for m in messages[cid]:
        sender = next((p for p, u in users.items() if u == m['senderId']), "You")
        convo.append(f"{sender}: {m['content']}")
    convo_text = "\n".join(convo)

    user_prompt = f"""
Analyze the following conversation using Keirsey's 4 temperaments (Artisan, Guardian, Idealist, Rational)
and score each on a scale of 1–10. Also score these emotional aspects on 1–10: positiveness, agreeableness,
toxicity, empathy, emotional_depth.

CONVERSATION:
{convo_text}

Respond *only* with JSON in this exact schema:
{{
  "temperaments": {{
    "artisan": <int>,
    "guardian": <int>,
    "idealist": <int>,
    "rational": <int>
  }},
  "emotional_aspects": {{
    "positiveness": <int>,
    "agreeableness": <int>,
    "toxicity": <int>,
    "empathy": <int>,
    "emotional_depth": <int>
  }},
  "summary": "<brief summary>"
}}
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes conversations."},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            top_p=0.95,
            max_tokens=1024
        )
        text = response.choices[0].message.content
        analysis = json.loads(text)
        return jsonify(analysis)

    except json.JSONDecodeError as e:
        return jsonify({
            "error": "Failed to parse JSON",
            "exception": str(e),
            "raw": text if 'text' in locals() else None
        }), 500
    except Exception as e:
        return jsonify({"error": f"OpenAI API error: {str(e)}"}), 500

# Optional: serve React frontend (if deployed together)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(debug=True)
