import datetime
from backend.gmail_api import get_gmail_emails
from backend.voice_processing import listen_for_wake_word
from backend.face_unlock import facial_unlock
from backend.gmail_integration import send_email_notification
from backend.task_scheduler import schedule_task
from backend.web_search import web_search
from models.cnn_model import CNNModel
from models.logistic_regression import LogisticRegressionModel
from models.rnn_model import RNNModel

def main():
    try:
        # Start the voice command processing in a separate thread or process if needed
        import threading
        voice_thread = threading.Thread(target=listen_for_wake_word)
        voice_thread.start()

        # Face verification
        verification_result = facial_unlock()
        if not verification_result['verified']:
            print("Face verification failed.")
            return

        # Get Gmail emails
        emails = get_gmail_emails()
        print(f"Fetched {len(emails)} email(s).")

        # Example: Initiating face unlock
        face_unlock_result = facial_unlock()
        print(face_unlock_result)

        # Example: Sending an email notification
        send_email_notification("recipient@example.com", "Test Subject", "Test Body")

        # Example: Scheduling a task
        schedule_task(datetime.datetime.now() + datetime.timedelta(hours=1), "Sample Task")

        # Example: Performing a web search
        web_search("OpenAI")

        # Example: Using machine learning models
        cnn_model = CNNModel()
        logistic_model = LogisticRegressionModel()
        rnn_model = RNNModel()

        # Example of making predictions
        cnn_predictions = cnn_model.predict("input_data")
        logistic_predictions = logistic_model.predict("input_data")
        rnn_predictions = rnn_model.predict("input_data")

        print("CNN Predictions:", cnn_predictions)
        print("Logistic Regression Predictions:", logistic_predictions)
        print("RNN Predictions:", rnn_predictions)

    except Exception as e:
        print(f"Error in main function: {e}")

if __name__ == "__main__":
    main()