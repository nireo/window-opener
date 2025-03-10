#include <Servo.h>

Servo myServo;
const int servoPin = 9;

// Start with a default angle
int currentAngle = 150;

void setup() {
  Serial.begin(9600);
  myServo.attach(servoPin);
  myServo.write(currentAngle);
}

void loop() {
  if (Serial.available() > 0) {
    // Read the target angle from serial input
    int targetAngle = Serial.parseInt();
    targetAngle = constrain(targetAngle, 0, 180);
    
    Serial.print("Moving servo from ");
    Serial.print(currentAngle);
    Serial.print(" to ");
    Serial.print(targetAngle);
    Serial.println(" degrees.");
    
    // Gradually move the servo to the target angle
    if (currentAngle < targetAngle) {
      for (int angle = currentAngle; angle <= targetAngle; angle++) {
        myServo.write(angle);
        delay(20);  // Delay between each incremental step (adjust to control speed)
      }
    } else if (currentAngle > targetAngle) {
      for (int angle = currentAngle; angle >= targetAngle; angle--) {
        myServo.write(angle);
        delay(20);  // Delay between each incremental step (adjust to control speed)
      }
    }
    
    // Update current angle to the new position
    currentAngle = targetAngle;
    Serial.println("Movement complete.");
    
    // Clear any remaining characters in the serial buffer
    while (Serial.available() > 0) {
      Serial.read();
    }
  }
}
