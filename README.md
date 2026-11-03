# Spectrum — Smart Power Management System

## Goal

Spectrum is an Android app that lets me control the LG U+ / Jinheung MTTL-W01 4-outlet smart power strip from my phone, because apparently turning things off manually was too mainstream.

But honestly, the power strip is only half the story.

I built this project to get my hands dirty with things I don't usually work with, explore different technologies, and get a taste of problems from different industries. From reverse-engineering hardware protocols to making sockets behave, the goal is to learn, experiment, and occasionally question my life choices.

## Main architecture of this smart strip

### 1. The Pairing Process 🔌

The most complicated part of this app is getting the Android phone to talk to the smart power strip in the first place.

1. **Enter pairing mode:** Press and hold the strip's general power button for **10 seconds**.
2. **Look for the signal:** The indicator next to the general power button should start flashing rapidly, indicating the strip is broadcasting its setup hotspot (`TONLY_TAP_XXXXXX`).
3. **Send configuration to the strip (via TCP port 30300):**
    1. **Backend Server IP:** Tells the strip where to connect for commands and telemetry (`up:ip:<SERVER_IP>`).
    2. **Home Wi-Fi Credentials:** Allows the strip to join your local network (`up:connect:<SSID>:<PASSWORD>`).
4. **Network switch & verification:**
    - The strip reboots into Station mode and joins your home Wi-Fi network (2.4 GHz).
    - The strip connects to the backend server on port **10086**, identifying itself via `up:bootinfo` and completing verification.

```mermaid
flowchart TD
    subgraph Step1 ["1. Hardware Setup (Pairing Mode)"]
        A([Start Pairing]) --> B["Press and hold general power button for 10s"]
        B --> C{"Is LED indicator flashing rapidly?"}
        C -- "No" --> B
        C -- "Yes" --> D["Strip starts SoftAP hotspot: TONLY_TAP_XXXXXX"]
    end

    subgraph Step2 ["2. SoftAP Provisioning (Direct TCP :30300)"]
        D --> E["Spectrum app connects to strip hotspot"]
        E --> F["Enforce Wi-Fi routing for no-internet network"]
        F --> G["Resolve strip gateway IP (192.168.1.1 / 192.168.4.1)"]
        G --> H["Send target backend IP via TCP: up:ip:SERVER_IP"]
        H --> I{"Response: up:ip:ip_ok?"}
        I -- "No" --> H
        I -- "Yes" --> J["Send Wi-Fi credentials: up:connect:SSID:PASSWORD"]
        J --> K{"Response: up:connect:connect_ok?"}
        K -- "No" --> J
    end

    subgraph Step3 ["3. Network Transition"]
        K -- "Yes" --> L["Strip saves config and reboots in Station mode"]
        L --> M["Strip connects to Home Wi-Fi router (2.4 GHz)"]
        L --> N["Phone disconnects hotspot and reconnects to Home Wi-Fi"]
    end

    subgraph Step4 ["4. Backend Handshake & Verification (TCP :10086)"]
        M --> O["Strip dials Backend TCP server on port 10086"]
        N --> P["App polls verify endpoint and listens to Socket.io"]
        O --> Q["Server queries device identity: up:bootinfo"]
        Q --> R["Strip announces serial: up:bootinfo:model;mac;serial;..."]
        R --> S["Backend binds TCP socket to plug and emits strip_verified"]
        P & S --> T([Pairing Complete & Ready to Control! 🚀])
    end
```
