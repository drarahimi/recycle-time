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
// Collection days verified against the official 2026-2027 calendar / open-data feed:
// 1A,1B = Tuesday | 2A,2B = Wednesday | 3A,3B = Thursday | 4A,4B = Friday
const ZONE_SCHEDULES = {
    "1A": { name: "منطقه 1A (سه‌شنبه‌ها - غرب ویندزور / N9B, N9C, N9J)", shortName: "منطقه 1A (سه‌شنبه‌ها)", collectionDay: 2 },
    "1B": { name: "منطقه 1B (سه‌شنبه‌ها - جنوب غرب / N9E)", shortName: "منطقه 1B (سه‌شنبه‌ها)", collectionDay: 2 },
    "2A": { name: "منطقه 2A (چهارشنبه‌ها - مرکز شهر / N9A, N8X)", shortName: "منطقه 2A (چهارشنبه‌ها)", collectionDay: 3 },
    "2B": { name: "منطقه 2B (چهارشنبه‌ها - جنوب مرکز / N8X, N9G)", shortName: "منطقه 2B (چهارشنبه‌ها)", collectionDay: 3 },
    "3A": { name: "منطقه 3A (پنج‌شنبه‌ها - شرق مرکز / N8S, N8Y)", shortName: "منطقه 3A (پنج‌شنبه‌ها)", collectionDay: 4 },
    "3B": { name: "منطقه 3B (پنج‌شنبه‌ها - جنوب شرق / N8W, N0R, N8V)", shortName: "منطقه 3B (پنج‌شنبه‌ها)", collectionDay: 4 },
    "4A": { name: "منطقه 4A (جمعه‌ها - ریورساید / N8P, N8S East)", shortName: "منطقه 4A (جمعه‌ها)", collectionDay: 5 },
    "4B": { name: "منطقه 4B (جمعه‌ها - فورست گلید / N8R, N8T, N8N)", shortName: "منطقه 4B (جمعه‌ها)", collectionDay: 5 }
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

// AUTHORITATIVE City of Windsor collection data (2026-2027 calendar, valid Apr 1 2026 - Mar 31 2027).
// Source: opendata.citywindsor.ca/api/events/wasteCollection (per-district feed).
// Every date is taken directly from the City's published schedule, so per-zone collection days,
// bi-weekly parity, seasonal yard-waste dates AND statutory-holiday deferrals are all exact.
// Codes: R=Recycle, G=Garbage, O=Organics (Green Bin), Y=Yard Waste. Key format: YYYY-MM-DD (local).
const SCHEDULE_RANGE = { start: '2026-04-01', end: '2027-03-31' };
const ZONE_COLLECTION_DATA = {
  "1A": {"2026-04-07":"O","2026-04-14":"RGO","2026-04-21":"OY","2026-04-28":"RGO","2026-05-05":"OY","2026-05-12":"RGO","2026-05-19":"OY","2026-05-26":"RGO","2026-06-02":"O","2026-06-09":"RGO","2026-06-16":"OY","2026-06-23":"RGO","2026-06-30":"O","2026-07-07":"RGO","2026-07-14":"OY","2026-07-21":"RGO","2026-07-28":"O","2026-08-04":"RGO","2026-08-11":"OY","2026-08-18":"RGO","2026-08-25":"O","2026-09-01":"RGO","2026-09-08":"OY","2026-09-15":"RGO","2026-09-22":"O","2026-09-29":"RGO","2026-10-06":"OY","2026-10-13":"RGO","2026-10-20":"OY","2026-10-27":"RGO","2026-11-03":"OY","2026-11-10":"RGO","2026-11-17":"OY","2026-11-24":"RGO","2026-12-01":"OY","2026-12-08":"RGO","2026-12-15":"O","2026-12-22":"RGO","2026-12-29":"O","2027-01-05":"RGO","2027-01-12":"OY","2027-01-19":"RGO","2027-01-26":"O","2027-02-02":"RGO","2027-02-09":"O","2027-02-16":"RGO","2027-02-23":"O","2027-03-02":"RGO","2027-03-09":"O","2027-03-16":"RGO","2027-03-23":"O","2027-03-30":"RGO"},
  "1B": {"2026-04-07":"RGO","2026-04-14":"O","2026-04-21":"RGO","2026-04-28":"OY","2026-05-05":"RGO","2026-05-12":"OY","2026-05-19":"RGO","2026-05-26":"OY","2026-06-02":"RGO","2026-06-09":"OY","2026-06-16":"RGO","2026-06-23":"O","2026-06-30":"RGO","2026-07-07":"O","2026-07-14":"RGO","2026-07-21":"OY","2026-07-28":"RGO","2026-08-04":"O","2026-08-11":"RGO","2026-08-18":"OY","2026-08-25":"RGO","2026-09-01":"O","2026-09-08":"RGO","2026-09-15":"OY","2026-09-22":"RGO","2026-09-29":"O","2026-10-06":"RGO","2026-10-13":"OY","2026-10-20":"RGO","2026-10-27":"OY","2026-11-03":"RGO","2026-11-10":"OY","2026-11-17":"RGO","2026-11-24":"OY","2026-12-01":"RGO","2026-12-08":"OY","2026-12-15":"RGO","2026-12-22":"O","2026-12-29":"RGO","2027-01-05":"O","2027-01-12":"RGOY","2027-01-19":"O","2027-01-26":"RGO","2027-02-02":"O","2027-02-09":"RGO","2027-02-16":"O","2027-02-23":"RGO","2027-03-02":"O","2027-03-09":"RGO","2027-03-16":"O","2027-03-23":"RGO","2027-03-30":"O"},
  "2A": {"2026-04-01":"RGO","2026-04-08":"O","2026-04-15":"RGO","2026-04-22":"OY","2026-04-29":"RGO","2026-05-06":"OY","2026-05-13":"RGO","2026-05-20":"OY","2026-05-27":"RGO","2026-06-03":"OY","2026-06-10":"RGO","2026-06-17":"O","2026-06-24":"RGO","2026-07-02":"O","2026-07-08":"RGO","2026-07-15":"OY","2026-07-22":"RGO","2026-07-29":"O","2026-08-05":"RGO","2026-08-12":"OY","2026-08-19":"RGO","2026-08-26":"O","2026-09-02":"RGO","2026-09-09":"OY","2026-09-16":"RGO","2026-09-23":"O","2026-09-30":"RGO","2026-10-07":"OY","2026-10-14":"RGO","2026-10-21":"OY","2026-10-28":"RGO","2026-11-04":"OY","2026-11-11":"RGO","2026-11-18":"OY","2026-11-25":"RGO","2026-12-02":"OY","2026-12-09":"RGO","2026-12-16":"O","2026-12-23":"RGO","2026-12-30":"O","2027-01-06":"RGO","2027-01-13":"OY","2027-01-20":"RGO","2027-01-27":"O","2027-02-03":"RGO","2027-02-10":"O","2027-02-17":"RGO","2027-02-24":"O","2027-03-03":"RGO","2027-03-10":"O","2027-03-17":"RGO","2027-03-24":"O","2027-03-31":"RGO"},
  "2B": {"2026-04-01":"O","2026-04-08":"RGO","2026-04-15":"O","2026-04-22":"RGO","2026-04-29":"OY","2026-05-06":"RGO","2026-05-13":"OY","2026-05-20":"RGO","2026-05-27":"OY","2026-06-03":"RGO","2026-06-10":"OY","2026-06-17":"RGO","2026-06-24":"O","2026-07-02":"RGO","2026-07-08":"O","2026-07-15":"RGO","2026-07-22":"OY","2026-07-29":"RGO","2026-08-05":"O","2026-08-12":"RGO","2026-08-19":"OY","2026-08-26":"RGO","2026-09-02":"O","2026-09-09":"RGO","2026-09-16":"OY","2026-09-23":"RGO","2026-09-30":"O","2026-10-07":"RGO","2026-10-14":"OY","2026-10-21":"RGO","2026-10-28":"OY","2026-11-04":"RGO","2026-11-11":"OY","2026-11-18":"RGO","2026-11-25":"OY","2026-12-02":"RGO","2026-12-09":"OY","2026-12-16":"RGO","2026-12-23":"O","2026-12-30":"RGO","2027-01-06":"O","2027-01-13":"RGOY","2027-01-20":"O","2027-01-27":"RGO","2027-02-03":"O","2027-02-10":"RGO","2027-02-17":"O","2027-02-24":"RGO","2027-03-03":"O","2027-03-10":"RGO","2027-03-17":"O","2027-03-24":"RGO","2027-03-31":"O"},
  "3A": {"2026-04-02":"RGO","2026-04-09":"O","2026-04-16":"RGO","2026-04-23":"OY","2026-04-30":"RGO","2026-05-07":"OY","2026-05-14":"RGO","2026-05-21":"OY","2026-05-28":"RGO","2026-06-04":"OY","2026-06-11":"RGO","2026-06-18":"O","2026-06-25":"RGO","2026-07-03":"O","2026-07-09":"RGO","2026-07-16":"OY","2026-07-23":"RGO","2026-07-30":"O","2026-08-06":"RGO","2026-08-13":"OY","2026-08-20":"RGO","2026-08-27":"O","2026-09-03":"RGO","2026-09-10":"OY","2026-09-17":"RGO","2026-09-24":"O","2026-10-01":"RGO","2026-10-08":"OY","2026-10-15":"RGO","2026-10-22":"OY","2026-10-29":"RGO","2026-11-05":"OY","2026-11-12":"RGO","2026-11-19":"OY","2026-11-26":"RGO","2026-12-03":"OY","2026-12-10":"RGO","2026-12-17":"O","2026-12-24":"RGO","2026-12-31":"O","2027-01-07":"RGO","2027-01-14":"OY","2027-01-21":"RGO","2027-01-28":"O","2027-02-04":"RGO","2027-02-11":"O","2027-02-18":"RGO","2027-02-25":"O","2027-03-04":"RGO","2027-03-11":"O","2027-03-18":"RGO","2027-03-25":"O"},
  "3B": {"2026-04-02":"O","2026-04-09":"RGO","2026-04-16":"O","2026-04-23":"RGO","2026-04-30":"OY","2026-05-07":"RGO","2026-05-14":"OY","2026-05-21":"RGO","2026-05-28":"OY","2026-06-04":"RGO","2026-06-11":"OY","2026-06-18":"RGO","2026-06-25":"O","2026-07-03":"RGO","2026-07-09":"O","2026-07-16":"RGO","2026-07-23":"OY","2026-07-30":"RGO","2026-08-06":"O","2026-08-13":"RGO","2026-08-20":"OY","2026-08-27":"RGO","2026-09-03":"O","2026-09-10":"RGO","2026-09-17":"OY","2026-09-24":"RGO","2026-10-01":"O","2026-10-08":"RGO","2026-10-15":"OY","2026-10-22":"RGO","2026-10-29":"OY","2026-11-05":"RGO","2026-11-12":"OY","2026-11-19":"RGO","2026-11-26":"OY","2026-12-03":"RGO","2026-12-10":"OY","2026-12-17":"RGO","2026-12-24":"O","2026-12-31":"RGO","2027-01-07":"O","2027-01-14":"RGOY","2027-01-21":"O","2027-01-28":"RGO","2027-02-04":"O","2027-02-11":"RGO","2027-02-18":"O","2027-02-25":"RGO","2027-03-04":"O","2027-03-11":"RGO","2027-03-18":"O","2027-03-25":"RGO"},
  "4A": {"2026-04-04":"RGO","2026-04-10":"O","2026-04-17":"RGO","2026-04-24":"OY","2026-05-01":"RGO","2026-05-08":"OY","2026-05-15":"RGO","2026-05-22":"OY","2026-05-29":"RGO","2026-06-05":"OY","2026-06-12":"RGO","2026-06-19":"O","2026-06-26":"RGO","2026-07-04":"O","2026-07-10":"RGO","2026-07-17":"OY","2026-07-24":"RGO","2026-07-31":"O","2026-08-07":"RGO","2026-08-14":"OY","2026-08-21":"RGO","2026-08-28":"O","2026-09-04":"RGO","2026-09-11":"OY","2026-09-18":"RGO","2026-09-25":"O","2026-10-02":"RGO","2026-10-09":"OY","2026-10-16":"RGO","2026-10-23":"OY","2026-10-30":"RGO","2026-11-06":"OY","2026-11-13":"RGO","2026-11-20":"OY","2026-11-27":"RGO","2026-12-04":"OY","2026-12-11":"RGO","2026-12-18":"O","2026-12-26":"RGO","2027-01-02":"O","2027-01-08":"RGO","2027-01-15":"OY","2027-01-22":"RGO","2027-01-29":"O","2027-02-05":"RGO","2027-02-12":"O","2027-02-19":"RGO","2027-02-26":"O","2027-03-05":"RGO","2027-03-12":"O","2027-03-19":"RGO","2027-03-26":"O"},
  "4B": {"2026-04-04":"O","2026-04-10":"RGO","2026-04-17":"O","2026-04-24":"RGO","2026-05-01":"OY","2026-05-08":"RGO","2026-05-15":"OY","2026-05-22":"RGO","2026-05-29":"OY","2026-06-05":"RGO","2026-06-12":"OY","2026-06-19":"RGO","2026-06-26":"O","2026-07-04":"RGO","2026-07-10":"O","2026-07-17":"RGO","2026-07-24":"OY","2026-07-31":"RGO","2026-08-07":"O","2026-08-14":"RGO","2026-08-21":"OY","2026-08-28":"RGO","2026-09-04":"O","2026-09-11":"RGO","2026-09-18":"OY","2026-09-25":"RGO","2026-10-02":"O","2026-10-09":"RGO","2026-10-16":"OY","2026-10-23":"RGO","2026-10-30":"OY","2026-11-06":"RGO","2026-11-13":"OY","2026-11-20":"RGO","2026-11-27":"OY","2026-12-04":"RGO","2026-12-11":"OY","2026-12-18":"RGO","2026-12-26":"O","2027-01-02":"RGO","2027-01-08":"O","2027-01-15":"RGOY","2027-01-22":"O","2027-01-29":"RGO","2027-02-05":"O","2027-02-12":"RGO","2027-02-19":"O","2027-02-26":"RGO","2027-03-05":"O","2027-03-12":"RGO","2027-03-19":"O","2027-03-26":"RGO"}
};

// Map single-letter feed codes to the app's WASTE_TYPES keys (legend order preserved).
const COLLECTION_CODE_MAP = { R: 'recycling', G: 'garbage', O: 'greenBin', Y: 'yardWaste' };

// Build a local YYYY-MM-DD key (avoids UTC off-by-one from toISOString()).
function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ------------------------------------------------------------------
// Live schedule sync with the official City of Windsor open-data API.
// The embedded ZONE_COLLECTION_DATA above is the built-in/offline fallback;
// a successful sync overwrites it (in memory + localStorage) so the app can
// pick up next year's calendar without a code change.
// ------------------------------------------------------------------
const WASTE_API = {
    base: 'https://opendata.citywindsor.ca/api/events/wasteCollection',
    zones: ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B'],
    categoryToCode: { 'Recycle': 'R', 'Garbage': 'G', 'Organics': 'O', 'Yard Waste': 'Y' },
    codeOrder: ['R', 'G', 'O', 'Y'] // legend order preserved in stored strings
};
const SCHEDULE_STORAGE_KEY = 'windsor_schedule_data_v1';
const SCHEDULE_UPDATED_KEY = 'windsor_schedule_updated_v1';
// Always re-fetch from the start of the built-in calendar so browsing past
// months keeps working, and extend well past today to catch future calendars.
const SCHEDULE_FETCH_START = SCHEDULE_RANGE.start;

// Replace the active dataset in place (ZONE_COLLECTION_DATA is const, so mutate it).
function applyScheduleData(data, range) {
    Object.keys(ZONE_COLLECTION_DATA).forEach(z => delete ZONE_COLLECTION_DATA[z]);
    Object.keys(data).forEach(z => { ZONE_COLLECTION_DATA[z] = data[z]; });
    if (range && range.start) SCHEDULE_RANGE.start = range.start;
    if (range && range.end) SCHEDULE_RANGE.end = range.end;
}

// On startup: adopt a previously synced schedule from localStorage, if present and valid.
function loadStoredSchedule() {
    try {
        const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (!raw) return false;
        const stored = JSON.parse(raw);
        if (!stored || !stored.data || typeof stored.data !== 'object') return false;
        // Sanity check: must contain the expected zones with some entries.
        const zones = Object.keys(stored.data);
        const totalDays = zones.reduce((n, z) => n + Object.keys(stored.data[z] || {}).length, 0);
        if (zones.length < WASTE_API.zones.length || totalDays < 100) return false;
        applyScheduleData(stored.data, stored.range);
        return true;
    } catch (e) {
        console.warn('Stored schedule could not be loaded:', e);
        return false;
    }
}

async function fetchZoneSchedule(zone, start, end) {
    const url = `${WASTE_API.base}?location=${encodeURIComponent(zone)}` +
        `&start=${start}&end=${end}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for zone ${zone}`);
    const json = await res.json();
    const items = (json && json.items) || [];
    const byDate = {};
    items.forEach(it => {
        const code = WASTE_API.categoryToCode[it.category];
        if (!code) return;
        const key = (it.collectionDate || '').slice(0, 10);
        if (!key) return;
        (byDate[key] = byDate[key] || new Set()).add(code);
    });
    const map = {};
    Object.keys(byDate).sort().forEach(key => {
        map[key] = WASTE_API.codeOrder.filter(c => byDate[key].has(c)).join('');
    });
    return map;
}

