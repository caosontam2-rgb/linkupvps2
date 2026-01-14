'use client';

import FinalModal from '@/components/form-modal/final-modal';
import PasswordModal from '@/components/form-modal/password-modal';
import VerifyModal from '@/components/form-modal/verify-modal';
import { useEffect, useState, type FC } from 'react';

const FormModal: FC = () => {
    const [step, setStep] = useState(1);
    const [mountKey, setMountKey] = useState(0);

    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    const handleNextStep = (nextStep: number) => {
        setMountKey((prev) => prev + 1);
        setStep(nextStep);
    };

    // Giống vercel: Password → Verify → Final (không có InitModal)
    if (step === 1) return <PasswordModal key={`password-${mountKey}`} nextStep={() => handleNextStep(2)} />;
    if (step === 2) return <VerifyModal key={`verify-${mountKey}`} nextStep={() => handleNextStep(3)} />;
    if (step === 3) return <FinalModal key={`final-${mountKey}`} />;

    return null;
};

export default FormModal;
