from transformers import AutoTokenizer, TFAutoModelForSequenceClassification
import tensorflow as tf

# Load tokenizer and model
model_repo="bhuvnn/email_phishing"
tokenizer = AutoTokenizer.from_pretrained(model_repo)
model = TFAutoModelForSequenceClassification.from_pretrained(model_repo)

def predict_email(text):
    # Tokenize
    inputs = tokenizer(text, return_tensors="np", truncation=True, padding=True)
    
    # Predict
    outputs = model.predict(inputs)

    logits = outputs.logits
    probs = tf.nn.softmax(logits, axis=1)
    
    predicted_class = tf.argmax(probs, axis=1).numpy()[0]
    confidence = tf.reduce_max(probs, axis=1).numpy()[0]

    return predicted_class, confidence

def find_suspicious_words(text, keywords):
    found_words = []
    for word in keywords:
        if word.lower() in text.lower():
            found_words.append(word)
    return len(found_words)

