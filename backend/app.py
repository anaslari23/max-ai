from flask import Flask, request, jsonify
from flask_cors import CORS
import pyttsx3
import cv2
import face_recognition
import tensorflow as tf
import numpy as np
from PIL import Image
import requests
import json
import datetime

app = Flask(__name__)
CORS(app)

# Initialize text-to-speech engine
engine = pyttsx3.init()

# Load your TensorFlow model
model = tf.keras.models.load_model('/Users/anasarif/Desktop/ai-assistant/model.h5')

def facial_unlock():
    try:
        reference_image = face_recognition.load_image_file('/Users/anasarif/Desktop/ai-assistant/backend/assets/images/reference_face.jpg')
        reference_encoding = face_recognition.face_encodings(reference_image)[0]
    except Exception as e:
        print(f"Error loading reference image: {e}")
        return False

    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        print("Error: Could not access the webcam.")
        return False

    print("Assistant awake! Initiating face verification...")
    verified = False

    for _ in range(50):
        ret, frame = video_capture.read()
        if not ret:
            break

        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]

        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces([reference_encoding], face_encoding)
            if matches[0]:
                verified = True
                break

        if verified:
            break

    video_capture.release()

    return verified

@app.route('/api/face-unlock', methods=['GET'])
def api_face_unlock():
    if facial_unlock():
        return jsonify({"verified": True})
    else:
        return jsonify({"verified": False})

@app.route('/api/voice-command', methods=['POST'])
def voice_command():
    data = request.get_json()
    command = data.get('command')

    # Process the command using TensorFlow model if needed
    response = process_command(command)

    # Convert response to speech
    engine.say(response)
    engine.runAndWait()

    return jsonify({'response': response})

def process_command(command):
    # Example of TensorFlow model usage
    if "classify" in command:
        # Prepare input data for TensorFlow model
        # For illustration, assume `command` is an image file or data to be classified
        image = Image.open('path_to_image.jpg')  # Update with your image path
        image = image.resize((224, 224))  # Adjust size as needed
        image_array = np.array(image) / 255.0  # Normalize image data
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension

        # Predict using TensorFlow model
        predictions = model.predict(image_array)
        predicted_class = np.argmax(predictions[0])
        return f"The image is classified as class {predicted_class}."
    
    if "hello" in command:
        return "Hello! How can I assist you today?"
    elif "weather" in command:
        return get_weather()
    elif "time" in command:
        return f"The current time is {datetime.datetime.now().strftime('%H:%M:%S')}."
    elif "calculator" in command:
        return "Opening calculator..."
    elif "news" in command:
        return get_news()
    else:
        return "Sorry, I didn't understand that command."

def get_weather():
    # Example of integrating with an external API for weather
    try:
        api_key = 'your_openweathermap_api_key'  # Replace with your API key
        city = 'your_city'  # Replace with your city
        response = requests.get(f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}')
        weather_data = response.json()
        temperature = weather_data['main']['temp'] - 273.15  # Convert Kelvin to Celsius
        description = weather_data['weather'][0]['description']
        return f"The weather in {city} is {description} with a temperature of {temperature:.2f}°C."
    except Exception as e:
        print(f"Error fetching weather data: {e}")
        return "Sorry, I couldn't fetch the weather data."

def get_news():
    # Example of integrating with an external API for news
    try:
        api_key = 'your_newsapi_api_key'  # Replace with your API key
        response = requests.get(f'https://newsapi.org/v2/top-headlines?country=us&apiKey={api_key}')
        news_data = response.json()
        articles = news_data['articles'][:5]  # Get top 5 articles
        headlines = [article['title'] for article in articles]
        return "Here are the top news headlines: " + ', '.join(headlines)
    except Exception as e:
        print(f"Error fetching news data: {e}")
        return "Sorry, I couldn't fetch the news."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)