const mqtt = require("mqtt");

// Global state object to track client data
let state = {};
const clientId = "server" + Math.random().toString(36).substring(7);

const serverHost = "13.239.19.45";
const client = mqtt.connect(`mqtt://${serverHost}:1883`, {
    clientId: clientId,
});

// Connect to the MQTT broker
client.on("connect", () => {
    console.log("connected!");
    client.subscribe("telemetry", (err) => {
        if (err) {
            console.log("Subscription error:", err);
        } else {
            console.log("Successfully subscribed to the telemetry topic");
        }
    });
});

// Event listener for incoming MQTT messages
client.on("message", (topic, message) => {
    if (topic === `telemetry`) {
        try {
            // Parse the incoming message
            const data = JSON.parse(message.toString());

            // Update the state based on client ID
            if (data.clientId) {
                state = {
                    ...state,
                    [data.clientId]: {
                        temp: data.temperature,
                        humidity: data.humidity,
                        highTemp: data.temperature >= 30,
                        highHumidity: data.humidity >= 20
                    }
                };

                console.log(`State updated for ${data.clientId}:`, state[data.clientId]);
            } else {
                console.log("Invalid message format: missing clientId");
            }
        } catch (err) {
            console.error("Error parsing message:", err);
        }
    }
});

// Periodically publish the updated state to the broadcast topic
setInterval(() => {
    // Check if the state is non-empty before publishing
    if (Object.keys(state).length > 0) {
        console.log("Publishing state:", state);
        client.publish("broadcast", JSON.stringify(state));
    } else {
        console.log("No client data to broadcast.");
    }
}, 2000);
