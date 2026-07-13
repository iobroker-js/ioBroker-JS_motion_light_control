// =============================================
// LICHT NUR NACHTS – Bewegungsmelder mit Nachlauf
// Variablen mit Minuten (einfach anpassbar)
// =============================================

// ==================== EINSTELLUNGEN ====================

const lichtId      = 'zigbee.0.1cc089fffece2c7e.state';
const motionId     = 'zigbee.0.a4c138182ee53c1c.presence';   // Falls nötig auf .occupancy ändern

const nachlaufMinuten   = 1;      // ← Nachlaufzeit in Minuten (z.B. 5)

const nachtStartStunde  = 20;     // ← Startzeit Nachtmodus: Stunde
const nachtStartMinute  = 0;      // ← Startzeit Nachtmodus: Minute  (0 = volle Stunde)

const nachtEndStunde    = 7;      // ← Endzeit Nachtmodus: Stunde
const nachtEndMinute    = 0;      // ← Endzeit Nachtmodus: Minute   (0 = volle Stunde)

// =============================================

let timeoutId = null;

// ====================== Nacht-Prüfung (genau mit Minuten) ======================
function isNight() {
    const now = new Date();
    const currentHour   = now.getHours();
    const currentMinute = now.getMinutes();

    // Berechne Start- und Endzeit in Minuten seit Mitternacht
    const startTimeInMinutes = nachtStartStunde * 60 + nachtStartMinute;
    const endTimeInMinutes   = nachtEndStunde   * 60 + nachtEndMinute;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Nachtzeit über Mitternacht (z.B. 18:00 bis 07:00)
    if (startTimeInMinutes < endTimeInMinutes) {
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
    } else {
        // Über Mitternacht (z.B. 18:00 bis 07:00)
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
const startZeit = `${nachtStartStunde.toString().padStart(2,'0')}:${nachtStartMinute.toString().padStart(2,'0')}`;
const endZeit   = `${nachtEndStunde.toString().padStart(2,'0')}:${nachtEndMinute.toString().padStart(2,'0')}`;

log(`✅ Skript gestartet | Nachtmodus: ${startZeit} – ${endZeit} | Nachlauf: ${nachlaufMinuten} Minuten`);
