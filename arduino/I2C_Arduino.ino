#include <LiquidCrystal_I2C.h>
#include "dht.h"
#define DHTPIN A0
#define HUMPIN 8
#define TEMPPIN 9
#define LED_PIN 52
LiquidCrystal_I2C lcd(0x27, 16, 2);
dht DHT;

String lastStatus = "Status: Wait..."; // Store the last status message

void setup() {
  Serial.begin(9600);
  while (!Serial) {;}
  
  pinMode(HUMPIN, OUTPUT);
  pinMode(TEMPPIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // Ensure the LED is initially off
  
  lcd.begin();  // Initialize the LCD
  lcd.backlight();
  lcd.print("Temp & Humidity");
}

void loop() {
  int chk = DHT.read11(DHTPIN);
  
  float temperature = DHT.temperature;
  float humidity = DHT.humidity;
  
  Serial.print("{\"temperature\":");
  Serial.print(temperature);
  Serial.print(",\"humidity\":");
  Serial.print(humidity);
  Serial.println("}");
  
  if (temperature >= 23) {
    digitalWrite(TEMPPIN, HIGH);
  } else {
    digitalWrite(TEMPPIN, LOW);
  }
  
  if (humidity >= 70) {
    digitalWrite(HUMPIN, HIGH);
  } else {
    digitalWrite(HUMPIN, LOW);
  }
  
  // Check if data is available on the serial port
  if (Serial.available()) {
    String serialData = Serial.readStringUntil('\n');
    lastStatus = serialData; // Update the last status
    displayMessage(lastStatus, temperature, humidity);
  } else {
    displayMessage(lastStatus, temperature, humidity);
  }
  
  delay(500);
}

void displayMessage(String message, float temp, float hum) {
  lcd.clear();
  
 
  lcd.setCursor(0, 0);
  lcd.print(message.substring(0, 16));
  
 
  lcd.setCursor(0, 1);
  if (message.length() > 16) {
    int remainingChars = min(4, message.length() - 16);
    lcd.print(message.substring(16, 16 + remainingChars));
  }
  
  lcd.setCursor(5, 1);
  lcd.print("T:");
  lcd.print(int(temp));
  lcd.print("H:");
  lcd.print(int(hum));
  lcd.print("%");
}
