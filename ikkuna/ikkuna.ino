#include <Servo.h>

Servo myServo;
const int servoPin = 9;
const int buttonPin = 12;

// Start with a default angle
int currentAngle = 157;
int lastButtonState = LOW;

void setup() {
  Serial.begin(9600);
  myServo.attach(servoPin);
  myServo.write(currentAngle);
  Serial.println(currentAngle);
  pinMode(buttonPin, INPUT);
}

void loop() {
  int targetAngle = 0;
  int buttonState = digitalRead(buttonPin);

  if (buttonState == LOW && lastButtonState == HIGH) {
    if (currentAngle == 157){
      targetAngle = 120;
    }else{
      targetAngle = 157;
    }
  }
  lastButtonState = buttonState;

  if (Serial.available() > 0) {
    // Read the target angle from serial input
    targetAngle = Serial.parseInt();
    
  }
  if (targetAngle == 0){
      return;
  }
  targetAngle = constrain(targetAngle, 120, 157);
    
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
  Serial.println(currentAngle);
  
  // Clear any remaining characters in the serial buffer
  while (Serial.available() > 0) {
    Serial.read();
  }
  
}
