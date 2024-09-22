#include <LiquidCrystal_I2C.h>
#include "dht.h"

#define DHTPIN A0
//library already expects A4 and A5 to have the I2c attached,
//so 16,2 actually refers to the dimensions of the lcd 
//(All swinburne bookstore arduino kits would be 16,2 dimensions)
LiquidCrystal_I2C lcd(0x27, 16, 2);
dht DHT;

unsigned long lastReadingTime = 0;
const unsigned long readingInterval = 5000; // 5 sec

void setup() {
  Serial.begin(9600);
  while (!Serial) {;}
  
  lcd.begin();  // Initialise the LCD
  lcd.backlight();  // turn on the backlight (possibly not needed)
  
  // Print initial message
  lcd.setCursor(0, 0);
  lcd.print("Temp & Humidity");
}

void loop() {
  unsigned long currentTime = millis();
  
  if (currentTime - lastReadingTime >= readingInterval) {
    updateSensorData();
    lastReadingTime = currentTime;
  }
}

void updateSensorData() {
  int chk = DHT.read11(DHTPIN);
  delay(100);
  
  // Update lcd
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(DHT.temperature);
  lcd.print((char)223);
  lcd.print("C");
  
  lcd.setCursor(0, 1);
  lcd.print("Humidity: ");
  lcd.print(DHT.humidity);
  lcd.print("%");
  
  // serial communication for later.
  Serial.print("DATA:");
  Serial.print(DHT.temperature);
  Serial.print(",");
  Serial.println(DHT.humidity);
}
