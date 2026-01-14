import axios from 'axios';

const CACHE_KEY = 'translation_cache';

const countryToLanguage: Record<string, string> = {
    AE: 'ar',
    AR: 'es',
    AT: 'de',
    AU: 'en',
    BD: 'bn',
    BE: 'nl',
    BG: 'bg',
    BR: 'pt',
    BY: 'be',
    CA: 'en',
    CH: 'de',
    CL: 'es',
    CN: 'zh',
    CO: 'es',
    CY: 'el',
    CZ: 'cs',
    DE: 'de',
    DK: 'da',
    EE: 'et',
    EG: 'ar',
    ES: 'es',
    FI: 'fi',
    FR: 'fr',
    GB: 'en',
    GR: 'el',
    HR: 'hr',
    HU: 'hu',
    ID: 'id',
    IE: 'ga',
    IL: 'iw',
    IN: 'hi',
    IQ: 'ar',
    IS: 'is',
    IT: 'it',
    JP: 'ja',
    JO: 'ar',
    KR: 'ko',
    LB: 'ar',
    LT: 'lt',
    LU: 'lb',
    LV: 'lv',
    MT: 'mt',
    MX: 'es',
    MY: 'ms',
    NG: 'en',
    NL: 'nl',
    NO: 'no',
    NZ: 'en',
    PE: 'es',
    PH: 'tl',
    PK: 'ur',
    PL: 'pl',
    PT: 'pt',
    QA: 'ar',
    RO: 'ro',
    RS: 'sr',
    SA: 'ar',
    SE: 'sv',
    SG: 'zh',
    SI: 'sl',
    SK: 'sk',
    TH: 'th',
    TR: 'tr',
    TW: 'zh',
    UA: 'uk',
    US: 'en',
    VN: 'vi',
    ZA: 'en'
};

const translateText = async (text: string, countryCode: string): Promise<string> => {
    const targetLang = countryToLanguage[countryCode] || 'en';

    if (targetLang === 'en') {
        return text;
    }
    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : {};
    const cacheKey = `en:${targetLang}:${text}`;

    if (cache[cacheKey]) {
        return cache[cacheKey];
    }

    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'en',
                tl: targetLang,
                dt: 't',
                q: text
            }
        });

        const data = response.data;

        const translatedText = data[0]
            ?.map((item: unknown[]) => item[0])
            .filter(Boolean)
            .join('');

        const result = translatedText || text;

        cache[cacheKey] = result;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        return result;
    } catch {
        return text;
    }
};

export default translateText;
