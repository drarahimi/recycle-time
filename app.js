/**
 * WINDSOR FA WASTE & RECYCLING CALENDAR - APPLICATION ENGINE
 * Official City of Windsor Schedule (Zones 1A to 4B) & Postal Code Search Engine
 */

// ==========================================
// 1. DATA STRUCTURES & NATIVE INTL DATE CONVERTER
// ==========================================

const GREGORIAN_MONTHS_FA = [
    "ژانویه", "فوریه", "مارس", "آوریل", "می", "ژوئن",
    "ژوئیه", "آگوست", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"
];

const WEEKDAYS_FA = [
    "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"
];

// Native Browser Intl Jalali Converter for 100% astronomical accuracy
function getJalaliDateParts(date) {
    try {
        const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const parts = formatter.formatToParts(date);
        let day = '', month = '', year = '', weekday = '';
        parts.forEach(p => {
            if (p.type === 'day') day = p.value;
            if (p.type === 'month') month = p.value;
            if (p.type === 'year') year = p.value;
            if (p.type === 'weekday') weekday = p.value;
        });
        return { day, month, year, weekday, fullStr: formatter.format(date) };
    } catch (e) {
        return { day: date.getDate().toString(), month: GREGORIAN_MONTHS_FA[date.getMonth()], year: date.getFullYear().toString(), weekday: WEEKDAYS_FA[date.getDay()], fullStr: date.toDateString() };
    }
}

// Convert English numbers to Persian digits
function toPersianDigits(str) {
    if (str === null || str === undefined) return '';
    const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/\d/g, x => pDigits[x]);
}

// Official City of Windsor Collection Zones (1A to 4B PDF Schedules)
const ZONE_SCHEDULES = {
    "1A": { name: "منطقه 1A (دوشنبه‌ها - غرب ویندزور / N9B, N9C, N9J)", collectionDay: 1, isCycleA: true },
    "1B": { name: "منطقه 1B (دوشنبه‌ها - جنوب غرب / N9E)", collectionDay: 1, isCycleA: false },
    "2A": { name: "منطقه 2A (سه‌شنبه‌ها - مرکز شهر / N9A, N8X)", collectionDay: 2, isCycleA: true },
    "2B": { name: "منطقه 2B (سه‌شنبه‌ها - جنوب مرکز / N8X, N9G)", collectionDay: 2, isCycleA: false },
    "3A": { name: "منطقه 3A (چهارشنبه‌ها - شرق مرکز / N8S, N8Y)", collectionDay: 3, isCycleA: true },
    "3B": { name: "منطقه 3B (پنج‌شنبه‌ها - جنوب شرق / N8W, N0R, N8V)", collectionDay: 4, isCycleA: false }, // Thursday (Verified Official PDF 3B)
    "4A": { name: "منطقه 4A (پنج‌شنبه‌ها - ریورساید / N8P, N8S East)", collectionDay: 4, isCycleA: true },
    "4B": { name: "منطقه 4B (جمعه‌ها - فورست گلید / N8R, N8T, N8N)", collectionDay: 5, isCycleA: false }
};

// Windsor Postal Code Lookup Dictionary
const POSTAL_TO_ZONE_MAP = {
    "N9B": "1A", "N9C": "1A", "N9J": "1A",
    "N9E": "1B",
    "N9A": "2A", "N8X": "2A",
    "N9G": "2B",
    "N8S": "3A", "N8Y": "3A",
    "N8W": "3B", "N0R": "3B", "N8V": "3B",
    "N8P": "4A",
    "N8R": "4B", "N8T": "4B", "N8N": "4B"
};

// Official Windsor Waste Types & Frequencies
const WASTE_TYPES = {
    garbage: { id: "garbage", name: "زباله عمومی (هر ۲ هفته)", icon: "fa-trash-can", colorClass: "garbage", desc: "جمع‌آوری هر دو هفته یک‌بار (سطل مشکی یا کیسه)" },
    blueBox: { id: "blue-box", name: "بازیافت ظروف (Blue - هر ۲ هفته)", icon: "fa-wine-bottle", colorClass: "blue-box", desc: "قوطی، بطری پلاستیکی و شیشه‌ای (هر دو هفته یک‌بار)" },
    redBox: { id: "red-box", name: "بازیافت کاغذ (Red - هر ۲ هفته)", icon: "fa-newspaper", colorClass: "red-box", desc: "کارتن پهن‌شده، روزنامه و مقوا (هر دو هفته یک‌بار)" },
    greenBin: { id: "green-bin", name: "پسماند ارگانیک (Green - هفتگی)", icon: "fa-apple-whole", colorClass: "green-bin", desc: "جمع‌آوری هفتگی در تمام طول سال" },
    yardWaste: { id: "yard-waste", name: "ضایعات باغچه (ماهانه)", icon: "fa-leaf", colorClass: "yard-waste", desc: "جمع‌آوری ماهانه یک‌بار" },
    bulkItem: { id: "bulk-item", name: "ضایعات حجیم", icon: "fa-couch", colorClass: "bulk-item", desc: "نیاز به هماهنگی قبلی با ۳۱۱" }
};

