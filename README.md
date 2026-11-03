# Spectrum — Smart Power Management System

Spectrum is an Android application that lets me control the **LG U+ / Jinheung MTTL-W01 4-outlet smart power strip** from my phone, because apparently turning things off manually was too mainstream.

But honestly, the power strip is only half the story.

I built this project to get my hands dirty with things I don't usually work with, explore different technologies, and get a taste of problems from different industries. From reverse-engineering hardware protocols to making sockets behave, the goal was to learn, experiment, and occasionally question my life choices.

---

## Main Architecture: Pairing with the Power Strip

![Power Strip Pairing Architecture](https://github.com/user-attachments/assets/d1c0884f-2d89-45ea-b295-a450fc44ace6)

## Main Challenges

This project presented two major challenges (at least for me).

### 1. Communicating with an IoT Device

This was my first attempt at communicating with a device that doesn't primarily rely on a traditional Web API.

Unlike a REST API, where you typically send HTTP requests to specific endpoints such as `GET /devices` or `POST /devices/:id`, **this device communicates through a TCP socket using a custom command-based protocol**.

Instead of HTTP endpoints, I had to understand the device's commands and how to communicate with it through a persistent TCP connection.

For example:

```ts
socket.write("up:bootinfo\r\n");
socket.write("up:getinfo:all\r\n");
socket.write("up:power_report:2:vol\r\n");
```

Each command serves a specific purpose, whether requesting device information, retrieving outlet states, or requesting electrical measurements.

The challenge wasn't simply sending requests and receiving responses. It was **reverse-engineering the communication protocol, understanding its commands, parsing its responses, and maintaining a reliable connection with the device**.

### 2. Maintaining Live Electricity Consumption Charts

I believe this was the harder challenge. Let me explain.

My approach to retrieving live data is to **poll the power strip every 3 seconds** to retrieve its current metrics:

- Voltage
- Current
- Power consumption

What I'm particularly interested in is tracking energy consumption over time, allowing me to display historical readings such as:

- At 9 AM, the recorded consumption was 90 Wh.
- At 10 AM, the recorded consumption was 180 Wh.
- And so on.

If I stored every metric snapshot in the database every 3 seconds, I would end up with:

- 20 snapshots per minute
- 1,200 snapshots per hour
- 28,800 snapshots per day **for a single strip!**

This would put significant pressure on the database. Imagine having 100 users, potentially generating millions of database writes per day.

#### So, How Did I Solve This Problem?

For each strip, I maintain the timestamp of the last stored metrics snapshot in both the database and memory.

Instead of storing every reading, **I wait until one hour has passed before storing another snapshot**. Once an hour has elapsed, I take a new metrics snapshot, store it in the database, and update the timestamp.

This approach allows me to maintain approximately 12 data points per day, assuming a 12-hour tracking period, compared to the original 28,800 snapshots per day.

The result? A significantly reduced database workload while still providing enough historical data to display electricity consumption charts.

---

## How to Use the App

### 1. Put the Power Strip into Pairing Mode

Press and hold the general power button for approximately 10 seconds until the indicator starts flashing rapidly.

![Power Strip Pairing Mode](https://github.com/user-attachments/assets/10605bb7-d0d1-4602-949f-f5131f6095db)

### 2. Login or Create an Account

Login to your existing account or create a new one.

![Login Screen](https://github.com/user-attachments/assets/c7adf232-7d84-4715-965e-18e7cc6fdbb9)

### 3. Navigate to the Plugs Tab

Open the Plugs tab to manage your connected power strips.

![Plugs Tab](https://github.com/user-attachments/assets/c7adf232-7d84-4715-965e-18e7cc6fdbb9)

### 4. Create a New Plug

Tap the option to create a new plug.

![Create Plug](https://github.com/user-attachments/assets/33f28864-da62-4633-9fa9-a2fc8b995278)

### 5. Configure Your Power Strip

Enter the following information:

- **Serial Number:** Found on the back of the power strip.
- **Wi-Fi SSID:** Your home Wi-Fi network name.
- **Wi-Fi Password:** Your home Wi-Fi password.

Make sure your mobile device is connected to the same Wi-Fi network you want the power strip to connect to.

Click Save and wait for the activation process to finish.

![Plug Activation](https://github.com/user-attachments/assets/626f6cbd-7298-4135-beb1-82899c32912e)

### 6. Control Your Power Strip!

You're all set. Control individual outlets, manage the general power switch, and monitor electricity consumption directly from your phone.

![Power Strip Control](https://github.com/user-attachments/assets/4c7ad626-6c72-4dbe-bc1f-25055eb93910)

---

