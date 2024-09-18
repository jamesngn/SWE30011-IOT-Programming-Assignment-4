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

        state[data.clientId] = {
            temp: data.temperature,
            humidity: data.humidity,
            highTemp: data.temperature >= 30,
            highHumidity: data.humidity >= 20
        }
        console.log(data);
    }
});

setInterval(() => {
    client.publish("broadcast", JSON.stringify(state));
}, 2000)
