import schedule
import time
import threading

def job():
    print("Running scheduled task...")

def schedule_task(interval, task):
    if interval == 'seconds':
        schedule.every(10).seconds.do(task)
    elif interval == 'minute':
        schedule.every().minute.do(task)
    elif interval == 'hour':
        schedule.every().hour.do(task)
    elif interval == 'day':
        schedule.every().day.at("10:00").do(task)
    else:
        raise ValueError("Unsupported interval type.")

def start_scheduler():
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)  # Sleep for 1 second before checking again

    # Run the scheduler in a separate thread
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.start()