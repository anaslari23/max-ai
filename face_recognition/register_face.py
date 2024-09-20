import cv2
import face_recognition
import os
import numpy as np
import time


def capture_and_register_face():
    video_capture = cv2.VideoCapture(0)

    # Set a higher resolution for the camera (720p)
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Check if the camera opened successfully
    if not video_capture.isOpened():
        print("Error: Unable to access the webcam.")
        return

    # Instructions for capturing different angles
    instructions = [
        "Face forward and hold still...",
        "Turn your head slightly to the left...",
        "Turn your head slightly to the right...",
        "Look up slightly...",
        "Look down slightly..."
    ]

    face_encodings_list = []

    print("Preparing to capture your face. Please ensure good lighting and position your face in front of the camera.")

    for instruction in instructions:
        print(instruction)

        # Show instruction and start countdown
        for i in range(3, 0, -1):
            ret, frame = video_capture.read()
            if not ret:
                print("Error: Failed to grab frame from webcam.")
                continue

            # Display countdown timer
            cv2.putText(frame, f"{instruction} Capturing in {i}...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255),
                        2, cv2.LINE_AA)
            cv2.imshow('Capture Face', frame)
            cv2.waitKey(1000)  # Wait for 1 second

        # Start capturing face encodings
        capture_attempts = 0
        max_attempts = 20  # Maximum attempts to detect a stable face
        encoding_captured = False

        while not encoding_captured and capture_attempts < max_attempts:
            ret, frame = video_capture.read()
            if not ret:
                print("Error: Failed to grab frame from webcam.")
                continue

            # Reduce the frequency of face detection to reduce lag
            if capture_attempts % 5 == 0:  # Process every 5th frame
                # Resize the frame to make processing faster
                small_frame = cv2.resize(frame, (0, 0), fx=0.75,
                                         fy=0.75)  # Reduce resizing factor to preserve more quality
                rgb_small_frame = small_frame[:, :, ::-1]

                # Detect face locations and encodings
                face_locations = face_recognition.face_locations(rgb_small_frame)
                face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

                # Draw a viewfinder box on the detected face
                for (top, right, bottom, left) in face_locations:
                    top *= int(1 / 0.75)  # Adjust multiplier to the new resize factor
                    right *= int(1 / 0.75)
                    bottom *= int(1 / 0.75)
                    left *= int(1 / 0.75)
                    # Draw a rectangle around the face
                    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                    # Provide feedback to the user
                    cv2.putText(frame, "Detecting...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2,
                                cv2.LINE_AA)

                # Check if a face was detected and encodings captured
                if face_encodings:
                    face_encodings_list.append(face_encodings[0])
                    encoding_captured = True
                    print(f"Captured face for: {instruction}")
                    time.sleep(2)  # Wait for 2 seconds before the next instruction

            # Display the frame with the viewfinder effect
            cv2.imshow('Capture Face', frame)
            capture_attempts += 1

            # Break the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("Face capture canceled.")
                video_capture.release()
                cv2.destroyAllWindows()
                return

    video_capture.release()
    cv2.destroyAllWindows()

    # Once the face encoding is captured, ask for the user's name or ID
    user_id = input("Enter your name or ID for registration: ")
    if user_id.strip() == "":
        print("Error: Name or ID cannot be empty.")
        return

    # Save all the face encodings
    encoding_file = f'face_recognition/face_encodings/{user_id}.npy'
    os.makedirs(os.path.dirname(encoding_file), exist_ok=True)
    np.save(encoding_file, face_encodings_list)
    print(f"User face registered as {user_id} with multiple encodings")


if __name__ == "__main__":
    capture_and_register_face()