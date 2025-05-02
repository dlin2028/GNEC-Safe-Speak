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
conversation_scores = {}
conversation_summaries = {}
conversation_lb_summaries = {}  # leaderboard-only summaries

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
                (p for p, u in users.items() if u in conv['participants'] and u != uid),
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
    data = request.json or {}
    cid = data.get('conversationId')
    you_id = data.get('userId')

    if not cid or cid not in messages:
        return jsonify({'error': 'conversationId required'}), 400

    participants = conversations.get(cid, {}).get('participants', [])
    if not participants:
        return jsonify({'error': 'Conversation not found'}), 404
    if you_id not in participants:
        you_id = participants[0]
    other_id = next(pid for pid in participants if pid != you_id)

    you_lines = [f"You: {m['content']}" for m in messages[cid] if m['senderId'] == you_id]
    other_lines = [f"Other: {m['content']}" for m in messages[cid] if m['senderId'] == other_id]

    prompt = f"""
You will receive two labeled streams: "You:" (the user) and "Other:" (the partner). Perform:

1. **Keirsey Temperaments**: Score Artisan, Guardian, Idealist, Rational (1–10) for each stream. In **summary**, briefly explain how you derived each temperament score. The summary will be given to the user, so address them directly.
2. **Emotional Aspects**: Score (1–10) positiveness, agreeableness, toxicity, empathy, emotional_depth across the whole conversation.
3. **Trafficker Detection**: Analyze ONLY the "Other" stream. Ignore "You" messages. Set "is_trafficker": true only if you are highly confident the Other is recruiting. Otherwise false.
4. **Leaderboard Summary**: Provide a one-sentence overview highlighting why this conversation ranks high in toxicity.

Respond **only** with JSON matching this schema exactly:

{{
  "temperaments": {{
    "you": {{ "artisan": <int>, "guardian": <int>, "idealist": <int>, "rational": <int> }},
    "other": {{ "artisan": <int>, "guardian": <int>, "idealist": <int>, "rational": <int> }}
  }},
  "emotional_aspects": {{
    "positiveness": <int>,
    "agreeableness": <int>,
    "toxicity": <int>,
    "empathy": <int>,
    "emotional_depth": <int>
  }},
  "summary": "<detailed summary and scoring rationale>",
  "is_trafficker": <true|false>,
  "leaderboard_summary": "<one-sentence leaderboard summary>"
}}

You conversation:
{"\n".join(you_lines)}

Other conversation:
{"\n".join(other_lines)}
"""

    try:
        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            top_p=0.95,
            max_tokens=1200
        )
        text = resp.choices[0].message.content
        analysis = json.loads(text)

        # Store toxicity, full summary, and leaderboard-only summary
        conversation_scores[cid] = analysis["emotional_aspects"]["toxicity"]
        conversation_summaries[cid] = analysis.get("summary", "")
        conversation_lb_summaries[cid] = analysis.get("leaderboard_summary", "")

        return jsonify(analysis)

    except json.JSONDecodeError as e:
        return jsonify({"error": "Failed to parse JSON", "exception": str(e), "raw": text}), 500
    except Exception as e:
        return jsonify({"error": f"OpenAI API error: {str(e)}"}), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    top = sorted(conversation_scores.items(), key=lambda kv: kv[1], reverse=True)[:10]
    name_by_id = {uid: name for name, uid in users.items()}
    result = []
    for cid, tox in top:
        conv = conversations.get(cid, {})
        parts = conv.get("participants", [])
        names = [name_by_id.get(p, p) for p in parts]
        lb_summary = conversation_lb_summaries.get(cid, "")
        result.append({
            "conversationId": cid,
            "participants": names,
            "toxicity": tox,
            "leaderboardSummary": lb_summary
        })
    return jsonify(result)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    full = os.path.join(app.static_folder, path)
    if path and os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(debug=True)
