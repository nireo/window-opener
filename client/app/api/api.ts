export async function setAngle(angle: number) {
    await fetch("http://localhost:5000/set_angle", 
        {method: 'POST', body: JSON.stringify({angle}), headers: {'Content-Type': 'application/json'}});
}

// time in seconds
export async function setTimer(time: number, angle: number) {
    await fetch("http://localhost:5000/set_timer", 
        {method: 'POST', body: JSON.stringify({time, angle}), headers: {'Content-Type': 'application/json'}});
}

export async function getTimers() {
    const response = await fetch("http://localhost:5000/get_timers");
    const json = await response.json();
    return json.timers;
}