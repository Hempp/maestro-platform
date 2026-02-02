'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MakeAdminPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleMakeAdmin() {
    setStatus('loading');
    try {
      const response = await fetch('/api/admin/make-admin', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('You are now an admin! Redirecting to admin portal...');
        setTimeout(() => router.push('/admin'), 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to make admin');
      }
    } catch {
      setStatus('error');
      setMessage('Request failed');
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Setup</h1>
        <p className="text-slate-400 mb-6">
          Click below to grant yourself admin access to the portal.
        </p>

        {status === 'idle' && (
          <button
            onClick={handleMakeAdmin}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition"
          >
            Make Me Admin
          </button>
        )}

        {status === 'loading' && (
          <div className="text-slate-400">Processing...</div>
        )}

        {status === 'success' && (
          <div className="text-green-400">{message}</div>
        )}

        {status === 'error' && (
          <div className="text-red-400">{message}</div>
        )}

        <p className="text-xs text-slate-500 mt-6">
          Note: Delete /src/app/make-admin and /src/app/api/admin/make-admin after setup.
        </p>
      </div>
    </div>
  );
}
