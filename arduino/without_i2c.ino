#include <LiquidCrystal.h>
#include <DHT.h>

#define DHTPIN 53      // Pin connected to the DHT sensor
#define DHTTYPE DHT11  // Change to DHT22 if you're using a DHT22 sensor

// Pin definitions for the LCD
#define LCD_RS 12
#define LCD_EN 11
#define LCD_D4 5
#define LCD_D5 4
#define LCD_D6 3
#define LCD_D7 2

// Pin for the LED
#define LED_PIN 52 

DHT dht(DHTPIN, DHTTYPE);

// Initialize the LCD with the defined pins
LiquidCrystal lcd(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

void setup() {
  // Set up the LCD's number of columns and rows
  lcd.begin(16, 2);
  lcd.print("Starting...");

  // Set up LED pin as output
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // Ensure the LED is initially off

  // Start serial communication at 9600 baud
  Serial.begin(9600);

  // Initialize the DHT sensor
  dht.begin();
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Check if any reads failed
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Send temperature and humidity as JSON to the serial port
  Serial.print("{\"temperature\":");
  Serial.print(temperature);
  Serial.print(",\"humidity\":");
  Serial.print(humidity);
  Serial.println("}");

  // Check if data is available on the serial port (from Node.js)
  if (Serial.available()) {
    String serialData = Serial.readStringUntil('\n');
    
    // Split the serial data for two lines
    String line1 = "";
    String line2 = "";
    
    int commaIndex = serialData.indexOf(",", 13);  // Find index of the comma after "S3:B"
    
    if (commaIndex != -1) {
      // Split the message into two parts
      line1 = serialData.substring(0, commaIndex);  // First part for the first line
      line2 = serialData.substring(commaIndex + 1); // Second part for the second line
    } else {
      // If no comma found or message is short, display entire message on one line
      line1 = serialData;
      line2 = "";
    }

    // Display messages on the LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1); // First line
    lcd.setCursor(0, 1);
    lcd.print(line2); // Second line
  }

  // Small delay to avoid rapid updates
  delay(500); 
}
