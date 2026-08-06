/**
 * WINDSOR FA WASTE & RECYCLING CALENDAR - APPLICATION ENGINE
 * Official City of Windsor Schedule (4 Official Collection Types)
 * 1. Recycling Collection (Single-stream Blue Cart)
 * 2. Garbage Collection
 * 3. Green Bin Collection (Weekly)
 * 4. Yard Waste Collection (Paper Bags)
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

// Official City of Windsor Collection Zones (1A to 4B)
const ZONE_SCHEDULES = {
    "1A": { name: "منطقه 1A (دوشنبه‌ها - غرب ویندزور / N9B, N9C, N9J)", shortName: "منطقه 1A (دوشنبه‌ها)", collectionDay: 1, isCycleA: true },
    "1B": { name: "منطقه 1B (دوشنبه‌ها - جنوب غرب / N9E)", shortName: "منطقه 1B (دوشنبه‌ها)", collectionDay: 1, isCycleA: false },
    "2A": { name: "منطقه 2A (سه‌شنبه‌ها - مرکز شهر / N9A, N8X)", shortName: "منطقه 2A (سه‌شنبه‌ها)", collectionDay: 2, isCycleA: true },
    "2B": { name: "منطقه 2B (سه‌شنبه‌ها - جنوب مرکز / N8X, N9G)", shortName: "منطقه 2B (سه‌شنبه‌ها)", collectionDay: 2, isCycleA: false },
    "3A": { name: "منطقه 3A (چهارشنبه‌ها - شرق مرکز / N8S, N8Y)", shortName: "منطقه 3A (چهارشنبه‌ها)", collectionDay: 3, isCycleA: true },
    "3B": { name: "منطقه 3B (پنج‌شنبه‌ها - جنوب شرق / N8W, N0R, N8V)", shortName: "منطقه 3B (پنج‌شنبه‌ها)", collectionDay: 4, isCycleA: false },
    "4A": { name: "منطقه 4A (پنج‌شنبه‌ها - ریورساید / N8P, N8S East)", shortName: "منطقه 4A (پنج‌شنبه‌ها)", collectionDay: 4, isCycleA: true },
    "4B": { name: "منطقه 4B (جمعه‌ها - فورست گلید / N8R, N8T, N8N)", shortName: "منطقه 4B (جمعه‌ها)", collectionDay: 5, isCycleA: false }
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

// Function generating official City of Windsor pamphlet-consistent vector icons
function getPamphletIconSvg(typeId) {
    switch (typeId) {
        case 'recycling':
        case 'blue-box':
            return `<svg viewBox="0 0 24 24" class="pamphlet-icon recycling-icon" aria-hidden="true">
                <circle cx="6.5" cy="21.5" r="1.8" fill="#0f172a"/>
                <circle cx="6.5" cy="21.5" r="0.7" fill="#94a3b8"/>
                <circle cx="17.5" cy="21.5" r="1.8" fill="#0f172a"/>
                <circle cx="17.5" cy="21.5" r="0.7" fill="#94a3b8"/>
                <path d="M5 6L19 6L17.5 21C17.4 21.6 16.9 22 16.3 22H7.7C7.1 22 6.6 21.6 6.5 21L5 6Z" fill="#1d5c96"/>
                <path d="M3.5 4C3.5 3.4 4 3 4.6 3H19.4C20 3 20.5 3.4 20.5 4V6H3.5V4Z" fill="#0f2942"/>
                <rect x="9" y="1.5" width="6" height="1.5" rx="0.75" fill="#0f2942"/>
                <circle cx="12" cy="14" r="4" fill="#ffffff"/>
                <path fill="#1d5c96" d="M12 11.2L13.3 13H12.4V14.2H11.6V13H10.7L12 11.2ZM9.8 16L8.8 14.3L9.5 13.9L10.3 15.2L9.8 16ZM14.2 16L13.7 15.2L14.5 13.9L15.2 14.3L14.2 16Z"/>
            </svg>`;
        case 'garbage':
            return `<svg viewBox="0 0 24 24" class="pamphlet-icon garbage-icon" aria-hidden="true">
                <path d="M5 7L19 7L17.8 21.2C17.7 21.7 17.2 22 16.7 22H7.3C6.8 22 6.3 21.7 6.2 21.2L5 7Z" fill="#64748b"/>
                <line x1="8" y1="9" x2="8.5" y2="20" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/>
                <line x1="10.7" y1="9" x2="10.8" y2="20" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/>
                <line x1="13.3" y1="9" x2="13.2" y2="20" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/>
                <line x1="16" y1="9" x2="15.5" y2="20" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/>
                <rect x="4" y="6" width="16" height="1.8" rx="0.9" fill="#475569"/>
                <path d="M4.5 6L19.5 6L18 3.8C17.8 3.3 17.3 3 16.8 3H7.2C6.7 3 6.2 3.3 6 3.8L4.5 6Z" fill="#475569"/>
                <rect x="9.5" y="1.2" width="5" height="1.8" rx="0.9" fill="#334155"/>
                <path d="M3.5 10C2.7 10 2 10.7 2 11.5C2 12.3 2.7 13 3.5 13" stroke="#334155" stroke-width="1.4" fill="none"/>
                <path d="M20.5 10C21.3 10 22 10.7 22 11.5C22 12.3 21.3 13 20.5 13" stroke="#334155" stroke-width="1.4" fill="none"/>
            </svg>`;
        case 'green-bin':
        case 'greenBin':
            return `<svg viewBox="0 0 24 24" class="pamphlet-icon green-bin-icon" aria-hidden="true">
                <circle cx="6.5" cy="21.5" r="1.8" fill="#0f172a"/>
                <circle cx="6.5" cy="21.5" r="0.7" fill="#94a3b8"/>
                <circle cx="17.5" cy="21.5" r="1.8" fill="#0f172a"/>
                <circle cx="17.5" cy="21.5" r="0.7" fill="#94a3b8"/>
                <path d="M5 6L19 6L17.5 21C17.4 21.6 16.9 22 16.3 22H7.7C7.1 22 6.6 21.6 6.5 21L5 6Z" fill="#16a34a"/>
                <path d="M3.5 4C3.5 3.4 4 3 4.6 3H19.4C20 3 20.5 3.4 20.5 4V6H3.5V4Z" fill="#14532d"/>
                <rect x="9" y="1.5" width="6" height="1.5" rx="0.75" fill="#14532d"/>
                <rect x="7.5" y="10.5" width="9" height="7" rx="1.5" fill="rgba(255,255,255,0.28)"/>
                <text x="12" y="15.8" font-size="5.8" font-weight="900" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" text-anchor="middle">GB</text>
            </svg>`;
        case 'yard-waste':
        case 'yardWaste':
            return `<svg viewBox="0 0 24 24" class="pamphlet-icon yard-waste-icon" aria-hidden="true">
                <path d="M5.5 6L18.5 6L17.2 21.2C17.1 21.7 16.6 22 16.1 22H7.9C7.4 22 6.9 21.7 6.8 21.2L5.5 6Z" fill="#d97706"/>
                <path d="M5.5 6L7.5 22" stroke="#b45309" stroke-width="0.9"/>
                <path d="M18.5 6L16.5 22" stroke="#b45309" stroke-width="0.9"/>
                <path d="M4.5 6L5.5 2.5 L8.5 3.8 L12 2 L15.5 3.8 L18.5 2.5 L19.5 6 Z" fill="#b45309"/>
                <path d="M5.5 6C5.5 6 9 7.2 12 6C15 4.8 18.5 6 18.5 6" stroke="#78350f" stroke-width="1" fill="none"/>
                <circle cx="12" cy="14" r="3.5" fill="#ffffff"/>
                <g fill="#15803d">
                    <path d="M12 11.2C12.6 12 13 12.5 12.7 13.3C12.3 13 12 12.6 12 11.2Z"/>
                    <path d="M10.8 14.2C10.8 13.3 11.4 13.1 12.5 13.8C11.8 14.1 11.2 14.5 10.8 14.2Z"/>
                    <path d="M13.2 14.2C13.2 13.3 12.6 13.1 11.5 13.8C12.2 14.1 12.8 14.5 13.2 14.2Z"/>
                </g>
            </svg>`;
        case 'depot':
        case 'bulk-item':
            return `<svg viewBox="0 0 24 24" class="pamphlet-icon bulk-icon" aria-hidden="true">
                <path d="M4 12L20 12L20 17C20 17.6 19.6 18 19 18L5 18C4.4 18 4 17.6 4 17Z" fill="#9333ea"/>
                <rect x="6" y="7" width="12" height="5" rx="1" fill="#7e22ce"/>
                <circle cx="7" cy="18" r="1.8" fill="#0f172a"/>
                <circle cx="17" cy="18" r="1.8" fill="#0f172a"/>
            </svg>`;
        default:
            return `<i class="fa-solid fa-recycle"></i>`;
    }
}

// The 4 Official Windsor Waste Collection Types (Matching City Legend)
const WASTE_TYPES = {
    recycling: { id: "recycling", name: "بازیافت", colorClass: "blue-box", desc: "سطل آبی یکپارچه: کاغذ، مقوا، ظروف فلزی و پلاستیکی" },
    garbage: { id: "garbage", name: "زباله عمومی", colorClass: "garbage", desc: "زباله خانگی غیرقابل بازیافت در سطل دردار" },
    greenBin: { id: "green-bin", name: "پسماند ارگانیک", colorClass: "green-bin", desc: "باقیمانده غذا و پسماند تر در سطل سبز" },
    yardWaste: { id: "yard-waste", name: "ضایعات باغچه", colorClass: "yard-waste", desc: "برگ و شاخه‌ها فقط در کیسه کاغذی قهوه‌ای" }
};

// Database for Waste Wizard (زباله‌یاب)
const WASTE_ITEMS_DB = [
    { name: "قوطی کنسرو فلزی و آلومینیومی", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "داخل قوطی را آبکشی کنید. تمام مواد بازیافتی در یک سطل قرار می‌گیرند." },
    { name: "بطری پلاستیکی آب و نوشابه", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "درب پلاستیکی را باز کنید و بطری را فشار دهید." },
    { name: "شیشه مربا و سس", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "شیشه را شسته و بدون درب در سطل آبی قرار دهید." },
    { name: "ظرف شوینده و مایع ظرفشویی", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "کاملاً خالی و شسته شود." },
    { name: "روزنامه، مجله و کاغذ باطله", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "کاغذ و مقوا مستقیم همراه سایر مواد بازیافتی در سطل آبی ریخته می‌شوند." },
    { name: "کارتن پیتزا (بدون چربی زیاد)", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "قسمت‌های تمیز کارتن را تخت کرده و در سطل آبی قرار دهید." },
    { name: "جعبه غلات، کفش و مقوا", category: "recycling", binName: "سطل بازیافت آبی (هر ۲ هفته)", tip: "جعبه‌ها را تخت کنید." },
    { name: "باقیمانده غذا و استخوان", category: "green-bin", binName: "سطل ارگانیک سبز (هفتگی)", tip: "می‌توانید در کیسه‌های تجزیه‌پذیر مخصوص (Compostable) بگذارید." },
    { name: "پوست میوه و سبزیجات", category: "green-bin", binName: "سطل ارگانیک سبز (هفتگی)", tip: "پوست مرکبات، هسته میوه و ضایعات سبزیجات مجاز است." },
    { name: "دستمال کاغذی و حوله کاغذی کثیف", category: "green-bin", binName: "سطل ارگانیک سبز (هفتگی)", tip: "دستمال‌های آغشته به مواد غذایی مجاز هستند." },
    { name: "چای کیسه‌ای و تفاله قهوه", category: "green-bin", binName: "سطل ارگانیک سبز (هفتگی)", tip: "فیلتر کاغذی قهوه و کیسه چای را مستقیم در سطل سبز بریزید." },
    { name: "برگ درختان و چمن زده شده", category: "yard-waste", binName: "کیسه کاغذی قهوه‌ای (ماهانه)", tip: "جمع‌آوری ماهانه یک‌بار؛ فقط در کیسه‌های کاغذی قهوه‌ای قرار گیرد." },
    { name: "شاخه درختان (نازک)", category: "yard-waste", binName: "ضایعات باغچه (ماهانه)", tip: "شاخه‌ها را در طول حداکثر ۱ متر با طناب نخی ببندید." },
    { name: "یخچال، فریزر و کولر گازی", category: "depot", binName: "تحویل به مرکز EWSWA Depot / تماس ۳۱۱", tip: "به دلیل گاز مبرد نیاز به ثبت در سامانه ۳۱۱ یا تحویل شخصی دارد." },
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
// 4. COLLECTION LOGIC ENGINE (4 OFFICIAL TYPES)
// ==========================================

function getCollectionForDate(date, zoneId) {
    const zone = ZONE_SCHEDULES[zoneId];
    if (!zone) return [];

    const dayOfWeek = date.getDay();
    
    if (dayOfWeek !== zone.collectionDay) {
        return [];
    }

    const events = [];
    
    // 1. Green Bin Collection (پسماند ارگانیک) -> EVERY WEEK (هفتگی)
    events.push(WASTE_TYPES.greenBin);

    // Calculate week difference from Base Reference Date (Aug 6, 2026)
    const diffTime = date.getTime() - BASE_REFERENCE_DATE.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    // Official Windsor Bi-weekly Schedule Parity:
    // Aug 6: Green Bin ONLY
    // Aug 13: Green Bin + Garbage + Recycling
    // Aug 20: Green Bin + Yard Waste
    // Aug 27: Green Bin + Garbage + Recycling
    const isFullCollectionWeek = Math.abs(diffWeeks) % 2 === 1;

    if (isFullCollectionWeek) {
        events.push(WASTE_TYPES.garbage);
        events.push(WASTE_TYPES.recycling);
    }

    // 3. Yard Waste Collection (کیسه کاغذی قهوه‌ای ضایعات باغچه) -> Every 3rd week of the month (Days 15-21)
    const dayOfMonth = date.getDate();
    if (dayOfMonth >= 15 && dayOfMonth <= 21) {
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
    document.getElementById('zone-info-tag').innerText = `منطقه انتخابی: ${currentZoneObj.shortName || currentZoneObj.name}`;

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
        badge.innerHTML = `${getPamphletIconSvg(item.id)} ${item.name}`;
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
            badgesHtml += `<div class="mini-badge ${ev.colorClass}">${getPamphletIconSvg(ev.id)} <span>${ev.name}</span></div>`;
        });

        cell.innerHTML = `
            <div class="day-cell-header">
                <span class="day-shamsi">${toPersianDigits(d)}</span>
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
                `<span class="badge ${ev.colorClass}">${getPamphletIconSvg(ev.id)} ${ev.name}</span>`
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
        if (item.category === 'recycling') badgeClass = 'blue-box';
        if (item.category === 'green-bin') badgeClass = 'green-bin';
        if (item.category === 'yard-waste') badgeClass = 'yard-waste';
        if (item.category === 'depot') badgeClass = 'bulk-item';

        card.innerHTML = `
            <div class="item-header">
                <span class="item-name">${item.name}</span>
                <span class="item-bin-tag badge ${badgeClass}">${getPamphletIconSvg(item.category)} ${item.binName}</span>
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
                <div class="rule-item" style="background: var(--bg-primary); padding: 10px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 10px;">
                    ${getPamphletIconSvg(ev.id)}
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
