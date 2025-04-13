import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle

# Load the CSV
df = pd.read_csv("/home/sneha/Downloads/trafficking_chats_70.csv")

# Preprocess
df["messages"] = df["conversation"].str.split("|")
X = df["messages"].apply(lambda msgs: " ".join(msgs))
y = df["label"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# TF-IDF with bigrams
vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# Train RandomForest
model = RandomForestClassifier(n_estimators=400, max_depth=15, random_state=42)
model.fit(X_train_tfidf, y_train)

# Test accuracy
y_pred = model.predict(X_test_tfidf)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.2f}")

# Debug: All predictions
print("\nAll Test Predictions:")
for i, (true, pred, text) in enumerate(zip(y_test, y_pred, X_test)):
    print(f"Chat {i}: True = {true}, Predicted = {pred}, Text = {text}")

# Save for app integration with full paths
with open("/home/sneha/PycharmProjects/AI/ml/tensorflow/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)
with open("/home/sneha/PycharmProjects/AI/ml/tensorflow/model.pkl", "wb") as f:
    pickle.dump(model, f)

# Prediction function for app
def predict_trafficking(chat_text):
    processed_text = " ".join(chat_text.split("|"))
    text_tfidf = vectorizer.transform([processed_text])
    prediction = model.predict(text_tfidf)[0]
    return prediction  # 0 or 1

# Example
sample_chat = "Hey u need cash? Job overseas, I’ll pay ur way | What’s the job? | Easy work, details later"
result = predict_trafficking(sample_chat)
print(f"\nSample chat prediction (1 = trafficking, 0 = not): {result}")

# Per-message
sample_msgs = ["Hey u need cash? Job overseas, I’ll pay ur way", "What’s the job?", "Easy work, details later"]
print("\nPer-message analysis for sample chat:")
for msg in sample_msgs:
    pred = predict_trafficking(msg)
    print(f"Message: {msg} | Prediction: {pred}")