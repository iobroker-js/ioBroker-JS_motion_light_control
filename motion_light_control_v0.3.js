// =============================================
// Script:      Frontdoor Light – Motion Sensor with Timeout
// Description: Turns on the front door light on motion, but only during
//              night time. Night time can be defined either manually
//              (fixed clock times) or automatically (sunset/sunrise
//              based on astro data).
// Version:     0.3
// Author:      Speefak
// Date:        2026-07-05
// Name:        Motion_Light_Control_v0.3
// =============================================

// ==================== CONFIG ====================

const lightId  = 'zigbee.0.1cc089fffece2c7e.state';
const motionId = 'zigbee.0.a4c138182ee53c1c.presence';

const timeoutMinutes = 1;      // ← Timeout in minutes (e.g. 5)

// ---- Night mode selection ----
// 'manual' = fixed clock times (see below)
// 'auto'   = automatic based on sunset/sunrise (astro)
const nightMode = 'auto';      // ← 'manual' or 'auto'

// ---- Settings for nightMode = 'manual' ----
const nightStartHour   = 20;   // ← Night mode start time: hour
const nightStartMinute = 0;    // ← Night mode start time: minute (0 = full hour)

const nightEndHour     = 7;    // ← Night mode end time: hour
const nightEndMinute   = 0;    // ← Night mode end time: minute (0 = full hour)

// ---- Settings for nightMode = 'auto' ----
// Possible astro events (see iobroker astro adapter / getAstroDate):
// 'sunrise', 'sunset', 'dawn', 'dusk', 'nauticalDawn', 'nauticalDusk',
// 'nightEnd', 'night', 'goldenHourEnd', 'goldenHour', 'sunriseEnd', 'sunsetStart', 'solarNoon', 'nadir'
const astroStartEvent = 'sunset';   // ← Event at which night mode starts (evening)
const astroEndEvent   = 'sunrise';  // ← Event at which night mode ends (morning)

// Additional offset in minutes (positive = later, negative = earlier)
// e.g. astroStartOffsetMinutes = 15  → night mode starts 15 min AFTER sunset
//      astroEndOffsetMinutes   = -15 → night mode ends 15 min BEFORE sunrise
const astroStartOffsetMinutes = 0;
const astroEndOffsetMinutes   = 0;

// =============================================

let timeoutId = null;

// ====================== Helper: astro time + offset ======================
function getAstroTimeWithOffset(event, offsetMinutes) {
    const date = getAstroDate(event);
    if (!date) {
        log(`⚠️ Astro event "${event}" could not be determined – please check the location in the adapter settings.`, 'warn');
        return null;
    }
    return new Date(date.getTime() + offsetMinutes * 60 * 1000);
}

// ====================== Night check ======================
function isNight() {
    const now = new Date();

    if (nightMode === 'auto') {
        const startTime = getAstroTimeWithOffset(astroStartEvent, astroStartOffsetMinutes);
        const endTime   = getAstroTimeWithOffset(astroEndEvent, astroEndOffsetMinutes);

        if (!startTime || !endTime) {
            // Fallback: don't switch on error
            return false;
        }

        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const startTimeInMinutes   = startTime.getHours() * 60 + startTime.getMinutes();
        const endTimeInMinutes     = endTime.getHours() * 60 + endTime.getMinutes();

        // Night usually spans midnight (sunset in the evening -> sunrise in the morning)
        if (startTimeInMinutes < endTimeInMinutes) {
            return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        } else {
            return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
        }
    }

    // ---- manual mode ----
    const currentHour   = now.getHours();
    const currentMinute = now.getMinutes();

    const startTimeInMinutes   = nightStartHour * 60 + nightStartMinute;
    const endTimeInMinutes     = nightEndHour   * 60 + nightEndMinute;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    if (startTimeInMinutes < endTimeInMinutes) {
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    } else {
        return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
    }
}

on({id: motionId, change: 'any'}, (obj) => {

    if (obj.state.val !== true) return;     // motion only

    if (!isNight()) {
        return;   // ignore during daytime (no log to avoid clutter)
    }

    // Clear old timer
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    setState(lightId, true);
    log(`🌙 Night + motion → light ON (${timeoutMinutes} min timeout)`);

    // Timeout timer
    timeoutId = setTimeout(() => {
        setState(lightId, false);
        log(`✅ No motion for ${timeoutMinutes} minutes → light OFF`);
        timeoutId = null;
    }, timeoutMinutes * 60 * 1000);
});

// Startup info
if (nightMode === 'auto') {
    const startTime = getAstroTimeWithOffset(astroStartEvent, astroStartOffsetMinutes);
    const endTime   = getAstroTimeWithOffset(astroEndEvent, astroEndOffsetMinutes);
    const fmt = d => d ? `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` : '??:??';
    log(`✅ Script started | Mode: AUTO (${astroStartEvent} → ${astroEndEvent}) | current: ${fmt(startTime)} – ${fmt(endTime)} | Timeout: ${timeoutMinutes} minutes`);
} else {
    const startTime = `${nightStartHour.toString().padStart(2,'0')}:${nightStartMinute.toString().padStart(2,'0')}`;
    const endTime   = `${nightEndHour.toString().padStart(2,'0')}:${nightEndMinute.toString().padStart(2,'0')}`;
    log(`✅ Script started | Mode: MANUAL | Night mode: ${startTime} – ${endTime} | Timeout: ${timeoutMinutes} minutes`);
}