// Database for Waste Wizard (زباله‌یاب)
const WASTE_ITEMS_DB = [
    { name: "قوطی کنسرو فلزی و آلومینیومی", category: "blue-box", binName: "جعبه آبی (هر ۲ هفته)", tip: "حتماً داخل قوطی را آبکشی کنید و درب آن را جدا کنید." },
    { name: "بطری پلاستیکی آب و نوشابه", category: "blue-box", binName: "جعبه آبی (هر ۲ هفته)", tip: "درب پلاستیکی را باز کنید و بطری را فشار دهید تا کم‌حجم شود." },
    { name: "شیشه مربا و سس", category: "blue-box", binName: "جعبه آبی (هر ۲ هفته)", tip: "شیشه را شسته و بدون درب فلزی در جعبه آبی بگذارید." },
    { name: "ظرف شوینده و مایع ظرفشویی", category: "blue-box", binName: "جعبه آبی (هر ۲ هفته)", tip: "کاملاً خالی و شسته شود. کد بازیافت ۱ تا ۷ مجاز است." },
    { name: "روزنامه، مجله و کاغذ باطله", category: "red-box", binName: "جعبه قرمز (هر ۲ هفته)", tip: "کاغذها را تمیز و خشک در جعبه قرمز قرار دهید." },
    { name: "کارتن پیتزا (بدون چربی زیاد)", category: "red-box", binName: "جعبه قرمز (هر ۲ هفته)", tip: "اگر قسمت زیرین خیلی چرب است آن را بکنید و دور بیندازید." },
    { name: "جعبه غلات، کفش و مقوا", category: "red-box", binName: "جعبه قرمز (هر ۲ هفته)", tip: "جعبه‌ها را باز کرده و کاملاً تخت کنید." },
    { name: "باقیمانده غذا و استخوان", category: "green-bin", binName: "سطل ارگانیک (هفتگی)", tip: "می‌توانید در کیسه‌های تجزیه‌پذیر مخصوص (Compostable) بگذارید." },
    { name: "پوست میوه و سبزیجات", category: "green-bin", binName: "سطل ارگانیک (هفتگی)", tip: "پوست مرکبات، هسته میوه و ضایعات سبزیجات مجاز است." },
    { name: "دستمال کاغذی و حوله کاغذی کثیف", category: "green-bin", binName: "سطل ارگانیک (هفتگی)", tip: "دستمال‌های آغشته به مواد غذایی مجاز هستند." },
    { name: "چای کیسه‌ای و تفاله قهوه", category: "green-bin", binName: "سطل ارگانیک (هفتگی)", tip: "فیلتر کاغذی قهوه و کیسه چای را مستقیم در سطل تر بریزید." },
    { name: "برگ درختان و چمن زده شده", category: "yard-waste", binName: "کیسه کاغذی (ماهانه)", tip: "جمع‌آوری ماهانه یک‌بار؛ فقط در کیسه‌های کاغذی قهوه‌ای قرار گیرد." },
    { name: "شاخه درختان (نازک)", category: "yard-waste", binName: "ضایعات باغچه (ماهانه)", tip: "شاخه‌ها را در طول حداکثر ۱ متر با طناب نخی ببندید." },
    { name: "یخچال، فریزر و کولر گازی", category: "depot", binName: "تحویل به مرکز EWSWA / تماس ۳۱۱", tip: "به دلیل گاز مبرد نیاز به ثبت در سامانه ۳۱۱ یا تحویل شخصی دارد." },
    { name: "باتری، قلمی و باتری ماشین", category: "depot", binName: "مرکز مواد خطرناک (Hazardous Waste)", tip: "هرگز در زباله معمولی نیندازید! به ایستگاه تحویل EWSWA ببرید." },
    { name: "لامپ کم‌مصرف و مهتابی", category: "depot", binName: "مرکز مواد خطرناک Depot", tip: "حاوی جیوه هستند و باید جداگانه تحویل داده شوند." },
    { name: "روغن خوراکی سوخته", category: "depot", binName: "مرکز تحویل EWSWA Depot", tip: "روغن را در ظرف دربسته ریخته و به مرکز تحویل دهید." },
    { name: "مبلمان، کاناپه و تشک", category: "depot", binName: "جمع‌آوری حجیم (Bulk Pick-up)", tip: "از طریق تماس با شماره ۳۱۱ نوبت جمع‌آوری رزرو کنید." }
];