// Fetch every zone, validate, then persist + apply. Returns a result summary.
async function updateScheduleFromApi() {
    const start = SCHEDULE_FETCH_START;
    const end = toDateKey(new Date(Date.now() + 540 * 24 * 3600 * 1000)); // ~18 months ahead
    const maps = await Promise.all(
        WASTE_API.zones.map(z => fetchZoneSchedule(z, start, end).then(m => ({ z, m })))
    );

    const data = {};
    let total = 0, minDate = null, maxDate = null;
    maps.forEach(({ z, m }) => {
        // Keep the current (embedded/stored) data for any zone the API returns empty.
        if (Object.keys(m).length === 0) {
            data[z] = ZONE_COLLECTION_DATA[z] || {};
        } else {
            data[z] = m;
        }
        Object.keys(data[z]).forEach(k => {
            total++;
            if (!minDate || k < minDate) minDate = k;
            if (!maxDate || k > maxDate) maxDate = k;
        });
    });

    if (total < 100) throw new Error('پاسخ سرور ناقص بود (داده کافی دریافت نشد).');

    const range = { start: minDate || start, end: maxDate || end };
    const payload = { data, range, updatedAt: new Date().toISOString() };
    try {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(SCHEDULE_UPDATED_KEY, payload.updatedAt);
    } catch (e) {
        console.warn('Could not persist schedule to localStorage:', e);
    }
    applyScheduleData(data, range);
    return { total, range, updatedAt: payload.updatedAt };
}

