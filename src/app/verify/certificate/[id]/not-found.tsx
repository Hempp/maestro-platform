/**
 * Certificate Not Found Page
 * Displayed when a certificate ID doesn't exist
 */

import Link from 'next/link';
import Image from 'next/image';

export default function CertificateNotFound() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/40 bg-[#0f1115]/80 backdrop-blur-xl">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Phazur"
              width={32}
              height={32}
              className="invert opacity-90"
            />
            <span className="text-base sm:text-lg font-semibold tracking-tight">
              PHAZUR
            </span>
          </Link>
          <Link
            href="/signup"
            className="px-3 sm:px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
          >
            Get Certified
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl sm:text-3xl font-semibold mb-3">
            Certificate Not Found
          </h1>
          <p className="text-slate-400 mb-8">
            This certificate ID does not exist in our system. It may have been
            revoked, or the link may be incorrect.
          </p>

          {/* Possible Reasons */}
          <div className="bg-[#16181d] border border-slate-800/60 rounded-xl p-5 mb-8 text-left">
            <p className="text-sm font-medium text-slate-300 mb-3">
              Possible reasons:
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-slate-600">-</span>
                The certificate ID in the URL is incorrect
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600">-</span>
                The certificate has been revoked
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600">-</span>
                The link has expired or was shared incorrectly
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Homepage
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Get Certified
            </Link>
          </div>

          {/* Help Text */}
          <p className="mt-8 text-xs text-slate-600">
            If you believe this is an error, please contact{' '}
            <a
              href="mailto:support@phazur.com"
              className="text-cyan-500 hover:text-cyan-400"
            >
              support@phazur.com
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-6 bg-[#0a0b0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
            <Image
              src="/logo.png"
              alt="Phazur"
              width={16}
              height={16}
              className="invert opacity-60"
            />
            <span>Phazur - Build. Ship. Prove.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
