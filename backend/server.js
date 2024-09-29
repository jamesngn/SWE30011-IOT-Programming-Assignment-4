const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const path = require("path");

// Global state object to track client data
let state = {};

// Create the Express app
const app = express();

app.use(bodyParser.json({ type: "application/json" }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/disarm", (req, res) => {
    const { clientId } = req.body;
    if (!state[clientId]) {
        res.status(404).send(`The client "${clientId}" does not exist`)
        return;
    }

    state[clientId].danger = false;

    const autoTimestamp = new Date();
    autoTimestamp.setSeconds(autoTimestamp.getSeconds() + 10);
    state[clientId].autoTimestamp = autoTimestamp;

    res.status(200).end();
});

app.post("/arm", (req, res) => {
    const { clientId } = req.body;
    if (!state[clientId]) {
        res.status(404).send(`The client "${clientId}" does not exist`)
        return;
    }

    state[clientId].danger = true;

    const autoTimestamp = new Date();
    autoTimestamp.setSeconds(autoTimestamp.getSeconds() + 10);
    state[clientId].autoTimestamp = autoTimestamp;

    res.status(200).end();
});

app.get("/stations", (req, res) => {
    const arr = Object.keys(state).map((key) => {
        return {
            clientId: key,
            temperature: state[key].temperature,
            humidity: state[key].humidity,
            danger: state[key].danger,
        };
    });

    res.status(200).send(arr);
})


// Start Express server on port 3000
const expressPort = 3000;
app.listen(expressPort, () => {
    console.log(`Express server running on port ${expressPort}`);
});

// Create the MQTT client
const clientId = "Server";
const mqttClient = mqtt.connect("mqtt://localhost:1884", {
    clientId: clientId,
});

// Handle MQTT connection and message events
mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker");

    mqttClient.subscribe("telemetry", (err) => {
        if (err) {
            console.log("Subscription error:", err);
        } else {
            console.log("Successfully subscribed to the telemetry topic");
        }
    });
});

// Event listener for incoming MQTT messages
mqttClient.on("message", (topic, message) => {
    if (topic === "telemetry") {
        try {
            // Parse the incoming message
            const data = JSON.parse(message.toString());
            // Update the state based on client ID
            if (data.clientId) {
                const now = new Date();
                let danger = data.temperature >= 23 && data.humidity >= 70;

                if (state[data.clientId]?.autoTimestamp && now < state[data.clientId].autoTimestamp)
                    danger = state[data.clientId].danger;

                state = {
                    ...state,
                    [data.clientId]: {
                        ...state[data.clientId],
                        temperature: data.temperature,
                        humidity: data.humidity,
                        danger: danger,
                        timestamp: new Date()
                    },
                };

                console.log(
                    `State updated for ${data.clientId}:`,
                    state[data.clientId]
                );
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
    if (Object.keys(state).length > 0) {
        const arr = Object.keys(state).map((key) => {
            return {
                clientId: key,
                temperature: state[key].temperature,
                humidity: state[key].humidity,
                danger: state[key].danger,
            };
        });

        console.log("Publishing state:", JSON.stringify(arr));
        mqttClient.publish("broadcast", JSON.stringify(arr));
    } else {
        console.log("No client data to broadcast.");
    }
}, 2000);
