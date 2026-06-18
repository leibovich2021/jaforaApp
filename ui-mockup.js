// UI Mockup — demo flow only, no real API calls

const screens = {
  home: document.getElementById('screen-home'),
  loading: document.getElementById('screen-loading'),
  review: document.getElementById('screen-review'),
  report: document.getElementById('screen-report'),
};

const photoInput = document.getElementById('photo-input');

const steps = document.querySelectorAll('.step');
let managerName = 'לוזיק';
let managerPhone = '972501234567';

function showScreen(name, stepNum) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');

  steps.forEach((step, i) => {
    step.classList.remove('active', 'done');
    if (i + 1 < stepNum) step.classList.add('done');
    if (i + 1 === stepNum) step.classList.add('active');
  });
}

function parseNum(text) {
  return Number(String(text).replace(/,/g, '')) || 0;
}

function calcAvg(total, trucks) {
  if (trucks <= 0) return 0;
  return total / trucks;
}

function formatAvgBoxes(n) {
  return Math.round(n).toLocaleString('he-IL');
}

function formatAvgPoints(n) {
  return n.toLocaleString('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function updateReviewAvgs() {
  const bashBoxes = parseNum(document.getElementById('val-bash-boxes').textContent);
  const bashPoints = parseNum(document.getElementById('val-bash-points').textContent);
  const bashTrucks = parseNum(document.getElementById('val-bash-trucks').textContent);
  const tzraBoxes = parseNum(document.getElementById('val-tzra-boxes').textContent);
  const tzraPoints = parseNum(document.getElementById('val-tzra-points').textContent);
  const tzraTrucks = parseNum(document.getElementById('val-tzra-trucks').textContent);

  document.getElementById('val-bash-avg-boxes').textContent = formatAvgBoxes(calcAvg(bashBoxes, bashTrucks));
  document.getElementById('val-bash-avg-points').textContent = formatAvgPoints(calcAvg(bashPoints, bashTrucks));
  document.getElementById('val-tzra-avg-boxes').textContent = formatAvgBoxes(calcAvg(tzraBoxes, tzraTrucks));
  document.getElementById('val-tzra-avg-points').textContent = formatAvgPoints(calcAvg(tzraPoints, tzraTrucks));
}

function getReportDate() {
  const badge = document.querySelector('.date-badge');
  if (!badge) return new Date().toLocaleDateString('he-IL');
  return badge.textContent.replace('📅 ', '').split(' · ')[0].trim();
}

function buildTruckNotes() {
  const eilat = +document.getElementById('tr-eilat').value || 0;
  const bashTzra = +document.getElementById('tr-bash-tzra').value || 0;
  const tzraBeerot = +document.getElementById('tr-tzra-beerot').value || 0;
  const beerotTzra = +document.getElementById('tr-beerot-tzra').value || 0;

  const bashNote = `(${eilat} משאיות לאילת ו-${bashTzra} משאיות לסניף צרעה)`;
  const tzraNote = `(${tzraBeerot} משאיות לבארות יצחק, ${beerotTzra} משאיות מבארות יצחק)`;

  return { bashNote, tzraNote, eilat, bashTzra, tzraBeerot, beerotTzra };
}

function updateNotesPreview() {
  const { bashNote, tzraNote } = buildTruckNotes();
  const bashTrucks = document.getElementById('val-bash-trucks').textContent;
  const tzraTrucks = document.getElementById('val-tzra-trucks').textContent;

  document.getElementById('notes-preview').innerHTML =
    `<strong>באר שבע:</strong> ${bashTrucks} משאיות ${bashNote}<br>` +
    `<strong>צרעה:</strong> ${tzraTrucks} משאיות ${tzraNote}`;
}

function buildReport() {
  const { bashNote, tzraNote } = buildTruckNotes();
  const date = getReportDate();
  const separator = '━━━━━━━━━━━━━━━━━━━━━━';

  return `שלום ${managerName} דוח נתונים

נתונים לתאריך ${date}

סניף באר שבע
${document.getElementById('val-bash-boxes').textContent} תיבות
${document.getElementById('val-bash-points').textContent} נקודות
${document.getElementById('val-bash-trucks').textContent} משאיות ${bashNote}
ממוצע לנהג
${document.getElementById('val-bash-avg-boxes').textContent} תיבות
${document.getElementById('val-bash-avg-points').textContent} נקודות

${separator}

נתונים לתאריך ${date}

סניף צרעה
${document.getElementById('val-tzra-boxes').textContent} תיבות
${document.getElementById('val-tzra-points').textContent} נקודות
${document.getElementById('val-tzra-trucks').textContent} משאיות ${tzraNote}
ממוצע לנהג
${document.getElementById('val-tzra-avg-boxes').textContent} תיבות
${document.getElementById('val-tzra-avg-points').textContent} נקודות`;
}

function updateRecipientUI() {
  document.getElementById('recipient-name').textContent = managerName;
  document.getElementById('btn-whatsapp').innerHTML =
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    שלח ל${managerName} בוואטסאפ`;
}

function processPhoto(file) {
  if (!file) return;

  showScreen('loading', 2);

  // In real app: send file to Gemini API here
  setTimeout(() => {
    showScreen('review', 2);
    updateReviewAvgs();
    updateNotesPreview();
  }, 1800);
}

// Capture — opens camera on mobile
document.getElementById('btn-capture').addEventListener('click', () => {
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processPhoto(file);
});

document.getElementById('btn-retake').addEventListener('click', () => {
  photoInput.click();
});

document.getElementById('btn-generate').addEventListener('click', () => {
  document.getElementById('report-text').textContent = buildReport();
  updateRecipientUI();
  showScreen('report', 3);
});

document.getElementById('btn-back-review').addEventListener('click', () => showScreen('review', 2));
document.getElementById('btn-new-report').addEventListener('click', () => {
  photoInput.value = '';
  showScreen('home', 1);
});

// Transfer inputs — live preview
['tr-bash-tzra', 'tr-tzra-beerot', 'tr-beerot-tzra', 'tr-eilat'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateNotesPreview);
});

// WhatsApp (demo — shows alert in prototype)
document.getElementById('btn-whatsapp').addEventListener('click', () => {
  const text = encodeURIComponent(document.getElementById('report-text').textContent);
  alert(`באפליקציה האמיתית:\n\nייפתח וואטסאפ ל-${managerName}\n(${managerPhone})\n\nעם הדוח מוכן לשליחה`);
  // In real app: window.open(`https://wa.me/${managerPhone}?text=${text}`);
});

document.getElementById('change-recipient').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.remove('hidden');
});

// Settings
document.getElementById('open-settings').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.remove('hidden');
});

document.getElementById('close-settings').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.add('hidden');
});

document.getElementById('save-settings').addEventListener('click', () => {
  managerName = document.getElementById('setting-name').value || 'לוזיק';
  managerPhone = document.getElementById('setting-phone').value || '972501234567';
  updateRecipientUI();
  document.getElementById('settings-overlay').classList.add('hidden');
});

document.getElementById('settings-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'settings-overlay') {
    document.getElementById('settings-overlay').classList.add('hidden');
  }
});

// Init
updateReviewAvgs();
updateNotesPreview();
updateRecipientUI();
