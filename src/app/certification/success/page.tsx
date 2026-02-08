'use client';

/**
 * CERTIFICATION SUCCESS PAGE
 * Displayed after successful Stripe payment for certification
 *
 * Shows:
 * - Confirmation of certification
 * - SBT minting status
 * - Next steps
 * - Links to view certificate and share
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CertificationStatus {
  submission?: {
    id: string;
    path: string;
    status: string;
    total_score: number | null;
    submitted_at: string;
    reviewed_at: string | null;
  };
  certificate?: {
    id: string;
    sbt_token_id: string | null;
    sbt_transaction_hash: string | null;
    issued_at: string;
    verified_at: string | null;
  };
  sbtStatus: 'pending' | 'minting' | 'minted' | 'pending_wallet' | 'failed';
}

const PATH_CONFIG = {
  student: {
    name: 'Student',
    title: 'Certified AI Associate',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    price: '$49',
  },
  employee: {
    name: 'Employee',
    title: 'Workflow Efficiency Lead',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    price: '$199',
  },
  owner: {
    name: 'Owner',
    title: 'AI Operations Master',
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    price: '$499',
  },
};

export default function CertificationSuccessPage() {
  const searchParams = useSearchParams();
  const path = (searchParams.get('path') as 'student' | 'employee' | 'owner') || 'student';
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<CertificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = PATH_CONFIG[path] || PATH_CONFIG.student;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/certification/submit?path=${path}`);
        if (response.ok) {
          const data = await response.json();
          setStatus({
            submission: data.submission,
            certificate: data.certificate,
            sbtStatus: data.submission?.status === 'passed'
              ? (data.certificate?.sbt_token_id ? 'minted' : 'minting')
              : 'pending',
          });
        }
      } catch (err) {
        console.error('Failed to fetch certification status:', err);
        setError('Failed to load certification status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Poll for SBT status updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [path]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your certification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Banner */}
        <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-6 sm:p-8 text-white text-center mb-8 shadow-xl`}>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Congratulations!
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-4">
            You are now a {config.title}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm">
            <span>Phazur {config.name} Path</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Verified</span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-4 mb-8">
          {/* Payment Status */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-5`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payment Confirmed</h3>
                <p className="text-gray-600 text-sm">
                  Your {config.price} certification fee has been processed
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Status */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-5`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Certificate Generated</h3>
                <p className="text-gray-600 text-sm">
                  Your official Phazur certification is ready
                </p>
              </div>
            </div>
          </div>

          {/* SBT Minting Status */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-5`}>
            <div className="flex items-center gap-4">
              {status?.sbtStatus === 'minted' ? (
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : status?.sbtStatus === 'pending_wallet' ? (
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {status?.sbtStatus === 'minted'
                    ? 'Soulbound Token Minted'
                    : status?.sbtStatus === 'pending_wallet'
                    ? 'Wallet Required for SBT'
                    : 'Minting Soulbound Token...'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {status?.sbtStatus === 'minted'
                    ? 'Your credential is on the Polygon blockchain'
                    : status?.sbtStatus === 'pending_wallet'
                    ? 'Connect a wallet in your profile to receive your SBT'
                    : 'Your credential is being minted on Polygon'}
                </p>
                {status?.certificate?.sbt_transaction_hash && (
                  <a
                    href={`https://polygonscan.com/tx/${status.certificate.sbt_transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${config.textColor} text-sm hover:underline inline-flex items-center gap-1 mt-1`}
                  >
                    View on PolygonScan
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-bold text-lg text-gray-900 mb-4">What's Next?</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Download Your Certificate</p>
                <p className="text-gray-600 text-sm">Get a PDF version for your records and resume</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add to LinkedIn</p>
                <p className="text-gray-600 text-sm">Share your achievement with your professional network</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Join the Community</p>
                <p className="text-gray-600 text-sm">Connect with other certified professionals</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className={`flex-1 py-3 px-6 bg-gradient-to-r ${config.color} text-white font-semibold rounded-lg text-center shadow-md hover:opacity-90 transition-opacity`}
          >
            Go to Dashboard
          </Link>
          <Link
            href={`/learn/path/${path}`}
            className="flex-1 py-3 px-6 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            Review Your Journey
          </Link>
        </div>

        {/* Share Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Share your achievement</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                const text = `I just earned my Phazur ${config.title} certification! #AI #Certification #Phazur`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Share on Twitter"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const url = window.location.href;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
              }}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Share on LinkedIn"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Copy link"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
