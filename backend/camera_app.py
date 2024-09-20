import cv2
import face_recognition
import numpy as np
import os


def verify_user():
    """Verifies if the current user's face matches any registered encodings."""

    # Load known face encodings
    known_encodings_dir = 'face_recognition/face_encodings'
    known_encodings = []
    known_users = []

    # Load all registered encodings
    for filename in os.listdir(known_encodings_dir):
        if filename.endswith(".npy"):
            known_encodings.append(np.load(os.path.join(known_encodings_dir, filename)))
            known_users.append(filename.split(".")[0])  # Extract user ID

    if not known_encodings:
        print("No known face encodings found. Please register a face first.")
        return False

    video_capture = cv2.VideoCapture(0)
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("Looking for your face...")

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("Failed to grab frame. Retrying...")
            continue

        rgb_frame = frame[:, :, ::-1]  # Convert from BGR to RGB
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for (top, right, bottom, left) in face_locations:
            # Draw a rectangle around the face
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, "Verifying...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2, cv2.LINE_AA)

        # Display the camera feed
        cv2.imshow('Verify Face', frame)

        if face_encodings:
            for encoding in face_encodings:
                # Compare against all registered users
                matches = face_recognition.compare_faces(known_encodings, encoding)

                if any(matches):
                    match_index = matches.index(True)
                    user_id = known_users[match_index]
                    print(f"Face verified! Welcome, {user_id}")
                    video_capture.release()
                    cv2.destroyAllWindows()
                    return True
                else:
                    print("Face not recognized. Try again.")

        # Press 'q' to cancel verification
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Verification canceled.")
            break

    video_capture.release()
    cv2.destroyAllWindows()
    return False