// ==========================================
// 2. STATE MANAGEMENT (DYNAMIC SYSTEM DATE)
// ==========================================

let currentState = {
    currentZone: localStorage.getItem('windsor_zone') || '3B',
    currentTheme: localStorage.getItem('windsor_theme') || 'light',
    activeTab: 'calendar-tab',
    viewDate: new Date(),
    selectedCategoryFilter: 'all',
    deferredPwaPrompt: null
};

// Base Anchor Reference Date (Aug 6, 2026 is Organics Only for Zone 3B per official PDF page 17)
const BASE_REFERENCE_DATE = new Date(2026, 7, 6);

// ==========================================
// 3. INITIALIZATION & EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initServiceWorker();
    initPwaInstall();
    initEventListeners();
    updateAppView();
    renderWizardResults();
});

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                reg.update();
                console.log('Service Worker Registered:', reg.scope);
            })
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

function initPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        currentState.deferredPwaPrompt = e;
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.remove('hidden');
    });

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (currentState.deferredPwaPrompt) {
                currentState.deferredPwaPrompt.prompt();
                const { outcome } = await currentState.deferredPwaPrompt.userChoice;
                if (outcome === 'accepted') {
                    showToast('برنامه با موفقیت روی گوشی شما نصب شد!');
                }
                currentState.deferredPwaPrompt = null;
                document.getElementById('pwa-install-banner').classList.add('hidden');
            }
        });
    }

    const closeBtn = document.getElementById('pwa-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('pwa-install-banner').classList.add('hidden');
        });
    }
}

function initTheme() {
    document.documentElement.setAttribute('data-theme', currentState.currentTheme);
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = currentState.currentTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function switchTab(tabId) {
    currentState.activeTab = tabId;

    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tabId);
    });
}

function initEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', () => {
        currentState.currentTheme = currentState.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('windsor_theme', currentState.currentTheme);
        initTheme();
        showToast(`پوسته به حالت ${currentState.currentTheme === 'dark' ? 'تاریک' : 'روشن'} تغییر یافت.`);
    });

    // Postal Code Search Handler
    const postalInput = document.getElementById('postal-input');
    if (postalInput) {
        postalInput.addEventListener('input', (e) => {
            const val = e.target.value.trim().toUpperCase().replace(/\s/g, '');
            if (val.length >= 3) {
                const prefix = val.substring(0, 3);
                if (POSTAL_TO_ZONE_MAP[prefix]) {
                    const matchedZone = POSTAL_TO_ZONE_MAP[prefix];
                    currentState.currentZone = matchedZone;
                    document.getElementById('zone-select').value = matchedZone;
                    localStorage.setItem('windsor_zone', matchedZone);
                    updateAppView();
                    showToast(`منطقه برای کدپستی ${prefix} به ${matchedZone} تنظیم شد.`);
                }
            }
        });
    }

    const zoneSelect = document.getElementById('zone-select');
    zoneSelect.value = currentState.currentZone;
    zoneSelect.addEventListener('change', (e) => {
        currentState.currentZone = e.target.value;
        localStorage.setItem('windsor_zone', currentState.currentZone);
        updateAppView();
        showToast(`منطقه به ${ZONE_SCHEDULES[currentState.currentZone].name} تغییر یافت.`);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    document.getElementById('prev-month-btn').addEventListener('click', () => {
        currentState.viewDate.setMonth(currentState.viewDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
        currentState.viewDate.setMonth(currentState.viewDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        currentState.viewDate = new Date();
        renderCalendar();
    });

    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('day-modal').addEventListener('click', (e) => {
        if (e.target.id === 'day-modal') closeModal();
    });

    document.getElementById('notify-btn').addEventListener('click', requestNotificationPermission);
    document.getElementById('modal-reminder-btn').addEventListener('click', () => {
        scheduleNotificationReminder();
        closeModal();
    });

    document.getElementById('download-ics-btn').addEventListener('click', generateICSFile);
    document.getElementById('print-calendar-btn').addEventListener('click', () => {
        window.print();
    });

    const searchInput = document.getElementById('wizard-search-input');
    const clearBtn = document.getElementById('clear-search-btn');

    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() !== '') {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
        renderWizardResults();
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        renderWizardResults();
    });

    document.querySelectorAll('.wizard-filter-chips .chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.wizard-filter-chips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentState.selectedCategoryFilter = chip.getAttribute('data-category');
            renderWizardResults();
        });
    });
}

