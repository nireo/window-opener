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
SERIAL_PORT = 'COM11'  # For Windows, e.g., 'COM3'
BAUD_RATE = 9600

angle_closed = 157
angle_open = 120
current_angle = angle_closed

# Task management with unique IDs
timer_queue = queue.PriorityQueue()
tasks_by_id = {}  # Dictionary to store tasks by ID


# Attempt to open the serial connection.
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)  # Give the Arduino time to reset
    print(f"Connected to Arduino on {SERIAL_PORT} at {BAUD_RATE} baud.")
except Exception as e:
    print(f"Error opening serial port: {e}")
    ser = None

def serial_worker():
    global current_angle
    while True:
        if ser:
            # Read the serial data and update the current angle
            try:
                line = ser.readline().decode().strip()
                if line:
                    current_angle = int(line)
                    print(f"Current angle: {current_angle}")
            except Exception as e:
                print(f"Error reading serial data: {e}")

# Background worker to process timer queue
def timer_worker():
    while True:
        try:
            # Get the next scheduled task (blocking until one is available)
            if timer_queue.qsize() > 0:
                priority, task_id = timer_queue.queue[0]
                
                task = tasks_by_id[task_id]
                scheduled_time = task['time']
                angle = task['angle']
            
                # Calculate time to wait
                now = datetime.datetime.now().astimezone()
                if scheduled_time > now:
                    # Wait until the scheduled time
                    wait_seconds = (scheduled_time - now).total_seconds()
                    print(f"Timer waiting for {wait_seconds} seconds until {scheduled_time}")
                    if wait_seconds > 0:
                        time.sleep(min(wait_seconds, 1))  # Limit to 1 minute
                        continue
                

                timer_queue.get()
                # Send angle command to Arduino
                if ser:
                    ser.write(f"{angle}\n".encode())
                    print(f"Timer executed: Sent angle {angle} to Arduino at {datetime.datetime.now()}")
                else:
                    print(f"Timer executed but serial connection not available. Angle: {angle}")
                
                # Remove completed task
                if task_id in tasks_by_id:
                    del tasks_by_id[task_id]
                    
                # Mark task as done
                timer_queue.task_done()
            else:
                time.sleep(1)

        except Exception as e:
            print(f"Error in timer worker: {e}")
            time.sleep(1)

# Start the timer worker thread
timer_thread = threading.Thread(target=timer_worker, daemon=True)
timer_thread.start()

# Start the serial worker thread
serial_thread = threading.Thread(target=serial_worker, daemon=True)
serial_thread.start()


@app.route('/get_timers')
def get_timers():
    tasks = list(tasks_by_id.values())
    return jsonify({'timers': tasks})

@app.route('/set_timer', methods=['POST'])
def set_timer():
    data = request.get_json()
    if not data or 'time' not in data or 'angle' not in data:
        return jsonify({'error': 'Missing parameters in JSON payload'}), 400

    try:
        scheduled_time = datetime.datetime.fromtimestamp(data['time']).astimezone()
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
    task = {
        'id': task_id,
        'time': scheduled_time,
        'angle': actual_angle,
        'display_angle': angle,
    }
    tasks_by_id[task_id] = task
    timer_queue.put((scheduled_time.timestamp(), task_id))
    
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
    
    return jsonify({'status': 'success'})

# Get angle
@app.route('/get_angle')
def get_angle():
    # Calulate the angle between 0 and 100
    angle = (angle_closed - current_angle) / (angle_closed - angle_open) * 100
    print(f"Current angle: {current_angle}, calculated angle: {angle}")
    return jsonify({'angle': angle})

@app.route('/remove_timer', methods=['POST'])
def remove_timer():
    global cancel_current_task
    data = request.get_json()
    
    if not data or 'id' not in data:
        return jsonify({'error': 'Missing task ID in JSON payload'}), 400
    
    task_id = data['id']
    if task_id in tasks_by_id:
        del tasks_by_id[task_id]
        new_queue = queue.PriorityQueue()
        while not timer_queue.empty():
            priority, tid = timer_queue.get()
            if tid != task_id:
                new_queue.put((priority, tid))
                timer_queue.queue = new_queue.queue
                removed = True
            else:
                removed = False
    
    
    if removed:
        return jsonify({'status': 'success', 'message': 'Timer removed'})
    else:
        return jsonify({'status': 'error', 'message': 'Timer not found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)