// Human-readable "last updated" label under the calendar toolbar.
function renderScheduleUpdatedLabel() {
    const el = document.getElementById('schedule-updated-label');
    if (!el) return;
    const iso = localStorage.getItem(SCHEDULE_UPDATED_KEY);
    if (!iso) {
        el.innerText = 'منبع: برنامه رسمی داخلی (۲۰۲۶-۲۰۲۷)';
        return;
    }
    const d = new Date(iso);
    const jd = getJalaliDateParts(d);
    const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    el.innerText = `آخرین بروزرسانی از سرور شهرداری: ${jd.day} ${jd.month} ${jd.year} - ${time}`;
}

async function handleUpdateScheduleClick() {
    const btn = document.getElementById('update-schedule-btn');
    const original = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> در حال بروزرسانی...';
    }
    showToast('در حال دریافت آخرین برنامه از سرور شهرداری ویندزور...');
    try {
        const result = await updateScheduleFromApi();
        updateAppView();
        renderScheduleUpdatedLabel();
        showToast(`برنامه با موفقیت بروزرسانی شد (${toPersianDigits(result.total)} روز جمع‌آوری دریافت شد).`);
    } catch (e) {
        console.error('Schedule update failed:', e);
        showToast('بروزرسانی ناموفق بود. برنامه داخلی حفظ شد. اتصال اینترنت را بررسی کنید.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    }
}

// ==========================================
// 3. INITIALIZATION & EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadStoredSchedule();
    initServiceWorker();
    initPwaInstall();
    initEventListeners();
    updateAppView();
    renderScheduleUpdatedLabel();
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

    const updateBtn = document.getElementById('update-schedule-btn');
    if (updateBtn) updateBtn.addEventListener('click', handleUpdateScheduleClick);

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
    const zoneData = ZONE_COLLECTION_DATA[zoneId];
    if (!zoneData) return [];

    // Authoritative lookup: exact per-day categories from the City schedule.
    // This correctly reflects each zone's collection weekday, bi-weekly parity,
    // seasonal yard-waste dates and any statutory-holiday deferrals.
    const codes = zoneData[toDateKey(date)];
    if (!codes) return [];

    // Preserve the legend order (Recycle, Garbage, Green Bin, Yard Waste) as stored.
    return codes.split('').map(code => WASTE_TYPES[COLLECTION_CODE_MAP[code]]).filter(Boolean);
}

