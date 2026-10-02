

export function getPrayerTimes(date) {
  const lat = 41.0082 * Math.PI / 180; // Türkiye referans enlemi
  const lon = 28.9784;                 // Türkiye referans boylamı
  const now = date || new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const B = 2 * Math.PI * (dayOfYear - 81) / 365;
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin(B) * Math.PI / 180;
  const timeZone = 3; // Türkiye UTC+3
  const noon = 12 + timeZone - (lon / 15) - (EoT / 60);

  function hourAngle(alt) {
    const cosHA = (Math.sin(alt * Math.PI / 180) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
    if (cosHA > 1) return 0;
    if (cosHA < -1) return Math.PI;
    return Math.acos(cosHA) * 180 / Math.PI / 15;
  }

  const imsakHA = hourAngle(-18);
  const sunriseHA = hourAngle(-0.833);
  const noonAlt = (Math.PI / 2) - Math.abs(lat - decl);
  const asrAlt = Math.atan(1 / (1 + Math.tan(Math.PI / 2 - noonAlt))) * 180 / Math.PI;
  const asrHA = hourAngle(asrAlt);
  const ishaHA = hourAngle(-17);

  return {
    'İmsak': noon - imsakHA,
    'Güneş': noon - sunriseHA,
    'Öğle': noon,
    'İkindi': noon + asrHA,
    'Akşam': noon + sunriseHA,
    'Yatsı': noon + ishaHA
  };
}

export function updatePrayerCountdown() {
  const now = new Date();
  const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const times = getPrayerTimes(now);
  const prayers = [
    { name: 'İmsak', time: times['İmsak'] },
    { name: 'Güneş', time: times['Güneş'] },
    { name: 'Öğle', time: times['Öğle'] },
    { name: 'İkindi', time: times['İkindi'] },
    { name: 'Akşam', time: times['Akşam'] },
    { name: 'Yatsı', time: times['Yatsı'] }
  ];

  let next = prayers.find(p => p.time > currentHours);
  let diffHours = 0;
  if (next) {
    diffHours = next.time - currentHours;
  } else {
    next = prayers[0];
    diffHours = (24 - currentHours) + next.time;
  }

  const totalSecs = Math.floor(diffHours * 3600);
  const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
  const s = String(totalSecs % 60).padStart(2, '0');

  const textEl = document.getElementById('prayerDisplayText');
  if (textEl) {
    textEl.textContent = `${h}:${m}:${s}`;
  }
}
