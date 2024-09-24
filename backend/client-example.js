const mqtt = require("mqtt");
const { SerialPort, ReadlineParser } = require("serialport");

const clientId = "S1"; // Unique client ID for this device

// AWS EC2 server
const serverHost = "3.107.3.0";
const client = mqtt.connect(`mqtt://${serverHost}:1884`, {
  clientId: clientId,
});

const portPath = "COM6"; // Serial port path for Arduino

// Initialize the serial port
const port = new SerialPort({ path: portPath, baudRate: 9600 }, (err) => {
  if (err) {
    return console.log("Error: ", err.message);
  }
  console.log("Serial Port Opened on", portPath);
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

client.on("connect", () => {
  console.log("Connected to MQTT broker!");
  client.subscribe("broadcast", (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully subscribed to the broadcast topic");
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === `broadcast`) {
    const data = JSON.parse(message.toString());
    const serverResponse = data.find((entry) => entry.clientId === clientId);

    if (serverResponse) {
      const { temperature, humidity, danger } = serverResponse;

      // Display data on LCD
      let lcdmsg = `${clientId}:`;

      if (danger) {
        lcdmsg += `B`;
      } else {
        lcdmsg += `G`;
      }

      console.log("LCD Message: ", lcdmsg);
      port.write(lcdmsg + "\n");
    } else {
      console.log("No sensor data received from server");
    }
  }
});

// Listen to data from the Arduino
parser.on("data", (data) => {
  try {
    const sensorData = JSON.parse(data.trim());
    const { temperature, humidity } = sensorData;

    if (!isNaN(temperature) && !isNaN(humidity)) {
      const message = JSON.stringify({
        clientId: clientId,
        temperature: temperature,
        humidity: humidity,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Publish the temperature and humidity data
      client.publish("telemetry", message);
      console.log(`Published data: ${message}`);
    }
  } catch (err) {
    console.error(`Error processing data: ${err}`);
  }
});
