from gtts import gTTS
import os

def speak(text):
    tts = gTTS(text=text, lang='en')
    audio_file = "test_output.mp3"
    tts.save(audio_file)
    if os.name == "posix":  # For macOS and Linux
        os.system(f"afplay {audio_file}")
    elif os.name == "nt":  # For Windows
        os.system(f"start {audio_file}")
    else:
        print("Unsupported OS")

speak("Hello! This is a test.")