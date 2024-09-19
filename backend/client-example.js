const mqtt = require("mqtt");
const { SerialPort, ReadlineParser } = require("serialport"); 

const clientId = "S1"

// AWS EC2 server
const serverHost = "13.239.19.45"
const client = mqtt.connect(`mqtt://${serverHost}:1883`, {
    clientId: clientId
});

const portPath = "COM6"; 

// Initialize the serial port
const port = new SerialPort({path: portPath, baudRate: 9600 }, (err) => {
    if (err) {
        return console.log('Error: ', err.message);
    }
    console.log('Serial Port Opened on', portPath);
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));


client.on("connect", () => {
    console.log("Connected to MQTT broker!");
    client.subscribe("broadcast", (err) => {
        if (err)
            console.log(err);
        else
            console.log("Successfully subscribed to the broadcast topic");
    });
});;

client.on("message", (topic, message) => {
    if (topic === `broadcast`) {

        const data = JSON.parse(message.toString());
        const serverResponse = data['S1'];
        console.log("🚀 ~ client.on ~ serverResponse:", serverResponse)

        if (serverResponse) {
            const temperature = serverResponse.temp;
            const humidity = serverResponse.humidity;
            const highTemp = serverResponse.highTemp;
            const highHumidity = serverResponse.highHumidity;

            let lcdmsg = `${clientId}: ${temperature}C, ${humidity}%`;

            // if (highTemp && highHumidity) {
            //     lcdmsg += `HT, HH`;
            // } else if (highTemp && !highHumidity) {
            //     lcdmsg += `HT, LH`;
            // } else if (!highTemp && highHumidity) {
            //     lcdmsg += `LT, HH`;
            // } else {
            //     lcdmsg += `LT, LH`;
            // }

            console.log("LCD Message: ", lcdmsg);
            port.write(lcdmsg + "\n");
            

        } else {
            console.log("No sensor data received from server");
        }
    }
});

// Listen to data from the Arduino
parser.on('data', (data) => {
    try {
        const sensorData = JSON.parse(data.trim());
        const temperature = sensorData.temperature;
        const humidity = sensorData.humidity;

        if (!isNaN(temperature) && !isNaN(humidity)) {
            const message = JSON.stringify({
                clientId: clientId,
                temperature: temperature,
                humidity: humidity,
                timestamp: new Date().toLocaleTimeString(),
            });

            // Publish the temperature data
            client.publish(`telemetry/${clientId}`, message);
            client.publish("telemetry", message);
            console.log(`Published data: ${message}`);
        }
    } catch (err) {
        console.error(`Error processing data: ${err}`);
    }
});
