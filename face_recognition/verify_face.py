import cv2
import face_recognition
import numpy as np
import os

def load_face_encodings(user_id):
    encoding_file = f'face_recognition/face_encodings/{user_id}.npy'
    if os.path.exists(encoding_file):
        return np.load(encoding_file)
    else:
        print("Error: No face encodings found.")
        return None

def verify_face(user_id):
    known_face_encodings = load_face_encodings(user_id)
    if known_face_encodings is None:
        return

    video_capture = cv2.VideoCapture(0)
    print("Starting face verification. Please position your face in front of the camera.")

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("Error: Failed to grab frame from webcam.")
            break

        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = small_frame[:, :, ::-1]

        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            if True in matches:
                print("Face verified successfully!")
                video_capture.release()
                cv2.destroyAllWindows()
                return

        print("Face not recognized. Try adjusting your position or lighting.")

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    user_id = input("Enter user ID for verification: ")
    verify_face(user_id)