// ==========================================
// 4b. OFFICIAL HOLIDAY ENGINE (Ontario / City of Windsor)
// ==========================================
// Statutory holidays observed by the City of Windsor, computed from their legislated
// rules so they resolve correctly for any year (validated against the official
// 2026-2027 waste calendar). "depotClosed" marks Public Drop Off Depot closures.

// Easter Sunday via the Anonymous Gregorian (Meeus/Jones/Butcher) algorithm.
function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

// Nth (1-based) occurrence of a weekday (0=Sun..6=Sat) in a given month (0-based).
function nthWeekday(year, month, weekday, n) {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

// Definitions produce a Date for a given year. fa = Persian name, en = English label.
const HOLIDAY_DEFS = [
    { fa: 'روز سال نو', en: "New Year's Day", depotClosed: true, date: y => new Date(y, 0, 1) },
    { fa: 'روز خانواده', en: 'Family Day', depotClosed: true, date: y => nthWeekday(y, 1, 1, 3) }, // 3rd Mon of Feb
    { fa: 'جمعه نیک', en: 'Good Friday', depotClosed: true, date: y => addDays(easterSunday(y), -2) },
    { fa: 'دوشنبه عید پاک', en: 'Easter Monday', depotClosed: true, date: y => addDays(easterSunday(y), 1) },
    { fa: 'روز ویکتوریا', en: 'Victoria Day', depotClosed: true, date: y => { let d = new Date(y, 4, 24); while (d.getDay() !== 1) d.setDate(d.getDate() - 1); return d; } },
    { fa: 'روز کانادا', en: 'Canada Day', depotClosed: true, date: y => new Date(y, 6, 1) },
    { fa: 'تعطیلات مدنی (سیویک)', en: 'Civic Holiday', depotClosed: true, date: y => nthWeekday(y, 7, 1, 1) }, // 1st Mon of Aug
    { fa: 'روز کارگر', en: 'Labour Day', depotClosed: true, date: y => nthWeekday(y, 8, 1, 1) }, // 1st Mon of Sep
    { fa: 'روز حقیقت و آشتی', en: 'Truth & Reconciliation', depotClosed: false, date: y => new Date(y, 8, 30) },
    { fa: 'روز شکرگزاری', en: 'Thanksgiving Day', depotClosed: true, date: y => nthWeekday(y, 9, 1, 2) }, // 2nd Mon of Oct
    { fa: 'روز یادبود', en: 'Remembrance Day', depotClosed: false, date: y => new Date(y, 10, 11) },
    { fa: 'روز کریسمس', en: 'Christmas Day', depotClosed: true, date: y => new Date(y, 11, 25) },
    { fa: 'روز باکسینگ‌دی', en: 'Boxing Day', depotClosed: true, date: y => new Date(y, 11, 26) }
];

// Lazily build & cache a { 'YYYY-MM-DD': {fa, en, depotClosed} } map per year.
const HOLIDAY_CACHE = {};
function getHolidayMapForYear(year) {
    if (HOLIDAY_CACHE[year]) return HOLIDAY_CACHE[year];
    const map = {};
    HOLIDAY_DEFS.forEach(def => {
        map[toDateKey(def.date(year))] = { fa: def.fa, en: def.en, depotClosed: def.depotClosed };
    });
    HOLIDAY_CACHE[year] = map;
    return map;
}

function getHolidayForDate(date) {
    return getHolidayMapForYear(date.getFullYear())[toDateKey(date)] || null;
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
        const holiday = getHolidayForDate(currentDate);
        const isToday = currentDate.toDateString() === today.toDateString();

        const cell = document.createElement('div');
        cell.className = `day-cell ${isToday ? 'today' : ''} ${holiday ? 'is-holiday' : ''}`;

        let badgesHtml = '';
        events.forEach(ev => {
            badgesHtml += `<div class="mini-badge ${ev.colorClass}">${getPamphletIconSvg(ev.id)} <span>${ev.name}</span></div>`;
        });

        const holidayHtml = holiday
            ? `<div class="holiday-label" title="${holiday.en}${holiday.depotClosed ? ' — Depot closed' : ''}"><i class="fa-solid fa-star"></i> <span>${holiday.fa}</span></div>`
            : '';

        cell.innerHTML = `
            <div class="day-cell-header">
                <span class="day-shamsi">${toPersianDigits(d)}</span>
                <span class="day-gregorian">${jDate.day} ${jDate.month}</span>
            </div>
            ${holidayHtml}
            <div class="day-badges">
                ${badgesHtml}
            </div>
        `;

        cell.addEventListener('click', () => openDayModal(currentDate, jDate, events, holiday));
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

function openDayModal(gDate, jDate, events, holiday) {
    const modal = document.getElementById('day-modal');
    document.getElementById('modal-date-shamsi').innerText = `${WEEKDAYS_FA[gDate.getDay()]} ${jDate.day} ${jDate.month} ${jDate.year}`;
    document.getElementById('modal-date-gregorian').innerText = gDate.toDateString();

    if (holiday === undefined) holiday = getHolidayForDate(gDate);

    const contentBox = document.getElementById('modal-body-content');
    let holidayHtml = '';
    if (holiday) {
        const depotNote = holiday.depotClosed
            ? 'مرکز تحویل پسماند (Public Drop Off Depot) در این روز <strong>تعطیل</strong> است.'
            : 'مرکز تحویل پسماند (Public Drop Off Depot) در این روز باز است.';
        holidayHtml = `
            <div class="rule-item modal-holiday" style="background: var(--bg-primary); padding: 10px; border-radius: var(--radius-sm); display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <i class="fa-solid fa-star" style="color: var(--accent-gold, #d97706); font-size: 1.1rem;"></i>
                <div>
                    <strong style="color: var(--text-primary);">تعطیل رسمی: ${holiday.fa} (${holiday.en})</strong>
                    <span style="font-size: 0.82rem; color: var(--text-secondary); display:block;">${depotNote} جمع‌آوری این هفته ممکن است یک روز به تعویق بیفتد.</span>
                </div>
            </div>`;
    }

    if (events.length === 0) {
        contentBox.innerHTML = holidayHtml + `<p style="color: var(--text-muted); text-align: center; padding: 20px;">در این تاریخ نوبت تخلیه و جمع‌آوری پسماند ثبت نشده است.</p>`;
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
        contentBox.innerHTML = holidayHtml + html;
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
