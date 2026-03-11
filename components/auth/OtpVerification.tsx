'use client';

import { showErrorToast, showSuccessToast } from "@/libs/toast";
import { useResendRegisterOtpMutation, useVerifyRegisterOtpMutation } from "@/store/api/authApi";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import OtpInput from "./OtpInput";
import Loading from "../Loading";
interface OtpVerificationProps {
    email: string;
    verificationToken: string;
    onSuccess: () => void;
    onBack: () => void;
}
const OtpVerification = ({ email, verificationToken, onSuccess, onBack }: OtpVerificationProps) => {
    const [verifyRegisterOtp, { isLoading: isVerifying }] = useVerifyRegisterOtpMutation();
    const [resendRegistrationOtp, { isLoading: isResending }] = useResendRegisterOtpMutation();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);
    const errorRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = window.setTimeout(() => setCountdown(c => Math.max(0, c - 1)), 1000)
        return () => window.clearTimeout(timer)
    }, [countdown]);

    const showError = (msg: string) => {
        setError(msg);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!/^\d{4}$/.test(otp)) {
            return showError('Please enter the complete 4-digit code.');
        }

        const result = await verifyRegisterOtp({ verification_token: verificationToken, otp });

        if ('error' in result) {
            const err = (result.error as { data?: { errors?: Record<string, string[]>; message?: string } }).data
            const msg = err?.errors ? Object.values(err.errors)[0][0] : err?.message || 'Verification failed. Please try again.'
            showError(msg)
            showErrorToast(msg)
            return
        }

        showSuccessToast('Registration successful. You can now sign in.')
        onSuccess();
    }

    const handleResend = async () => {
        if (!verificationToken || countdown > 0) return

        const result = await resendRegistrationOtp({ verification_token: verificationToken })

        if ('error' in result) {
            const err = (result.error as { data?: { errors?: Record<string, string[]>; message?: string } }).data
            const msg = err?.errors ? Object.values(err.errors)[0][0] : err?.message || 'Unable to resend the code.'
            showError(msg)
            showErrorToast(msg)
            return
        }

        setCountdown(60)
        setOtp('')
        showSuccessToast('A new Verification code has been sent.')
    }

    const maskedEmail = (() => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return `${local.slice(0, 2)}${'*'.repeat(Math.max(0, local.length - 2))}@${domain}`
    })()
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center text-center"
        >
            {/* ICON */}
            <div className="mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/50 border border-orange-400/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Check your Email</h2>
            <p className="text-white/60 text-sm mb-1">We sent a 4-digit verification code to</p>
            <p className="text-orange-400 font-semibold text-sm mb-8">{maskedEmail}</p>

            {error && (
                <div ref={errorRef} className="w-full mb-4 bg-red-500/20 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm text-red-300 text-left">
                    {error}
                </div>
            )}

            <form onSubmit={handleVerify} className="w-full space-y-8">
                <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />

                <button
                    type="submit"
                    disabled={isVerifying || otp.length < 4}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm tracking-widest transition-all duration-200 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                >
                    {isVerifying ? (
                        <>
                            <Loading size={14} />
                            <span>VERIFYING...</span>
                        </>
                    ) : (
                        <span>VERIFY CODE</span>
                    )}
                </button>
            </form>

            <div className="flex items-center justify-between w-full mt-5 text-xs text-white/55">
                <button
                    type="button"
                    onClick={onBack}
                    className="hover:text-white transition-colors"
                >
                    ← Back to sign up
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className="text-orange-400 hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
            </div>
        </motion.div>
    )
}

export default OtpVerification
