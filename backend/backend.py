from flask import Flask, request, jsonify
app = Flask(__name__)

#saving and loading messages from a local File

import os
import json

DATA_FILE = 'messages.json'

#Load existing messages

if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r') as f:
        messages = json.load(f)
else:
    messages = []

def save_messages():
    with open(DATA_FILE, 'w') as f:
        json.dump(messages, f)

risk_scores = {}

@app.route('/send', methods=['POST'])
def send_message():
    data = request.json
    sender = data.get('sender')
    receiver = data.get('receiver')
    text = data.get('message')

    message = {'sender': sender, 'receiver': receiver, 'text':text}
    messages.append(message)

    save_messages()

    return jsonify({'status': 'ok', 'message': message}), 200

#Getting messages between two users
@app.route('/messages/<user1>/<user2>', methods=['GET'])
def get_messages(user1, user2):
    chat = [
        m for m in messages
        if (m['sender'] == user1 and m['receiver'] == user2) or
        (m['sender'] == user2 and m['receiver'] == user1)
    ]

    return jsonify(chat)

#Setting and Getting risk scores 
@app.route('/score', methods=['POST'])
def update_score():
    data = request.json
    user1 = data.get('user1')
    user2 = data.get('user2')
    score = data.get('score')

    risk_scores[(user1, user2)] = score
    return jsonify({'status': 'score updated'}), 200

@app.route('/score/<user1>/<user2>', methods=['GET'])
def get_score(user1, user2):
    score = risk_scores.get((user1, user2), 0.0)
    return jsonify({'score': score})

if __name__ == '__main__':
    app.run(debug=True)

