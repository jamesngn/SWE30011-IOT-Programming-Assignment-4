const mqtt = require("mqtt");

const clientId = "client" + Math.random().toString(36).substring(7);
const client = mqtt.connect("mqtt://localhost:1884", {
    clientId: clientId
});

client.on("connect", () => {
    console.log("connected!");
    client.subscribe("broadcast", (err) => {
        if (err)
            console.log(err)
        else
            console.log("Successfully subscribed to the broadcast topic");
    });
})

client.on("message", (topic, message) => {
    if (topic === `broadcast`)
        console.log(message.toString());
})

setInterval(async () => {
    const message = JSON.stringify({
        clientId: clientId,
        temperature: Math.round(Math.random() * (50 - 15) + 15),
        timestamp: new Date().toLocaleTimeString(),
    })
    await Promise.all(
        [client.publishAsync(`telemetry/${clientId}`, message),
        client.publishAsync("telemetry", message)])
}, 2000)
