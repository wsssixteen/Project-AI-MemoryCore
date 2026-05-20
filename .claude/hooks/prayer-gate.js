/**
 * prayer-gate.js — UserPromptSubmit hook
 * Injects prayer time reminders within the configured window.
 *
 * Window rules:
 *   - Normal: 30 min before and 30 min after prayer time
 *   - Friday Zohor (Jumaat): 90 min before
 *
 * Fires once per prayer per direction (before/after) per day.
 * Cache refreshes once per day from e-solat.gov.my.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const projectRoot = path.join(__dirname, '..', '..');
const featurePath = path.join(projectRoot, 'Feature', 'Time-Based-Aware-System');
const cacheFile  = path.join(featurePath, 'prayer-cache.json');
const stateFile  = path.join(featurePath, 'prayer-state.json');
const configFile = path.join(featurePath, 'prayer-config.json');

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getConfig() {
  try {
    if (fs.existsSync(configFile)) return JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (e) {}
  return { zone: 'SGR01', window_minutes: 30, friday_window_minutes: 90 };
}

function readCache() {
  try {
    if (!fs.existsSync(cacheFile)) return null;
    const d = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return d.date === getTodayStr() ? d : null;
  } catch (e) { return null; }
}

function readState() {
  const today = getTodayStr();
  try {
    if (fs.existsSync(stateFile)) {
      const d = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (d.date === today) return d;
    }
  } catch (e) {}
  return { date: today, warned: [], reminded: [] };
}

function saveState(state) {
  try { fs.writeFileSync(stateFile, JSON.stringify(state)); } catch (e) {}
}

function fetchAndCache(zone, cb) {
  try {
    const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const pt = parsed.prayerTime && parsed.prayerTime[0];
          if (pt) {
            const cache = {
              date: getTodayStr(),
              fajr: pt.fajr,
              dhuhr: pt.dhuhr,
              asr: pt.asr,
              maghrib: pt.maghrib,
              isha: pt.isha
            };
            fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
            cb(cache);
          } else {
            cb(null);
          }
        } catch (e) { cb(null); }
      });
    }).on('error', () => cb(null));
  } catch (e) { cb(null); }
}

function timeToMins(timeStr) {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

function checkPrayers(cache, config) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isFriday = now.getDay() === 5;
  const state = readState();

  const W = config.window_minutes || 30;
  const FW = config.friday_window_minutes || 90;

  const prayers = [
    { name: 'Subuh',   time: cache.fajr,    window: W },
    { name: 'Zohor',   time: cache.dhuhr,   window: isFriday ? FW : W },
    { name: 'Asar',    time: cache.asr,     window: W },
    { name: 'Maghrib', time: cache.maghrib, window: W },
    { name: 'Isyak',   time: cache.isha,    window: W },
  ];

  for (const p of prayers) {
    const pMins = timeToMins(p.time);
    const diff = nowMins - pMins; // negative = before, positive = after
    const timeLabel = p.time.substring(0, 5);

    // Before prayer — warning
    if (diff < 0 && Math.abs(diff) <= p.window) {
      if (state.warned.includes(p.name)) continue;
      const remaining = Math.abs(diff);
      const label = (isFriday && p.name === 'Zohor') ? 'Jumaat' : p.name;
      const msg = `⏰ ${label} in ${remaining} min (${timeLabel})`;
      state.warned.push(p.name);
      saveState(state);
      console.log(JSON.stringify({ additionalContext: msg }));
      return;
    }

    // After prayer — reminder (only if not already reminded)
    if (diff >= 0 && diff <= p.window) {
      if (state.reminded.includes(p.name)) continue;
      const msg = `⏰ ${p.name} time — have you prayed? (${timeLabel})`;
      state.reminded.push(p.name);
      saveState(state);
      console.log(JSON.stringify({ additionalContext: msg }));
      return;
    }
  }
  // Nothing to inject — silent pass-through
}

// Main
let inputData = '';
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => inputData += d);
process.stdin.on('end', () => {
  try {
    const config = getConfig();
    const cache = readCache();

    if (cache) {
      checkPrayers(cache, config);
      process.exit(0);
    } else {
      // Cache stale or missing — fetch once, then check
      fetchAndCache(config.zone, (fresh) => {
        if (fresh) checkPrayers(fresh, config);
        process.exit(0);
      });
    }
  } catch (e) {
    process.exit(0); // never block on error
  }
});