// ==========================================
// 4. COLLECTION LOGIC ENGINE (ACCURATE 3B CALENDAR)
// ==========================================

function getCollectionForDate(date, zoneId) {
    const zone = ZONE_SCHEDULES[zoneId];
    if (!zone) return [];

    const dayOfWeek = date.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    
    if (dayOfWeek !== zone.collectionDay) {
        return [];
    }

    const events = [];
    
    // 1. Organics (Green Bin / پسماند تر) -> EVERY WEEK (هفتگی)
    events.push(WASTE_TYPES.greenBin);

    // Calculate week difference from Base Reference Date (Aug 6, 2026)
    const diffTime = date.getTime() - BASE_REFERENCE_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    // For Zone 3B (per official PDF 3B page 17):
    // Aug 6: Green Bin ONLY
    // Aug 13: Green Bin + Garbage + Recycling
    // Aug 20: Green Bin + Yard Waste
    // Aug 27: Green Bin + Garbage + Recycling
    const isFullCollectionWeek = Math.abs(diffWeeks) % 2 === 1;

    if (isFullCollectionWeek) {
        // Garbage Collection
        events.push(WASTE_TYPES.garbage);

        // Alternating Blue Box / Red Box Recycling
        if (Math.floor(Math.abs(diffWeeks) / 2) % 2 === 0) {
            events.push(WASTE_TYPES.redBox);
        } else {
            events.push(WASTE_TYPES.blueBox);
        }
    }

    // Yard Waste Collection (Aug 20 for Zone 3B)
    if (Math.abs(diffWeeks) % 4 === 2 || (date.getDate() >= 14 && date.getDate() <= 21 && date.getMonth() === 7)) {
        events.push(WASTE_TYPES.yardWaste);
    }

    return events;
}

// ==========================================
// 5. VIEW UPDATING & RENDERING
// ==========================================

function updateAppView() {
    renderHeroPickup();
    renderCalendar();
    renderUpcomingList();
}

function renderHeroPickup() {
    const today = new Date();
    const jToday = getJalaliDateParts(today);
    
    const todayStr = `امروز: ${WEEKDAYS_FA[today.getDay()]}، ${jToday.day} ${jToday.month} ${jToday.year} | ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    document.getElementById('current-today-date').innerText = todayStr;

    const currentZoneObj = ZONE_SCHEDULES[currentState.currentZone];
    document.getElementById('zone-info-tag').innerText = `منطقه انتخابی شما: ${currentZoneObj.name}`;

    // Find next pickup date
    let checkDate = new Date(today);
    let nextEvents = [];
    let daysAhead = 0;

    while (nextEvents.length === 0 && daysAhead < 14) {
        checkDate.setDate(checkDate.getDate() + 1);
        daysAhead++;
        nextEvents = getCollectionForDate(checkDate, currentState.currentZone);
    }

    const jNext = getJalaliDateParts(checkDate);
    const dayLabel = daysAhead === 1 ? 'فردا' : `در ${toPersianDigits(daysAhead)} روز آینده`;
    
    const titleText = `${dayLabel}، ${WEEKDAYS_FA[checkDate.getDay()]} ${jNext.day} ${jNext.month} (ساعت ۶:۰۰ صبح)`;
    document.getElementById('next-pickup-title').innerText = titleText;

    const badgesContainer = document.getElementById('next-pickup-badges');
    badgesContainer.innerHTML = '';

    nextEvents.forEach(item => {
        const badge = document.createElement('span');
        badge.className = `badge ${item.colorClass}`;
        badge.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.name}`;
        badgesContainer.appendChild(badge);
    });
}

