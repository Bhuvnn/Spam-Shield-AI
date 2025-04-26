from flask import Flask, request, jsonify, render_template
from utils.predict import predict_email,find_suspicious_words
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    if not data or 'email' not in data:
        return jsonify({'error': 'No email text provided or invalid data format'}), 400

    email_text = data['email'].strip()  # Clean the input text

    if not email_text:
        return jsonify({'error': 'Empty email text provided'}), 400

    try:
        predicted_class, confidence = predict_email(email_text)
    except Exception as e:
        return jsonify({'error': f'Error during prediction: {str(e)}'}), 500

    label = "Phishing" if predicted_class == 1 else "Safe"
    suspicious_count = 0
    
    if label == "Phishing":
        keywords = [
            "password", "bank", "account", "login", "verify", "click here", "urgent", 
            "security alert", "confirm", "suspended", "payment", "update account", 
            "credentials", "refund", "social security", "urgent action", "locked", 
            "restricted", "unusual activity", "verify identity", "suspicious login", 
            "unauthorized access", "immediate attention", "account verification", 
            "phishing", "malware", "scam", "fraudulent"
        ]
        suspicious_count = find_suspicious_words(email_text, keywords)

    return jsonify({
        'prediction': label,
        'confidence': round(float(confidence) * 100, 2),
        'suspicious_count': suspicious_count,
    })
if __name__ == '__main__':
    app.run(debug=True)
