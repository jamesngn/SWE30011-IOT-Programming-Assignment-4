#include <LiquidCrystal_I2C.h>
//library already expects A4 and A5 to have the I2c attached,
//so 16,2 actually refers to the dimensions of the lcd 
//(All swinburne bookstore arduino kits would be 16,2 dimensions)
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.begin();  // Initialise the LCD
  lcd.backlight();  // Turn on the backlight
  
  // print a test message
  lcd.setCursor(0, 0);
  lcd.print("Moisture Level:");
}

void loop() {
    lcd.setCursor(0, 0);
  lcd.print("Moisture Level:");
}