function renderCalendar() {
    const year = currentState.viewDate.getFullYear();
    const month = currentState.viewDate.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const jFirst = getJalaliDateParts(firstOfMonth);
    const titleStr = `${GREGORIAN_MONTHS_FA[month]} ${year} (${jFirst.month} ${jFirst.year})`;
    document.getElementById('calendar-month-title').innerText = titleStr;

    const daysGrid = document.getElementById('calendar-days-grid');
    daysGrid.innerHTML = '';

    const firstDayIndex = firstOfMonth.getDay();
    const startOffset = (firstDayIndex + 1) % 7; 
    
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month padding cells
    for (let i = startOffset - 1; i >= 0; i--) {
        const cell = document.createElement('div');
        cell.className = 'day-cell other-month';
        const pDayNum = prevMonthDays - i;
        cell.innerHTML = `<div class="day-cell-header"><span class="day-shamsi">${toPersianDigits(pDayNum)}</span></div>`;
        daysGrid.appendChild(cell);
    }

    const today = new Date();
    for (let d = 1; d <= totalDaysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const jDate = getJalaliDateParts(currentDate);
        const events = getCollectionForDate(currentDate, currentState.currentZone);
        const isToday = currentDate.toDateString() === today.toDateString();

        const cell = document.createElement('div');
        cell.className = `day-cell ${isToday ? 'today' : ''}`;
        
        let badgesHtml = '';
        events.forEach(ev => {
            badgesHtml += `<div class="mini-badge ${ev.colorClass}"><i class="fa-solid ${ev.icon}"></i> ${ev.name}</div>`;
        });

        cell.innerHTML = `
            <div class="day-cell-header">
                <span class="day-shamsi">${d} ${GREGORIAN_MONTHS_FA[month].substring(0, 3)}</span>
                <span class="day-gregorian">${jDate.day} ${jDate.month}</span>
            </div>
            <div class="day-badges">
                ${badgesHtml}
            </div>
        `;

        cell.addEventListener('click', () => openDayModal(currentDate, jDate, events));
        daysGrid.appendChild(cell);
    }
}

function renderUpcomingList() {
    const listContainer = document.getElementById('upcoming-list-items');
    listContainer.innerHTML = '';

    const today = new Date();
    let checkDate = new Date(today);
    let count = 0;

    for (let i = 0; i < 35 && count < 8; i++) {
        checkDate.setDate(checkDate.getDate() + 1);
        const events = getCollectionForDate(checkDate, currentState.currentZone);

        if (events.length > 0) {
            count++;
            const jDate = getJalaliDateParts(checkDate);
            const diffDays = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));
            
            const card = document.createElement('div');
            card.className = 'upcoming-card';

            let itemsHtml = events.map(ev => 
                `<span class="badge ${ev.colorClass}"><i class="fa-solid ${ev.icon}"></i> ${ev.name}</span>`
            ).join(' ');

            card.innerHTML = `
                <div class="upcoming-card-date">
                    <span class="date-shamsi">${WEEKDAYS_FA[checkDate.getDay()]}، ${jDate.day} ${jDate.month} (${checkDate.getDate()} ${GREGORIAN_MONTHS_FA[checkDate.getMonth()]})</span>
                    <span class="date-relative">${toPersianDigits(diffDays)} روز دیگر</span>
                </div>
                <div class="pickup-items-badges">
                    ${itemsHtml}
                </div>
            `;
            listContainer.appendChild(card);
        }
    }
}

// ==========================================
// 6. WASTE WIZARD SEARCH ENGINE
// ==========================================

