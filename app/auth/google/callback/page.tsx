'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GoogleAuthCallback() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    // Get access token and state from hash fragment (OAuth implicit flow)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const state = params.get('state');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    // Extract system email from state parameter
    let systemEmail = null;
    if (state) {
      const parts = state.split('|');
      if (parts.length === 2) {
        systemEmail = decodeURIComponent(parts[1]);
      }
    }

    if (error) {
      setStatus('error');
      setMessage(errorDescription || 'Authentication failed');
      
      // Send error back to parent window
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_CALLBACK', error: errorDescription || 'Authentication failed' },
          window.location.origin
        );
        setTimeout(() => window.close(), 2000);
      }
      return;
    }

    if (!accessToken) {
      setStatus('error');
      setMessage('No access token received');
      
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_CALLBACK', error: 'No access token received' },
          window.location.origin
        );
        setTimeout(() => window.close(), 2000);
      }
      return;
    }

    // Fetch user info from Google
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error.message || 'Failed to fetch user info');
        }

        const { id, email, name } = data;

        // Validate email match on callback page
        if (systemEmail && email.toLowerCase() !== systemEmail.toLowerCase()) {
          setStatus('error');
          setMessage(`Email mismatch. Your Google account (${email}) must match your system email (${systemEmail}) to link.`);
          
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'GOOGLE_AUTH_CALLBACK',
                error: `Email mismatch. Your Google account (${email}) must match your system email (${systemEmail}) to link.`,
                social_email: email,
                account_email: systemEmail
              },
              window.location.origin
            );
          }
          
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Send success message back to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_AUTH_CALLBACK',
              access_token: accessToken,
              id_token: accessToken, // For Google OAuth, access_token serves as ID token
              provider_id: id,
              email,
              name: name || email.split('@')[0],
            },
            window.location.origin
          );
        }

        setStatus('success');
        setMessage('Authentication successful! You can close this window.');
        
        // Close the popup after a short delay
        setTimeout(() => window.close(), 1500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Failed to fetch user information');
        
        if (window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_AUTH_CALLBACK', error: err.message || 'Failed to fetch user information' },
            window.location.origin
          );
        }
        
        setTimeout(() => window.close(), 2000);
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-gray-200">
              Connecting to Google...
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">
              Success!
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-red-700 dark:text-red-400">
              Authentication Failed
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {message}
            </p>
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
