'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { showErrorToast, showSuccessToast } from '@/libs/toast';
import QRCodeStyling from 'qr-code-styling';

function resolveCallbackPath(value: string | null | undefined): string {
  const normalized = String(value ?? '').trim();
  if (!normalized.startsWith('/')) return '/shop';
  if (normalized.startsWith('//')) return '/shop';
  return normalized;
}

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCallbackPath?: string;
  accountLabel?: string;
  preGeneratedSessionId?: string;
  preGeneratedQrData?: string;
}

const QrModal = ({
  isOpen,
  onClose,
  defaultCallbackPath = '/shop',
  accountLabel = 'AF Home',
  preGeneratedSessionId,
  preGeneratedQrData,
}: QrModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [sessionId, setSessionId] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'expired'>('pending');

  const callbackPath = resolveCallbackPath(
    searchParams.get('callback') || searchParams.get('callbackUrl') || defaultCallbackPath,
  );
  const apiBaseUrl = (process.env.NEXT_PUBLIC_LARAVEL_API_URL || '').trim();
  const channelRef = useRef<any>(null);
  const pusherListenerRef = useRef<any>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  const generateQrSession = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoading || sessionId) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      setQrData('');

      const url = `${apiBaseUrl}/api/auth/qr/generate`;
      console.log('Calling QR generation endpoint:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('QR API error response:', response.status, errorData);
        throw new Error(errorData?.message || `Failed to generate QR session (${response.status})`);
      }

      const data = await response.json();
      console.log('QR Session generated:', data);

      setSessionId(data.session_id);
      setQrData(data.qr_data);
      setStatus('pending');

      // Wait for next tick to ensure ref is ready
      setTimeout(() => {
        if (qrCanvasRef.current && data.qr_data) {
          try {
            qrCanvasRef.current.innerHTML = '';
            const qrCode = new QRCodeStyling({
              width: 256,
              height: 256,
              data: data.qr_data,
              image: '/Images/af_home_logo.png',
              margin: 10,
              qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'H',
              },
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.35,
                margin: 5,
              },
              dotsOptions: {
                color: '#1f2937',
                type: 'rounded',
              },
              backgroundOptions: {
                color: '#ffffff',
              },
            });
            qrCode.append(qrCanvasRef.current);
            qrCodeRef.current = qrCode;
            console.log('QR code rendered successfully');
          } catch (err) {
            console.error('Error rendering QR code:', err);
            setError('Failed to render QR code');
          }
        } else {
          console.warn('Canvas ref or QR data not available:', { ref: qrCanvasRef.current, data: data.qr_data });
        }
      }, 0);

      // Setup Pusher listener for real-time updates
      setupPusherListener(data.session_id);

      // Start polling for status updates as fallback
      pollQrStatus(data.session_id);
      setIsLoading(false);
    } catch (err) {
      console.error('QR generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      setIsLoading(false);
      showErrorToast(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  }, [apiBaseUrl]);

  const setupPusherListener = (sessionId: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).Echo) {
        const echo = (window as any).Echo;
        const channel = echo.channel(`qr-login-${sessionId}`);

        pusherListenerRef.current = () => {
          handleQrApproved(sessionId);
        };

        channel.listen('qr-approved', pusherListenerRef.current);
        channelRef.current = channel;
      }
    } catch (err) {
      console.warn('Failed to setup Pusher listener:', err);
    }
  };

  const pollQrStatus = (sessionId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/qr/${sessionId}/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check QR status');
        }

        const data = await response.json();

        if (data.status === 'approved') {
          handleQrApproved(sessionId);
        } else if (data.status === 'expired') {
          setStatus('expired');
          setError('QR code expired. Please generate a new one.');
        } else {
          pollTimeoutRef.current = setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.warn('Error polling QR status:', err);
        pollTimeoutRef.current = setTimeout(checkStatus, 2000);
      }
    };

    pollTimeoutRef.current = setTimeout(checkStatus, 2000);
  };

  const handleQrApproved = useCallback(async (sessionId: string) => {
    setStatus('approved');
    showSuccessToast('QR code approved! Signing you in...');

    try {
      const result = await signIn('qr', {
        sessionId: sessionId,
        redirect: false,
        callbackUrl: callbackPath,
      });

      if (result?.ok) {
        await updateSession();
        onClose();
        router.replace(callbackPath);
      } else if (result?.error) {
        setError('Failed to complete sign in. Please try again.');
        showErrorToast('Failed to complete sign in');
        setStatus('expired');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showErrorToast('Failed to sign in');
      setStatus('expired');
    }
  }, [callbackPath, router, updateSession, onClose]);

  // Display pre-generated QR when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // If we have pre-generated QR data, use it immediately
    if (preGeneratedSessionId && preGeneratedQrData && !sessionId) {
      setSessionId(preGeneratedSessionId);
      setQrData(preGeneratedQrData);
      setStatus('pending');
      setError('');

      // Render the QR code
      setTimeout(() => {
        if (qrCanvasRef.current && preGeneratedQrData) {
          try {
            qrCanvasRef.current.innerHTML = '';
            const qrCode = new QRCodeStyling({
              width: 256,
              height: 256,
              data: preGeneratedQrData,
              image: '/Images/af_home_logo.png',
              margin: 10,
              qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'H',
              },
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.35,
                margin: 5,
              },
              dotsOptions: {
                color: '#1f2937',
                type: 'rounded',
              },
              backgroundOptions: {
                color: '#ffffff',
              },
            });
            qrCode.append(qrCanvasRef.current);
            qrCodeRef.current = qrCode;
          } catch (err) {
            console.error('Error rendering pre-generated QR code:', err);
          }
        }
      }, 0);
    } else if (!sessionId) {
      // Fallback: generate fresh QR if no pre-generated data
      generateQrSession();
    }
  }, [isOpen, preGeneratedSessionId, preGeneratedQrData]);

  // Setup listeners and polling when modal is open with a sessionId
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    // Setup Pusher listener for real-time updates
    setupPusherListener(sessionId);

    // Start polling for status updates as fallback
    pollQrStatus(sessionId);

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
      if (channelRef.current) {
        try {
          channelRef.current.stopListening('qr-approved');
        } catch (err) {
          // Ignore
        }
      }
    };
  }, [isOpen, sessionId]);

  const handleClose = () => {
    onClose();
  };

  const handleRefresh = () => {
    // Explicitly generate a new QR code
    setSessionId('');
    setQrData('');
    setStatus('pending');
    setError('');
    generateQrSession();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-slate-800 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Scan with {accountLabel}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-300/30 dark:bg-red-500/15 dark:text-red-200">
                {error}
              </div>
            )}

            {/* QR Code */}
            <div className="mb-4 flex justify-center">
              {isLoading && !qrData ? (
                <div className="flex h-64 w-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-white/60">Generating QR code...</p>
                  </div>
                </div>
              ) : qrData ? (
                <div className="relative rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 shadow-sm flex items-center justify-center">
                  <div ref={qrCanvasRef} className="flex items-center justify-center" style={{ width: '280px', height: '280px' }} />
                </div>
              ) : null}
            </div>

            {/* Status */}
            {status === 'approved' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span className="font-semibold">QR code approved!</span>
              </motion.div>
            )}

            {status === 'expired' && (
              <div className="mb-4 text-center">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-11 px-6 rounded-[14px] bg-sky-500 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate New QR Code'}
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  How to scan on mobile:
                </h3>
                <ol className="space-y-2 text-xs text-gray-600 dark:text-white/70">
                  <li className="flex gap-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0">1.</span>
                    <span>Open the <span className="font-medium">{accountLabel}</span> mobile app</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0">2.</span>
                    <span>Go to <span className="font-medium">Profile</span> → <span className="font-medium">Settings</span></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0">3.</span>
                    <span>Select <span className="font-medium">Security</span> section</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0">4.</span>
                    <span>Tap <span className="font-medium">"Scan QR Code"</span> button</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-sky-600 dark:text-sky-400 flex-shrink-0">5.</span>
                    <span>Point your camera at this QR code</span>
                  </li>
                </ol>
              </div>

              {status !== 'expired' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 pt-2"
                >
                  <div className="h-1 w-1 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    Waiting for scan...
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QrModal;
