'use client';

import { showErrorToast, showSuccessToast } from "@/libs/toast";
import { useResendRegisterOtpMutation, useVerifyRegisterOtpMutation } from "@/store/api/authApi";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import OtpInput from "./OtpInput";
import Loading from "../Loading";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";

interface OtpVerificationProps {
    email: string;
    verificationToken: string;
    onSuccess: () => void;
    onBack: () => void;
    senderName?: string;
}

const OtpVerification = ({ email, verificationToken, onSuccess, onBack, senderName = '' }: OtpVerificationProps) => {
    const [verifyRegisterOtp, { isLoading: isVerifying }] = useVerifyRegisterOtpMutation();
    const [resendRegistrationOtp, { isLoading: isResending }] = useResendRegisterOtpMutation();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [debugInfo, setDebugInfo] = useState('');
    const [traceId, setTraceId] = useState('');
    const errorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = window.setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [countdown]);

    const showError = (msg: string) => {
        setError(msg);
        requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setDebugInfo('');

        if (!/^\d{4}$/.test(otp)) {
            return showError('Please enter the complete 4-digit code.');
        }

        const requestTraceId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setTraceId(requestTraceId);

        const result = await verifyRegisterOtp({ verification_token: verificationToken, otp, debug_trace_id: requestTraceId });

        if ('error' in result) {
            const errPayload = result.error as { status?: number | string; data?: { errors?: Record<string, string[]>; message?: string } };
            const err = errPayload.data;
            const msg = err?.errors ? Object.values(err.errors)[0][0] : err?.message || 'Verification failed. Please try again.';
            const refFromMessage = /\(Ref:\s*([^)]+)\)/i.exec(String(msg))?.[1] ?? '';
            const fetchReason = String((result.error as { error?: string } | undefined)?.error ?? '').trim()
            setDebugInfo(
                `status=${String(errPayload.status ?? 'unknown')}${refFromMessage ? ` | ref=${refFromMessage}` : ''}${fetchReason ? ` | cause=${fetchReason}` : ''} | trace=${requestTraceId}`,
            );
            console.error('OTP verify error payload', result.error);

            // Fallback: account may already be created even if OTP verify endpoint
            // returns duplicate-user validation after a partial success.
            const normalizedMsg = String(msg).toLowerCase()
            const looksLikeAlreadyRegistered =
                normalizedMsg.includes('already registered') || normalizedMsg.includes('already taken')
            if (looksLikeAlreadyRegistered) {
                showSuccessToast('Registration already completed. You can now sign in.')
                onSuccess()
                return
            }

            showError(msg);
            showErrorToast(msg);
            return;
        }

        showSuccessToast('Registration successful. You can now sign in.');
        onSuccess();
    };

    const handleResend = async () => {
        if (!verificationToken || countdown > 0) return;

        const result = await resendRegistrationOtp({ verification_token: verificationToken });

        if ('error' in result) {
            const err = (result.error as { data?: { errors?: Record<string, string[]>; message?: string } }).data;
            const msg = err?.errors ? Object.values(err.errors)[0][0] : err?.message || 'Unable to resend the code.';
            showError(msg);
            showErrorToast(msg);
            return;
        }

        setCountdown(60);
        setOtp('');
        showSuccessToast('A new verification code has been sent.');
    };

    const maskedEmail = (() => {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return `${local.slice(0, 2)}${'*'.repeat(Math.max(0, local.length - 2))}@${domain}`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col text-center"
        >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/70 bg-sky-100 dark:border-sky-400/30 dark:bg-sky-500/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            </div>

            <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">Check your Email</h2>
            <p className="mb-1 text-sm text-gray-500 dark:text-white/60">We sent a 4-digit verification code to</p>
            <p className="mb-8 text-sm font-semibold text-sky-600 dark:text-sky-400">{maskedEmail}</p>
            {senderName ? (
                <p className="-mt-6 mb-8 text-xs text-gray-500 dark:text-white/55">
                    Sent by: <span className="font-medium text-gray-700 dark:text-white/80">{senderName}</span>
                </p>
            ) : null}

            {error && (
                <div ref={errorRef} className="mb-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-left text-sm text-red-600 dark:border-red-400/20 dark:bg-red-500/20 dark:text-red-300">
                    {error}
                    {debugInfo ? (
                        <div className="mt-1 text-[11px] font-medium opacity-80">
                            Debug: {debugInfo}
                        </div>
                    ) : null}
                    {!debugInfo && traceId ? (
                        <div className="mt-1 text-[11px] font-medium opacity-80">
                            Trace: {traceId}
                        </div>
                    ) : null}
                </div>
            )}

            <form onSubmit={handleVerify} className="w-full space-y-6">
                <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} autoFocus />

                <PrimaryButton
                    type="submit"
                    disabled={isVerifying || otp.length < 4}
                    className="w-full py-3 px-5 text-sm"
                >
                    {isVerifying ? (
                        <>
                            <Loading size={14} />
                            <span>VERIFYING...</span>
                        </>
                    ) : (
                        <span>VERIFY CODE</span>
                    )}
                </PrimaryButton>
            </form>

            <div className="mt-5 flex w-full items-center justify-between text-xs text-gray-500 dark:text-white/55">
                <button
                    type="button"
                    onClick={onBack}
                    className="transition-colors hover:text-gray-900 dark:hover:text-white"
                >
                    Back to sign up
                </button>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className="text-sky-500 transition-colors hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-400 dark:hover:text-sky-300"
                >
                    {isResending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
            </div>
        </motion.div>
    );
};

export default OtpVerification;
