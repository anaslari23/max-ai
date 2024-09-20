import cv2
import face_recognition
import pyttsx3
import threading

def facial_unlock():
    try:
        # Load the reference image and encode the face
        reference_image = face_recognition.load_image_file('/Users/anasarif/Desktop/ai-assistant/backend/assets/images/reference_face.jpg')
        reference_encoding = face_recognition.face_encodings(reference_image)[0]
    except Exception as e:
        print(f"Error loading reference image: {e}")
        return False

    # Access the laptop's webcam
    video_capture = cv2.VideoCapture(0)
    if not video_capture.isOpened():
        print("Error: Could not access the webcam.")
        return False

    print("Assistant awake! Initiating real-time face verification...")
    
    face_verified = False

    while True:
        # Capture a single frame from the video feed
        ret, frame = video_capture.read()
        if not ret:
            print("Failed to grab frame")
            break

        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]

        # Find all faces in the current frame of video
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        # Process each face found in the frame
        for face_encoding in face_encodings:
            # Check if the face matches the reference encoding
            matches = face_recognition.compare_faces([reference_encoding], face_encoding)
            if matches[0]:
                # Face matched
                face_verified = True
                cv2.putText(frame, "Face Verified! Access Granted", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                # Provide voice feedback
                threading.Thread(target=voice_feedback, args=("Face verified! Access granted.",)).start()
                break
            else:
                # No match found
                face_verified = False
                cv2.putText(frame, "Scanning...", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        # Display the frame with the verification status
        cv2.imshow('Real-Time Face Unlock', frame)

        # Check if OpenCV windows are closed
        if cv2.getWindowProperty('Real-Time Face Unlock', cv2.WND_PROP_VISIBLE) < 1:
            print("Window closed by user")
            break

        # Break the loop if the face is verified
        if face_verified:
            print("Face verification successful. Access granted.")
            break

        # Press 'q' to exit the scanning manually
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the video capture if the loop exits
    video_capture.release()
    cv2.destroyAllWindows()

    return face_verified

def voice_feedback(message):
    # Initialize the text-to-speech engine
    engine = pyttsx3.init()
    # Speak the given message
    engine.say(message)
    engine.runAndWait()

def main():
    if facial_unlock():
        print("Starting AI Assistant...")
        # Place code for AI assistant functionalities here
    else:
        print("Face verification failed. Access denied.")

if __name__ == '__main__':
    main()