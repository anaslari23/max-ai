import speech_recognition as sr
from camera_app import verify_user
from voice_processing import speak, listen_for_wake_word

def main():
    while True:
        if listen_for_wake_word():
            speak("I'm awake. How can I assist you?")
            if verify_user():  # Check if face verification is successful
                speak("Face verified. Starting to listen for commands...")
                listen_for_commands()  # Listen for user commands
            else:
                speak("Face verification failed. Access denied.")

def listen_for_commands():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Assistant active. Listening for commands...")
        while True:
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)
                command = recognizer.recognize_google(audio).lower()
                print(f"Command recognized: {command}")

                # Handling different commands
                if "exit" in command or "go to sleep" in command:
                    speak("Going to sleep now.")
                    break  # Return to wake word listening
                elif "time" in command:
                    current_time = datetime.now().strftime('%H:%M')
                    speak(f"The current time is {current_time}")
                else:
                    speak(f"You said: {command}")
            except sr.UnknownValueError:
                speak("Sorry, I didn't catch that.")
            except sr.RequestError as e:
                speak(f"Request error: {e}")
            except Exception as e:
                print(f"Error in command processing: {e}")

if __name__ == "__main__":
    try:
        main()  # Start the assistant
    except KeyboardInterrupt:
        print("Assistant terminated by user.")