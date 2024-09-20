from gtts import gTTS
import speech_recognition as sr
import os
from datetime import datetime

def speak(text):
    try:
        tts = gTTS(text=text, lang='en')
        audio_file = "output.mp3"
        tts.save(audio_file)
        if os.name == "posix":  # For macOS and Linux
            os.system(f"afplay {audio_file}")
        elif os.name == "nt":  # For Windows
            os.system(f"start {audio_file}")
        else:
            print("Unsupported OS")
    except Exception as e:
        print(f"Error in speak function: {e}")

def listen_for_wake_word():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for wake word...")
        while True:
            try:
                audio = recognizer.listen(source, timeout=5)
                command = recognizer.recognize_google(audio).lower()
                print(f"Command detected: {command}")

                # Check for wake words
                if "hey max" in command or "wake up max" in command:
                    speak("I'm awake. How can I assist you?")
                    listen_for_commands()  # Start listening for further commands
            except sr.UnknownValueError:
                pass  # Ignore unintelligible speech
            except sr.RequestError as e:
                print(f"API request error: {e}")
            except Exception as e:
                print(f"Error in wake word detection: {e}")

def listen_for_commands():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Assistant active. Listening for commands...")
        while True:
            try:
                audio = recognizer.listen(source, timeout=5)
                command = recognizer.recognize_google(audio).lower()
                print(f"Command recognized: {command}")

                # Handling different commands
                if "exit" in command or "go to sleep" in command:
                    speak("Going to sleep now.")
                    break  # Go back to listening for wake words
                elif "time" in command:
                    current_time = datetime.now().strftime('%H:%M')
                    speak(f"The current time is {current_time}")
                else:
                    speak(f"You said: {command}")
                    speak("Always here to serve you, sir.")  # Unique response
            except sr.UnknownValueError:
                speak("Sorry, I didn't catch that.")
            except sr.RequestError as e:
                speak(f"Request error: {e}")
            except Exception as e:
                print(f"Error in command processing: {e}")

if __name__ == "__main__":
    try:
        listen_for_wake_word()  # Start listening for the wake word
    except KeyboardInterrupt:
        print("Assistant terminated by user.")