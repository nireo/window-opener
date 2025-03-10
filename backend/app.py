from flask import Flask, request, jsonify
import serial
import time
import threading
import queue
import datetime

app = Flask(__name__)

# Update this with your Arduino's serial port.
SERIAL_PORT = 'COM3'  # For Windows, e.g., 'COM3'
BAUD_RATE = 9600

angle_closed = 157
angle_open = 110

# Queue to store timer tasks
timer_queue = queue.PriorityQueue()

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
    while True:
        try:
            # Get the next scheduled task (blocking until one is available)
            scheduled_time, angle = timer_queue.get()
            
            # Calculate time to wait
            now = datetime.datetime.now()
            if scheduled_time > now:
                # Wait until the scheduled time
                wait_seconds = (scheduled_time - now).total_seconds()
                if wait_seconds > 0:
                    time.sleep(wait_seconds)
            
            # Send angle command to Arduino
            if ser:
                ser.write(f"{angle}\n".encode())
                print(f"Timer executed: Sent angle {angle} to Arduino at {datetime.datetime.now()}")
            else:
                print(f"Timer executed but serial connection not available. Angle: {angle}")
                
            # Mark task as done
            timer_queue.task_done()
        except Exception as e:
            print(f"Error in timer worker: {e}")

# Start the timer worker thread
timer_thread = threading.Thread(target=timer_worker, daemon=True)
timer_thread.start()

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
