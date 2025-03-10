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
            now = datetime.datetime.now()
            if scheduled_time > now:
                # Wait until the scheduled time
                wait_seconds = (scheduled_time - now).total_seconds()
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
        seconds = int(data['time'])
        angle = int(data['angle'])
    except ValueError:
        return jsonify({'error': 'All parameters must be integers'}), 400

    if seconds <= 0:
        return jsonify({'error': 'Time must be a positive integer'}), 400
    
    if angle < 0 or angle > 100:
        return jsonify({'error': f'Angle must be between 0 and 100'}), 400

    # Calculate the target execution time
    scheduled_time = datetime.datetime.now() + datetime.timedelta(seconds=seconds)
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
            'seconds': seconds
        }
        tasks_by_id[task_id] = task
        timer_queue.put((scheduled_time, task_id))
    
    print(f"Timer set: {seconds} seconds from now, angle {actual_angle}, ID: {task_id}")
    return jsonify({
        'status': 'success',
        'id': task_id,
        'time': seconds,
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

@app.route('/update_timer', methods=['POST'])
def update_timer():
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing task ID in JSON payload'}), 400
    
    task_id = data['id']
    updated = False
    
    with task_lock:
        if task_id in tasks_by_id:
            task = tasks_by_id[task_id]
            
            # Update time if provided
            if 'time' in data:
                try:
                    seconds = int(data['time'])
                    if seconds <= 0:
                        return jsonify({'error': 'Time must be a positive integer'}), 400
                    
                    task['seconds'] = seconds
                    task['time'] = datetime.datetime.now() + datetime.timedelta(seconds=seconds)
                except ValueError:
                    return jsonify({'error': 'Time must be an integer'}), 400
            
            # Update angle if provided
            if 'angle' in data:
                try:
                    angle = int(data['angle'])
                    if angle < 0 or angle > 100:
                        return jsonify({'error': f'Angle must be between 0 and 100'}), 400
                    
                    task['display_angle'] = angle
                    task['angle'] = (1-angle/100) * angle_closed + (angle/100) * angle_open
                except ValueError:
                    return jsonify({'error': 'Angle must be an integer'}), 400
            
            # For changes to take effect, we need to remove and re-add this task
            # First cancel current task if it's the one we're editing
            with current_task_lock:
                if current_task == task_id:
                    cancel_current_task = True
            
            # Add updated task to queue
            timer_queue.put((task['time'], task_id))
            updated = True
    
    if updated:
        return jsonify({'status': 'success', 'message': 'Timer updated'})
    else:
        return jsonify({'status': 'error', 'message': 'Timer not found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

"""from flask import Flask, request, jsonify
from flask_cors import CORS
import serial
import time
import threading
import queue
import datetime

app = Flask(__name__)
cors = CORS(app)

# Update this with your Arduino's serial port.
SERIAL_PORT = 'COM3'  # For Windows, e.g., 'COM3'
BAUD_RATE = 9600

angle_closed = 157
angle_open = 110

# Queue to store timer tasks
timer_queue = queue.PriorityQueue()

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
            scheduled_time, angle = timer_queue.get()
            
            # Update the current task
            with current_task_lock:
                current_task = (scheduled_time, angle)
                cancel_current_task = False
            
            # Calculate time to wait
            now = datetime.datetime.now()
            if scheduled_time > now:
                # Wait until the scheduled time
                wait_seconds = (scheduled_time - now).total_seconds()
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
    # Get all tasks in the queue
    tasks = list(timer_queue.queue)
    return jsonify({'timers': [{'time': task[0], 'angle': task[1]} for task in tasks]})

@app.route('/set_timer', methods=['POST'])
def set_timer():
    data = request.get_json()
    if not data or 'time' not in data or 'angle' not in data:
        return jsonify({'error': 'Missing parameters in JSON payload'}), 400

    try:
        seconds = int(data['time'])
        angle = int(data['angle'])
    except ValueError:
        return jsonify({'error': 'All parameters must be integers'}), 400

    if seconds <= 0:
        return jsonify({'error': 'Time must be a positive integer'}), 400
    
    if angle < 0 or angle > 100:
        return jsonify({'error': f'Angle must be between 0 and 100'}), 400

    # Calculate the target execution time
    scheduled_time = datetime.datetime.now() + datetime.timedelta(seconds=seconds)
        
    actual_angle = (1-angle/100) * angle_closed + (angle/100) * angle_open

    # Add timer task to the queue
    timer_queue.put((scheduled_time, actual_angle))
    
    print(f"Timer set: {seconds} seconds from now, angle {actual_angle}")
    return jsonify({
        'status': 'success', 
        'time': seconds, 
        'angle': actual_angle,
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
    if not data or 'time' not in data or 'angle' not in data:
        return jsonify({'error': 'Missing parameters in JSON payload'}), 400

    try:
        scheduled_time = datetime.datetime.fromisoformat(data['time'])
        angle = float(data['angle'])
    except ValueError:
        return jsonify({'error': 'Invalid time or angle format'}), 400

    # Use a temporary queue to rebuild the original queue without the specified task
    temp_queue = queue.PriorityQueue()
    removed = False

    with timer_queue.mutex:
        while not timer_queue.empty():
            task = timer_queue.get()
            if task[0] == scheduled_time and task[1] == angle and not removed:
                removed = True
                continue
            temp_queue.put(task)

    # Replace the original queue with the temporary queue
    with timer_queue.mutex:
        timer_queue.queue = temp_queue.queue

    # Check if the task is currently being processed
    with current_task_lock:
        if current_task == (scheduled_time, angle):
            cancel_current_task = True
            removed = True

    if removed:
        return jsonify({'status': 'success', 'message': 'Timer removed'})
    else:
        return jsonify({'status': 'error', 'message': 'Timer not found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
"""