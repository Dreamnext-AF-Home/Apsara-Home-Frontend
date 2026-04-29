'use client';

import { useEffect, useState } from 'react';

export default function FacebookAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    const broadcast = new BroadcastChannel('facebook_auth');

    const sendAndClose = (payload: Record<string, unknown>) => {
      broadcast.postMessage(payload);
      // fallback for browsers that support window.opener
      if (window.opener) {
        try {
          window.opener.postMessage({ ...payload, type: 'FACEBOOK_AUTH_CALLBACK' }, window.location.origin);
        } catch {}
      }
      broadcast.close();
      setTimeout(() => window.close(), 1500);
    };

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Authentication failed');
      sendAndClose({ type: 'FACEBOOK_AUTH_CALLBACK', error: errorDescription || 'Authentication failed' });
      return;
    }

    if (!accessToken) {
      setStatus('error');
      setMessage('No access token received');
      sendAndClose({ type: 'FACEBOOK_AUTH_CALLBACK', error: 'No access token received' });
      return;
    }

    fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,first_name,last_name&access_token=${accessToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch user info');
        }

        const { id, email, name } = data;

        if (!email) {
          throw new Error('Facebook did not return an email. Make sure your Facebook account has a verified email.');
        }

        setStatus('success');
        setMessage('Authentication successful! Closing window...');
        sendAndClose({
          type: 'FACEBOOK_AUTH_CALLBACK',
          access_token: accessToken,
          provider_id: id,
          email,
          name: name || email.split('@')[0],
        });
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to fetch user information');
        sendAndClose({ type: 'FACEBOOK_AUTH_CALLBACK', error: err.message || 'Failed to fetch user information' });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-gray-200">Connecting to Facebook...</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">Success!</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">Authentication Failed</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-slate-700 dark:text-gray-300 transition-colors"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
