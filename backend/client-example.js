const mqtt = require("mqtt");
const { SerialPort, ReadlineParser } = require("serialport");

const clientId = "S1"; // Unique client ID for this device

// AWS EC2 server
const serverHost = "3.107.3.0";
const client = mqtt.connect(`mqtt://${serverHost}:1884`, {
  clientId: clientId,
});

const portPath = "/dev/ttyACM0"; // Serial port path for Arduino

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
    try {
      // Parse the message as a JSON object
      const data = JSON.parse(message.toString());

      // Generate the LCD message for each client
      let lcdmsg = "";

      // Iterate over the array of client data
      data.forEach((client, index) => {
        const { clientId, danger } = client;
        const status = danger ? "B" : "G";

        // Split the data into two lines based on index
        lcdmsg += `${clientId}:${status},`;
      });

      // Remove the trailing comma
      lcdmsg = lcdmsg.slice(0, -1);

      // Display the final LCD message
      console.log("LCD Message: ", lcdmsg);
      port.write(lcdmsg + "\n");
    } catch (err) {
      console.error("Error processing broadcast message:", err);
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
