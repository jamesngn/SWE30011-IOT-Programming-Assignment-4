const mqtt = require("mqtt");

const state = {};


const clientId = "server" + Math.random().toString(36).substring(7);
const client = mqtt.connect("mqtt://localhost:1884", {
    clientId: clientId,
});

client.on("connect", () => {
    console.log("connected!");
    client.subscribe("telemetry", (err) => {
        if (err)
            console.log(err)
        else
            console.log("Successfully subscribed to the telemetry topic");
    });
})

client.on("message", (topic, message) => {
    if (topic === `telemetry`) {
        const data = JSON.parse(message.toString());

        if (data.temperature >= 30)
            state[data.clientId] = "ON FIRE";
        else
            state[data.clientId] = "COOL";

        console.log(data);
    }
})

setInterval(() => {
    client.publish("broadcast", JSON.stringify(state));
}, 3000)
