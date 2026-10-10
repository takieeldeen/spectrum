# Implementation Plan: Custom Self-Hosted Node.js Server for LG U+ MTTL-W01

## Goal Description
Build a **completely independent, self-hosted Node.js server** in `BE` to control the **LG U+ IoT Smart Power Strip (Model: MTTL-W01)** directly on your local network. 

**No Voltra account, no third-party subscriptions, no external cloud dependencies.** You will have 100% local ownership and control over your power strip.

---

## System Architecture & How Local Control Works

The MTTL-W01 hardware (Realtek RTL8711AF/RTL8195A SoC) was originally programmed by LG U+ to connect to their oneM2M IoT cloud. 

To take full local control without cloud intermediaries:

```mermaid
flowchart TD
    subgraph Local Hardware & Network
        Strip["LG U+ MTTL-W01 Power Strip"]
        Router["Home Wi-Fi Router"]
    end

    subgraph Node.js Backend Server (BE)
        DNS["1. Local DNS Server (Port 53)<br/>Resolves *.onem2m.uplus.co.kr -> Local IP"]
        TLS["2. Local TLS Server (Port 443)<br/>Cert with CN=brk2.onem2m.uplus.co.kr"]
        M2M["3. oneM2M Protocol Engine<br/>Handles Device Handshake, Relays & Telemetry"]
        REST["4. REST & WebSocket API (Port 4000)<br/>Control Outlets 1-4 & Stream Watts"]
    end

    subgraph Client Apps
        Dashboard["Next.js / Custom Dashboard"]
    end

    Strip -->|1. DNS Lookup for *.onem2m.uplus.co.kr| DNS
    Strip -->|2. Connects via TLS| TLS
    TLS <--> M2M
    M2M <--> REST
    Dashboard <-->|REST & WebSocket| REST
```

### The 4 Pillars of the Custom Server:
1. **Local DNS Service (Port 53):** Intercepts DNS queries for `*.onem2m.uplus.co.kr` (and `*.uplus.co.kr`) from the strip and resolves them to your server's local IP address. All other DNS queries are forwarded upstream (e.g. to `8.8.8.8` or your router).
2. **Local TLS Gateway (Port 443):** Terminates TLS using a certificate generated specifically for `CN=brk2.onem2m.uplus.co.kr` (the firmware does not validate public root CAs; it accepts self-signed certificates with this CN/SAN).
3. **oneM2M Protocol Engine:** Handles the device onboarding handshake, state reporting, socket switching commands (relays 1 to 4), and on-demand power polling.
4. **Control REST API & WebSocket (Port 4000):** Clean HTTP endpoints and WebSocket for your dashboard to toggle sockets and view real-time wattage.

---

## User Review Required

> [!IMPORTANT]
> **Port Privileges on macOS / Linux:**
> - DNS runs on port `53` and HTTPS runs on port `443`. On Unix systems (macOS), binding to ports under 1024 typically requires elevated privileges (`sudo`) or port forwarding (e.g., via `pfctl`).
> - We will design the server so the DNS and TLS ports are configurable (default 53 and 443, or high ports like 5353 and 8443 if you use router port forwarding).
>
> **Wi-Fi Provisioning:**
> - Is your MTTL-W01 already connected to your local 2.4GHz Wi-Fi network, or is it currently in factory pairing mode (LED blinking rapidly, broadcasting `TONLY_Tap_XXXXX`)?
> - We will include a provisioning script to send Wi-Fi credentials to the strip over its local setup AP port (`30300`) if needed.

---

## Proposed Changes (in `BE`)

We will initialize and construct the backend application in `/Users/takieeldeen/Desktop/sandbox/React Native/spectrum/BE`:

### 1. Project Initialization & Dependencies
#### [NEW] `package.json`
- Dependencies: `express`, `cors`, `ws`, `dotenv`, `dnscache`, `node-forge` (for on-the-fly cert generation).
- DevDependencies: `typescript`, `@types/node`, `@types/express`, `@types/ws`, `tsx`, `ts-node-dev`.

