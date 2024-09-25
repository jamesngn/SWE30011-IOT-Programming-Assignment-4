#include <LiquidCrystal_I2C.h>
#include "dht.h"
#define DHTPIN A0
#define HUMPIN 8
#define TEMPPIN 9
#define LED_PIN 52
LiquidCrystal_I2C lcd(0x27, 16, 2);
dht DHT;
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
  
  // Update LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temperature);
  lcd.print((char)223);
  lcd.print("C");
  
  lcd.setCursor(0, 1);
  lcd.print("Humidity: ");
  lcd.print(humidity);
  lcd.print("%");
  
  delay(500);
}
