import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {"apiKey": "AIzaSyCMnrduDRpUjhFw5XxMdrR4uvHa14OrAnM", "authDomain": "avoriashalyh.firebaseapp.com", "projectId": "avoriashalyh", "storageBucket": "avoriashalyh.firebasestorage.app", "messagingSenderId": "77862184527", "appId": "1:77862184527:web:070b9514c322df959c6c3a", "measurementId": "G-RP38CK8YNT"};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const weekDays = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];

const START_YEAR = 2025;
const END_YEAR = 2030;

let months = [];
for(let y=START_YEAR;y<=END_YEAR;y++){
  for(let m=0;m<12;m++){
    months.push({year:y, month:m});
  }
}

const now = new Date();
let currentIndex = months.findIndex(x=> x.year===now.getFullYear() && x.month===now.getMonth());
if(currentIndex===-1){
  currentIndex = 0;
}

const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const calendarDiv = document.getElementById('calendar');

function populateSelectors(selMonth, selYear){
  monthSelect.innerHTML = '';
  yearSelect.innerHTML = '';
  const years = Array.from(new Set(months.map(m=>m.year)));
  years.forEach(y=>{
    const opt = document.createElement('option');
    opt.value = y; opt.text = y;
    if(y===selYear) opt.selected = true;
    yearSelect.appendChild(opt);
  });
  monthNames.forEach((mn, idx)=>{
    const opt = document.createElement('option');
    opt.value = idx; opt.text = mn;
    if(idx===selMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });
}

function monthDocId(year, month){ const mm = String(month+1).padStart(2,'0'); return `${year}-${mm}`; }

async function ensureMonthDocAll(){
  const idx = currentIndex;
  if(idx < 0 || idx >= months.length) return;
  const it = months[idx];
  const id = monthDocId(it.year, it.month);
  const ref = doc(db, 'bookings', id);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    const lastDay = new Date(it.year, it.month+1, 0).getDate();
    const payload = {};
    for(let d=1; d<=lastDay; d++){
      payload[d] = { 'صباحي': false, 'مسائي': false };
    }
    await setDoc(ref, payload);
  }
}

async function renderMonth(index){
  const {year, month} = months[index];
  monthSelect.value = month;
  yearSelect.value = year;
  calendarDiv.innerHTML = '';
  const lastDay = new Date(year, month+1, 0).getDate();
  for(let d=1; d<=lastDay; d++){
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    const dateLine = document.createElement('div');
    dateLine.className = 'date-line';
    const dayName = weekDays[new Date(year, month, d).getDay()];
    dateLine.innerText = `${dayName} ${d} - ${monthNames[month]}`;
    dayDiv.appendChild(dateLine);
    ['صباحي','مسائي'].forEach(slot=>{
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot available';
      slotDiv.dataset.day = d;
      slotDiv.dataset.slot = slot;
      slotDiv.innerText = slot;
      dayDiv.appendChild(slotDiv);
    });
    calendarDiv.appendChild(dayDiv);
  }
  const ref = doc(db, 'bookings', monthDocId(year, month));
  onSnapshot(ref, (snap)=>{
    if(!snap.exists()) return;
    const data = snap.data();
    document.querySelectorAll('#calendar .slot').forEach(el=>{ el.classList.remove('booked'); el.classList.add('available'); });
    for(const [day, slots] of Object.entries(data || {})){
      for(const [sname, val] of Object.entries(slots || {})){
        const selector = `#calendar .slot[data-day="${day}"][data-slot="${sname}"]`;
        const el = document.querySelector(selector);
        if(el){
          if(val) { el.classList.remove('available'); el.classList.add('booked'); }
          else { el.classList.remove('booked'); el.classList.add('available'); }
        }
      }
    }
  });
}

prevBtn.onclick = ()=>{ if(currentIndex>0) { currentIndex--; renderMonth(currentIndex); } };
nextBtn.onclick = ()=>{ if(currentIndex<months.length-1){ currentIndex++; renderMonth(currentIndex); } };
monthSelect.onchange = ()=>{ const m = parseInt(monthSelect.value,10); const y = parseInt(yearSelect.value,10); const idx = months.findIndex(x=>x.year===y && x.month===m); if(idx!==-1){ currentIndex = idx; renderMonth(currentIndex); } };
yearSelect.onchange = ()=>{ monthSelect.onchange(); };

(async ()=>{
  populateSelectors(months[currentIndex].month, months[currentIndex].year);
  renderMonth(currentIndex);
  ensureMonthDocAll();
})();
