from flask import Flask, request, jsonify
from flask_cors import CORS
import serial
import time
import threading
import queue
import datetime
import uuid  # Add this import for unique IDs

app = Flask(__name__)
cors = CORS(app)

# Update this with your Arduino's serial port.
SERIAL_PORT = 'COM3'  # For Windows, e.g., 'COM3'
BAUD_RATE = 9600

angle_closed = 157
angle_open = 110

# Task management with unique IDs
timer_queue = queue.PriorityQueue()
tasks_by_id = {}  # Dictionary to store tasks by ID
task_lock = threading.RLock()  # Use RLock for more complex locking scenarios

# Variable to keep track of the current task being processed
current_task = None
current_task_lock = threading.Lock()
cancel_current_task = False

# Attempt to open the serial connection.
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Give the Arduino time to reset
    print(f"Connected to Arduino on {SERIAL_PORT} at {BAUD_RATE} baud.")
except Exception as e:
    print(f"Error opening serial port: {e}")
    ser = None

# Background worker to process timer queue
def timer_worker():
    global current_task, cancel_current_task
    while True:
        try:
            # Get the next scheduled task (blocking until one is available)
            priority, task_id = timer_queue.get()
            
            with task_lock:
                if task_id not in tasks_by_id:
                    # Task was removed while in queue
                    timer_queue.task_done()
                    continue
                
                task = tasks_by_id[task_id]
                scheduled_time = task['time']
                angle = task['angle']
            
            # Update the current task
            with current_task_lock:
                current_task = task_id
                cancel_current_task = False
            
            # Calculate time to wait
            now = datetime.datetime.now().astimezone()
            if scheduled_time > now:
                # Wait until the scheduled time
                wait_seconds = (scheduled_time - now).total_seconds()
                print(f"Timer waiting for {wait_seconds} seconds until {scheduled_time}")
                if wait_seconds > 0:
                    time.sleep(wait_seconds)
            
            # Check if the current task should be canceled
            with current_task_lock:
                if cancel_current_task:
                    print(f"Task canceled: {scheduled_time}, {angle}")
                    current_task = None
                    timer_queue.task_done()
                    continue
            
            # Send angle command to Arduino
            if ser:
                ser.write(f"{angle}\n".encode())
                print(f"Timer executed: Sent angle {angle} to Arduino at {datetime.datetime.now()}")
            else:
                print(f"Timer executed but serial connection not available. Angle: {angle}")
            
            # Remove completed task
            with task_lock:
                if task_id in tasks_by_id:
                    del tasks_by_id[task_id]
                
            # Mark task as done
            timer_queue.task_done()
            
            # Clear the current task
            with current_task_lock:
                current_task = None
        except Exception as e:
            print(f"Error in timer worker: {e}")

# Start the timer worker thread
timer_thread = threading.Thread(target=timer_worker, daemon=True)
timer_thread.start()

@app.route('/get_timers')
def get_timers():
    with task_lock:
        tasks = list(tasks_by_id.values())
    return jsonify({'timers': tasks})

@app.route('/set_timer', methods=['POST'])
def set_timer():
    data = request.get_json()
    if not data or 'time' not in data or 'angle' not in data:
        return jsonify({'error': 'Missing parameters in JSON payload'}), 400

    try:
        scheduled_time = datetime.datetime.fromisoformat(data['time']).astimezone()
        angle = int(data['angle'])
    except ValueError:
        return jsonify({'error': 'All parameters must be integers'}), 400
    
    if angle < 0 or angle > 100:
        return jsonify({'error': f'Angle must be between 0 and 100'}), 400

    # Calculate the target execution time
    actual_angle = (1-angle/100) * angle_closed + (angle/100) * angle_open

    # Create a unique ID for this task
    task_id = str(uuid.uuid4())
    
    # Add task to our data structures
    with task_lock:
        task = {
            'id': task_id,
            'time': scheduled_time,
            'angle': actual_angle,
            'display_angle': angle,
        }
        tasks_by_id[task_id] = task
        timer_queue.put((scheduled_time, task_id))
    
    print(f"Timer set: {scheduled_time.isoformat()} from now, angle {actual_angle}, ID: {task_id}")
    return jsonify({
        'status': 'success',
        'id': task_id,
        'angle': angle,
        'actual_angle': actual_angle,
        'scheduled_for': scheduled_time.isoformat()
    })

@app.route('/set_angle', methods=['POST'])
def set_angle():
    if not ser:
        return jsonify({'error': 'Serial connection not established'}), 500

    data = request.get_json()
    if not data or 'angle' not in data:
        return jsonify({'error': 'No angle provided in JSON payload'}), 400

    try:
        angle = int(data['angle'])
    except ValueError:
        return jsonify({'error': 'Angle must be an integer'}), 400

    if angle < 0 or angle > 100:
        return jsonify({'error': f'Angle must be between 0 and 100'}), 400

    actual_angle = (1-angle/100) * angle_closed + (angle/100) * angle_open
    # Send the angle to the Arduino with a newline so the Arduino knows where it ends.
    ser.write(f"{actual_angle}\n".encode())
    print(f"Sent angle {actual_angle} to Arduino.")
    
    return jsonify({'status': 'success', 'angle': angle})

@app.route('/remove_timer', methods=['POST'])
def remove_timer():
    global cancel_current_task
    data = request.get_json()
    
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing task ID in JSON payload'}), 400
    
    task_id = data['id']
    removed = False
    
    with task_lock:
        if task_id in tasks_by_id:
            del tasks_by_id[task_id]
            removed = True
    
    # Check if the task is currently being processed
    with current_task_lock:
        if current_task == task_id:
            cancel_current_task = True
            removed = True
    
    if removed:
        return jsonify({'status': 'success', 'message': 'Timer removed'})
    else:
        return jsonify({'status': 'error', 'message': 'Timer not found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)