#### [NEW] `tsconfig.json`
- Standard Node.js ES2022 TypeScript configuration.

---

### 2. Core Server Modules
#### [NEW] `src/certs/cert-generator.ts`
- Automatically generates the required self-signed X.509 certificate and private key with:
  - `CN=brk2.onem2m.uplus.co.kr`
  - `SAN=DNS:brk2.onem2m.uplus.co.kr, DNS:mef.onem2m.uplus.co.kr, DNS:*.onem2m.uplus.co.kr`
  - Issuer configured to match what the device accepts (`DigiCert Global Root G2` / self-signed).

#### [NEW] `src/dns/dns-server.ts`
- Lightweight UDP DNS server listening on port 53.
- Resolves queries matching `*uplus.co.kr` or `*onem2m*` to the server's local IPv4.
- Recursively passes other network queries to upstream DNS (`1.1.1.1` / `8.8.8.8`).

#### [NEW] `src/gateway/tls-gateway.ts`
- HTTPS/TLS server listening on port 443 using the generated certificate.
- Traffic Inspector: logs all incoming HTTP/HTTPS and socket requests from the strip (path, headers, body, raw frames) to establish full packet trace.
- Dispatches oneM2M messages to the protocol engine.

#### [NEW] `src/protocol/onem2m-engine.ts`
- Manages connected MTTL-W01 strips by MAC address and oneM2M ID.
- Maintains in-memory state for:
  - Relay 1 (`on` / `off`, watts)
  - Relay 2 (`on` / `off`, watts)
  - Relay 3 (`on` / `off`, watts)
  - Relay 4 (`on` / `off`, watts)
  - Total Strip Power (watts)
  - Device online/offline connectivity heartbeat
  - Formats and sends downlink commands to toggle individual relays.

#### [NEW] `src/api/rest-server.ts` & `src/api/websocket-server.ts`
- REST API on port 4000:
  - `GET /api/devices`: List all connected MTTL-W01 power strips
  - `GET /api/devices/:id`: Detailed device state (outlets 1-4, telemetry)
  - `POST /api/devices/:id/outlets/:outletId/toggle`: Toggle outlet state
  - `POST /api/devices/:id/outlets/:outletId/turn-on`: Turn on outlet 1..4
  - `POST /api/devices/:id/outlets/:outletId/turn-off`: Turn off outlet 1..4
  - `POST /api/devices/:id/refresh`: Force poll instant wattage
- WebSocket server:
  - `ws://localhost:4000/ws`: Real-time state and power stream for your frontend dashboard.

#### [NEW] `src/provisioning/wifi-provisioner.ts`
- Helper script to connect to `TONLY_Tap_XXXXX` AP and provision your home Wi-Fi SSID and password to the strip.

#### [NEW] `src/index.ts`
- Main bootstrap coordinating the DNS server, TLS gateway, and REST/WebSocket API.

---

## Verification Plan

### Step 1: Unit & Component Verification
- Verify certificate generation produces valid X.509 cert matching `brk2.onem2m.uplus.co.kr`.
- Test local DNS server using `dig @127.0.0.1 brk2.onem2m.uplus.co.kr` to confirm it returns local IP.
- Test TLS gateway responds to HTTPS requests.

### Step 2: Strip Connection Verification
- Point router DNS (or configure strip Wi-Fi) to server's local IP.
- Power cycle the MTTL-W01 strip.
- Verify in server console:
  1. DNS query from strip's IP is received and redirected.
  2. TLS handshake from strip succeeds.
  3. Device registration and initial relay state (`Update relay state, ...`) are logged.

### Step 3: Relay Control Verification
- Send a test curl command to turn on socket 1:
  ```bash
  curl -X POST http://localhost:4000/api/devices/<DEVICE_ID>/outlets/1/turn-on
  ```
- Listen for audible click on the physical relay and confirm LED turns green/blue.
- Check WebSocket broadcast updates state to `on`.
