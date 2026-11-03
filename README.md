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

## For Developers: Power Strip API Reference

The **LG U+ / Jinheung MTTL-W01** smart power strip communicates over a persistent **TCP socket** connection. Commands and responses are ASCII strings delimited by CRLF (`\r\n`).

### 1. Device Identification

#### Request Device Boot Info
Retrieves hardware metadata, MAC address, serial number, and firmware version.

- **Command:** `up:bootinfo\r\n`
- **Response Format:** `up:bootinfo:<model>;<mac>;<serial>;<firmware>;connect`
- **Example Response:** `up:bootinfo:MTTL-W01;2CFDB3C1DE06;1234567890;1.0.0;connect`

---

### 2. State & Telemetry

#### Query All Outlets
Fetches live telemetry, relay status, power, energy, and temperature for all 4 outlets simultaneously.

- **Command:** `up:getinfo:all\r\n`
- **Response Format:**
  ```text
  up:getinfo:1:<data_1>:2:<data_2>:3:<data_3>:4:<data_4>
  ```
  Each outlet payload contains 12 semicolon-separated fields:
  ```text
  <outlet_index>:<runtime>;<relay>;<state>;<overload>;<overheat>;<power_mW>;<energy_hex>;<previous_hex>;<config_hex>;<status>;<event>;<temperature_C>
  ```

| Field Index | Name | Type | Description |
|---|---|---|---|
| 0 | `runtime` | integer | Total running time in seconds |
| 1 | `relay` | string | Current relay state (`on` / `off`) |
| 2 | `state` | integer | Internal operational state code |
| 3 | `overload` | string | Overload protection flag (`ok` / `fault`) |
| 4 | `overheat` | string | Overheat protection flag (`ok` / `fault`) |
| 5 | `power_mW` | integer | Active power consumption in milliwatts ($1000\text{ mW} = 1\text{ W}$) |
| 6 | `energy_hex` | hex string | Accumulated energy consumption ($\text{hex value} / 1000 = \text{kWh}$) |
| 7 | `previous_hex` | hex string | Previous cycle energy snapshot |
| 8 | `config_hex` | hex string | Internal configuration bitmask |
| 9 | `status` | string | Channel health status |
| 10 | `event` | string | Last recorded channel event |
| 11 | `temperature_C` | integer | Ambient board/relay temperature in °C |

- **Query Single Outlet:** `up:getinfo:<1-4>\r\n` (e.g., `up:getinfo:1\r\n`)

#### Query Line Voltage
Requests real-time AC line voltage measurement.

- **Command:** `up:power_report:2:vol\r\n`
- **Response Format:** `up:power_report:2:<millivolts>`
- **Example Response:** `up:power_report:2:220500` (corresponds to $220.5\text{ V}$)
- **Current Calculation:** With voltage and milliwatts known, electric current is derived as:
  $$\text{Current (A)} = \frac{\text{power (W)}}{\text{voltage (V)}}$$

---

### 3. Outlet Power Control

#### Toggle Outlet Relay
Turns a specific outlet socket ON or OFF.

- **Command:** `up:onoff:<outlet>:<state>\r\n`
  - `<outlet>`: `1`, `2`, `3`, or `4`
  - `<state>`: `on` or `off`
- **Examples:**
  - Turn Outlet 1 ON: `up:onoff:1:on\r\n`
  - Turn Outlet 3 OFF: `up:onoff:3:off\r\n`

---

### 4. Push Events (From Strip to Server/App)

#### Physical Button Press Event
Broadcasted automatically by the strip whenever someone presses a physical button on the hardware.

- **Payload:** `up:event:onoff:<outlet>:<state>\r\n`
- **Example:** `up:event:onoff:2:on\r\n` (Outlet 2 was toggled ON manually)

---

### 5. Wi-Fi Provisioning & Dial-Back Configuration

Used during setup when the strip is in Hotspot / AP mode to pair it with the local network.

#### Set Backend Dial-Back IP
Instructs the strip which server or phone IP address to connect to via TCP once connected to Wi-Fi.

- **Command:** `up:ip:<server_ip>\r\n`
- **Response:** `up:ip:ip_ok`
- **Example:** `up:ip:192.168.1.150\r\n`

#### Connect to Wi-Fi Network
Supplies target Wi-Fi credentials. Upon receiving this command, the strip saves the network parameters, sends confirmation, reboots, and connects to the specified network.

- **Command:** `up:connect:<ssid>:<password>\r\n`
- **Response:** `up:connect:connect_ok`
- **Example:** `up:connect:MyHomeNetwork:SuperSecretPassword\r\n`

---

## Tech Stack

- **Mobile:** React Native & Expo
- **Backend:** Node.js & TypeScript
- **Database:** MongoDB
- **Cloud & Infrastructure:** AWS EC2 Server, AWS S3 Buckets