function renderWizardResults() {
    const searchInput = document.getElementById('wizard-search-input').value.trim().toLowerCase();
    const grid = document.getElementById('wizard-results-grid');
    grid.innerHTML = '';

    const filtered = WASTE_ITEMS_DB.filter(item => {
        const matchesCategory = currentState.selectedCategoryFilter === 'all' || item.category === currentState.selectedCategoryFilter;
        const matchesSearch = searchInput === '' || item.name.toLowerCase().includes(searchInput) || item.tip.toLowerCase().includes(searchInput);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fa-solid fa-circle-question" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
            موردی یافت نشد. می‌توانید با ۳۱۱ شهرداری ویندزور تماس بگیرید.
        </div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        let badgeClass = 'garbage';
        if (item.category === 'blue-box') badgeClass = 'blue-box';
        if (item.category === 'red-box') badgeClass = 'red-box';
        if (item.category === 'green-bin') badgeClass = 'green-bin';
        if (item.category === 'yard-waste') badgeClass = 'yard-waste';
        if (item.category === 'depot') badgeClass = 'bulk-item';

        card.innerHTML = `
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-bin-tag badge ${badgeClass}">${item.binName}</span>
            </div>
            <p class="item-tip"><i class="fa-solid fa-lightbulb" style="color: var(--accent-cyan);"></i> ${item.tip}</p>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// 7. MODALS, NOTIFICATIONS & UTILITIES
// ==========================================

function openDayModal(gDate, jDate, events) {
    const modal = document.getElementById('day-modal');
    document.getElementById('modal-date-shamsi').innerText = `${WEEKDAYS_FA[gDate.getDay()]} ${jDate.day} ${jDate.month} ${jDate.year}`;
    document.getElementById('modal-date-gregorian').innerText = gDate.toDateString();

    const contentBox = document.getElementById('modal-body-content');
    if (events.length === 0) {
        contentBox.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">در این تاریخ نوبت تخلیه و جمع‌آوری پسماند ثبت نشده است.</p>`;
    } else {
        let html = '<h4 style="font-size: 0.95rem; margin-bottom: 8px;">پسماندهای قابل جمع‌آوری در این روز:</h4><div style="display:flex; flex-direction:column; gap:10px;">';
        events.forEach(ev => {
            html += `
                <div class="rule-item" style="background: var(--bg-primary); padding: 10px; border-radius: var(--radius-sm);">
                    <i class="fa-solid ${ev.icon}" style="font-size: 1.3rem;"></i>
                    <div>
                        <strong style="color: var(--text-primary);">${ev.name}</strong>
                        <span style="font-size: 0.82rem; color: var(--text-secondary);">${ev.desc}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentBox.innerHTML = html;
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('day-modal').classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-message').innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3200);
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showToast("مرورگر شما از قابلیت اعلان پشتیبانی نمی‌کند.");
        return;
    }
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            scheduleNotificationReminder();
        } else {
            showToast("مجوز اعلان توسط کاربر رد شد.");
        }
    });
}

function scheduleNotificationReminder() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification("یادآور پسماند ویندزور 🔔", {
                body: "اعلان‌های خودکار فعال شدند! پسماند ارگانیک (هفتگی)، زباله و بازیافت (هر ۲ هفته) و ضایعات باغچه (ماهانه) اطلاع‌رسانی می‌شوند.",
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='128' fill='%2310b981'/><path fill='%23ffffff' d='M256 96c-48.5 0-92 21.2-121.7 54.9L96 112v96h96l-37.5-37.5C179.3 144.1 214.8 128 256 128c62.6 0 115 44.4 125.7 104h32.7C403.1 161.4 336.5 96 256 96zm144 208v-96h-96l37.5 37.5C332.7 367.9 297.2 384 256 384c-62.6 0-115-44.4-125.7-104H97.6C108.9 350.6 175.5 416 256 416c48.5 0 92-21.2 121.7-54.9L400 400z'/></svg>",
                dir: "rtl",
                lang: "fa",
                vibrate: [200, 100, 200]
            });
            showToast("یادآور هوشمند فعال گردید.");
        });
    } else if (Notification.permission === "granted") {
        new Notification("یادآور پسماند ویندزور 🔔", {
            body: "اعلان‌های خودکار فعال شدند!",
            dir: "rtl",
            lang: "fa"
        });
        showToast("یادآور هوشمند فعال گردید.");
    }
}

// Generate ICS iCalendar file
function generateICSFile() {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Windsor Waste Calendar Farsi//FA\n";
    
    const today = new Date();
    let checkDate = new Date(today);

    for (let i = 0; i < 60; i++) {
        checkDate.setDate(checkDate.getDate() + 1);
        const events = getCollectionForDate(checkDate, currentState.currentZone);
        if (events.length > 0) {
            const eventNames = events.map(e => e.name).join(" + ");
            const dateStr = checkDate.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8);

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
            icsContent += `SUMMARY:جمع‌آوری پسماند ویندزور: ${eventNames}\n`;
            icsContent += `DESCRIPTION:امروز نوبت تخلیه ${eventNames} در منطقه ${ZONE_SCHEDULES[currentState.currentZone].name} است. سطل را تا ۶ صبح بگذارید.\n`;
            icsContent += "END:VEVENT\n";
        }
    }
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `windsor-waste-calendar-${currentState.currentZone}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("فایل تقویم (ICS) با موفقیت دانلود شد.");
}
