// =============================================
// LICHT NUR NACHTS – Bewegungsmelder mit Nachlauf
// Nachtzeit: manuell (feste Uhrzeit) ODER auto (Sonnenauf-/-untergang)
// Autor: Speefak
// =============================================

// ==================== EINSTELLUNGEN ====================

const lichtId      = 'zigbee.0.1cc089fffece2c7e.state';
const motionId     = 'zigbee.0.a4c138182ee53c1c.presence'; 

const nachlaufMinuten   = 1;      // ← Nachlaufzeit in Minuten (z.B. 5)

// ---- Nachtmodus-Auswahl ----
// 'manuell' = feste Uhrzeiten (siehe unten)
// 'auto'    = automatisch anhand Sonnenauf-/-untergang (astro)
const nachtModus = 'auto';        // ← 'manuell' oder 'auto'

// ---- Einstellungen für nachtModus = 'manuell' ----
const nachtStartStunde  = 20;     // ← Startzeit Nachtmodus: Stunde
const nachtStartMinute  = 0;      // ← Startzeit Nachtmodus: Minute  (0 = volle Stunde)

const nachtEndStunde    = 7;      // ← Endzeit Nachtmodus: Stunde
const nachtEndMinute    = 0;      // ← Endzeit Nachtmodus: Minute   (0 = volle Stunde)

// ---- Einstellungen für nachtModus = 'auto' ----
// Mögliche Astro-Ereignisse (siehe iobroker astro-Adapter/getAstroDate):
// 'sunrise', 'sunset', 'dawn', 'dusk', 'nauticalDawn', 'nauticalDusk',
// 'nightEnd', 'night', 'goldenHourEnd', 'goldenHour', 'sunriseEnd', 'sunsetStart', 'solarNoon', 'nadir'
const astroStartEreignis = 'sunset';   // ← Ereignis, ab dem Nachtmodus beginnt (Abend)
const astroEndEreignis   = 'sunrise';  // ← Ereignis, ab dem Nachtmodus endet (Morgen)

// Zusätzlicher Versatz in Minuten (positiv = später, negativ = früher)
// z.B. astroStartOffsetMinuten = 15  → Nachtmodus beginnt 15 Min NACH Sonnenuntergang
//      astroEndOffsetMinuten   = -15 → Nachtmodus endet 15 Min VOR Sonnenaufgang
const astroStartOffsetMinuten = 0;
const astroEndOffsetMinuten   = 0;

// =============================================

let timeoutId = null;

// ====================== Hilfsfunktion: Astro-Zeit + Offset ======================
function getAstroZeitMitOffset(ereignis, offsetMinuten) {
    const datum = getAstroDate(ereignis);
    if (!datum) {
        log(`⚠️ Astro-Ereignis "${ereignis}" konnte nicht ermittelt werden – bitte Standort in den Adapter-Einstellungen prüfen.`, 'warn');
        return null;
    }
    return new Date(datum.getTime() + offsetMinuten * 60 * 1000);
}

// ====================== Nacht-Prüfung ======================
function isNight() {
    const now = new Date();

    if (nachtModus === 'auto') {
        const startZeit = getAstroZeitMitOffset(astroStartEreignis, astroStartOffsetMinuten);
        const endZeit   = getAstroZeitMitOffset(astroEndEreignis, astroEndOffsetMinuten);

        if (!startZeit || !endZeit) {
            // Fallback: bei Fehler lieber nicht schalten
            return false;
        }

        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
        const startTimeInMinutes   = startZeit.getHours() * 60 + startZeit.getMinutes();
        const endTimeInMinutes     = endZeit.getHours() * 60 + endZeit.getMinutes();

        // Nacht geht i.d.R. über Mitternacht (Sonnenuntergang abends -> Sonnenaufgang morgens)
        if (startTimeInMinutes < endTimeInMinutes) {
            return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
        } else {
            return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
        }
    }

    // ---- manueller Modus ----
    const currentHour   = now.getHours();
    const currentMinute = now.getMinutes();

    const startTimeInMinutes   = nachtStartStunde * 60 + nachtStartMinute;
    const endTimeInMinutes     = nachtEndStunde   * 60 + nachtEndMinute;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    if (startTimeInMinutes < endTimeInMinutes) {
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    } else {
        return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes;
    }
}

on({id: motionId, change: 'any'}, (obj) => {

    if (obj.state.val !== true) return;     // nur bei Bewegung

    if (!isNight()) {
        return;   // tagsüber ignorieren (kein Log, damit es nicht zu voll wird)
    }

    // Alten Timer löschen
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    setState(lichtId, true);
    log(`🌙 Nacht + Bewegung → Licht AN (${nachlaufMinuten} Min Nachlauf)`);

    // Nachlauf-Timer
    timeoutId = setTimeout(() => {
        setState(lichtId, false);
        log(`✅ ${nachlaufMinuten} Minuten keine Bewegung mehr → Licht AUS`);
        timeoutId = null;
    }, nachlaufMinuten * 60 * 1000);
});

// Start-Info
if (nachtModus === 'auto') {
    const startZeit = getAstroZeitMitOffset(astroStartEreignis, astroStartOffsetMinuten);
    const endZeit   = getAstroZeitMitOffset(astroEndEreignis, astroEndOffsetMinuten);
    const fmt = d => d ? `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` : '??:??';
    log(`✅ Skript gestartet | Modus: AUTO (${astroStartEreignis} → ${astroEndEreignis}) | aktuell: ${fmt(startZeit)} – ${fmt(endZeit)} | Nachlauf: ${nachlaufMinuten} Minuten`);
} else {
    const startZeit = `${nachtStartStunde.toString().padStart(2,'0')}:${nachtStartMinute.toString().padStart(2,'0')}`;
    const endZeit   = `${nachtEndStunde.toString().padStart(2,'0')}:${nachtEndMinute.toString().padStart(2,'0')}`;
    log(`✅ Skript gestartet | Modus: MANUELL | Nachtmodus: ${startZeit} – ${endZeit} | Nachlauf: ${nachlaufMinuten} Minuten`);
}
