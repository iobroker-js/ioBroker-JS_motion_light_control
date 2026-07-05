# Frontdoor Motion Light

An ioBroker JavaScript script that turns on a front door light on motion detection, but **only during night time**. It automatically turns the light back off after a configurable timeout once no more motion is detected.

Night time can be defined in two ways:

- **Manual** – fixed clock times (e.g. 20:00 – 07:00)
- **Auto** – automatically calculated from sunset/sunrise (or any other astro event) based on your ioBroker system location

## Features

- 🌙 Motion-triggered light, active only at night
- ⏱ Configurable timeout (auto turn-off after last motion)
- 🔧 Switch between **manual** (fixed times) and **auto** (astro-based) night detection
- 🌅 Choose any astro event as start/end trigger (`sunset`, `sunrise`, `dusk`, `dawn`, `nauticalDawn`, `nauticalDusk`, `nightEnd`, `night`, `goldenHour`, `goldenHourEnd`, `sunriseEnd`, `sunsetStart`, `solarNoon`, `nadir`)
- ➕ Optional offset in minutes for the astro events (e.g. start 15 min after sunset)
- 🛡 Safe fallback: if astro data can't be determined, the light will not switch (fail-safe)
- 📝 Clear startup log showing the currently active mode and calculated times

## Requirements

- [ioBroker](https://www.iobroker.net/) with the **JavaScript adapter** installed
- A motion sensor state (boolean, e.g. Zigbee presence/occupancy)
- A light switch state (boolean)
- For `auto` mode: correct **longitude/latitude** configured in the ioBroker system settings (System Settings → main configuration), since `getAstroDate()` relies on it

## Installation

1. Open the ioBroker **JavaScript adapter** instance.
2. Create a new script (or import `frontdoor_motion_light.js`).
3. Adjust the configuration section at the top of the script (see below).
4. Save and activate the script.

## Configuration

All settings are located in the `CONFIG` section at the top of the script.

| Variable | Description |
|---|---|
| `lightId` | State ID of the light to switch |
| `motionId` | State ID of the motion sensor |
| `timeoutMinutes` | Minutes to wait after the last motion before turning the light off |
| `nightMode` | `'manual'` or `'auto'` |
| `nightStartHour` / `nightStartMinute` | Night mode start time (manual mode only) |
| `nightEndHour` / `nightEndMinute` | Night mode end time (manual mode only) |
| `astroStartEvent` | Astro event that starts night mode (auto mode only), e.g. `'sunset'` |
| `astroEndEvent` | Astro event that ends night mode (auto mode only), e.g. `'sunrise'` |
| `astroStartOffsetMinutes` | Offset in minutes applied to the start event (positive = later) |
| `astroEndOffsetMinutes` | Offset in minutes applied to the end event (negative = earlier) |

### Example: Auto mode with offset

```js
const nightMode = 'auto';
const astroStartEvent = 'sunset';
const astroEndEvent   = 'sunrise';
const astroStartOffsetMinutes = 15;   // start 15 min after sunset
const astroEndOffsetMinutes   = -15;  // end 15 min before sunrise
```

### Example: Manual mode

```js
const nightMode = 'manual';
const nightStartHour = 20;
const nightStartMinute = 0;
const nightEndHour = 7;
const nightEndMinute = 0;
```

## How it works

1. On every change of the motion state, the script checks whether it is currently night time (based on the selected mode).
2. If it's night and motion is detected, the light is switched on and a timeout timer is started/reset.
3. If no further motion is detected within `timeoutMinutes`, the light is switched off automatically.
4. During daytime, motion events are ignored (light is never switched).

## License

Free to use and modify.

---

This script was created and published free of charge for the open source community. If you find it useful and would like to support future development, consider making a small donation:

```
Bitcoin (BTC): 33AXe8Z8XBuGKx9eHHmGnvbawrNYjSgDcM

Ethereum (ETH): 0xa61d178EA84C2200A8617b51B4bCf98F87ff59Ff

Solana (SOL): BDf5EgsN8fRUicYzeM8cuaNhL7zdty2qsEj2mC2jA4Fm

Ripple (XRP): rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh

Cardano (ADA): addr1q8anur2wvvc6pv3cpp30vv05makyra8huh0lk0yhdk6hcnlrzr27g03klu862usxqsru794d03gzkk8n86ta34n85z0svn5ams   

USTether (USDT): 0xa61d178EA84C2200A8617b51B4bCf98F87ff59Ff

```

Thank you for your support! 🙏
