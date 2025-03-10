export async function setAngle(angle: number) {
    await fetch("http://localhost:5000/set_angle", {method: 'POST', body: JSON.stringify({angle}), headers: {'Content-Type': 'application/json'}});
}