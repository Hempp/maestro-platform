/**
 * PUBLIC CERTIFICATE VERIFICATION PAGE
 * /verify/certificate/[id]
 *
 * Professional, shareable verification page for Phazur certificates.
 * Designed for LinkedIn sharing and employer validation.
 *
 * This route handles database certificate ID verification.
 * For blockchain token verification, see /verify/[tokenId]
 */

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Json } from '@/types/database.types';

// Types
interface CertificateMetadata {
  certificationName?: string;
  designation?: string;
  akusCompleted?: number;
  totalLearningTime?: number;
  struggleScore?: number;
}

interface CertificateWithUser {
  id: string;
  certificate_number: string;
  grade: string | null;
  issued_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  token_id: string | null;
  contract_address: string | null;
  transaction_hash: string | null;
  ipfs_hash: string | null;
  metadata: Json | null;
  users: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  courses: {
    title: string;
    description: string;
    level: string | null;
  } | null;
}

// Helper functions
function getPathType(courseTitle: string): 'student' | 'employee' | 'owner' {
  const title = courseTitle.toLowerCase();
  if (title.includes('student') || title.includes('associate')) return 'student';
  if (title.includes('employee') || title.includes('efficiency')) return 'employee';
  return 'owner';
}

function getCertificationName(pathType: 'student' | 'employee' | 'owner'): string {
  const names = {
    student: 'Certified AI Associate',
    employee: 'Workflow Efficiency Lead',
    owner: 'AI Operations Master',
  };
  return names[pathType];
}

function getDesignation(pathType: 'student' | 'employee' | 'owner'): string {
  const designations = {
    student: 'Proof of Readiness',
    employee: 'Proof of ROI',
    owner: 'Proof of Scalability',
  };
  return designations[pathType];
}

function getPathDisplayName(pathType: 'student' | 'employee' | 'owner'): string {
  const names = {
    student: 'The Student Path',
    employee: 'The Employee Path',
    owner: 'The Owner Path',
  };
  return names[pathType];
}

function getPathColor(pathType: 'student' | 'employee' | 'owner') {
  const colors = {
    student: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      gradient: 'from-purple-500 to-violet-600',
      ring: 'ring-purple-500/20',
    },
    employee: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      gradient: 'from-cyan-500 to-blue-600',
      ring: 'ring-cyan-500/20',
    },
    owner: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-600',
      ring: 'ring-emerald-500/20',
    },
  };
  return colors[pathType];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Dynamic metadata for Open Graph
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('certificates')
    .select(`
      *,
      users (full_name),
      courses (title)
    `)
    .eq('id', id)
    .single();

  if (!data) {
    return {
      title: 'Certificate Not Found | Phazur',
      description: 'This certificate could not be found.',
    };
  }

  const certificate = data as unknown as CertificateWithUser;
  const holderName = certificate.users?.full_name || 'Anonymous';
  const courseTitle = certificate.courses?.title || '';
  const pathType = getPathType(courseTitle);
  const certificationName = getCertificationName(pathType);

  const title = `${holderName} - ${certificationName} | Phazur`;
  const description = `Verified: ${holderName} has earned the ${certificationName} certification from Phazur. This credential demonstrates mastery in AI operations and workflow automation.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phazur.com';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/verify/certificate/${id}`,
      siteName: 'Phazur',
      images: [
        {
          url: `${baseUrl}/og-certificate.png`,
          width: 1200,
          height: 630,
          alt: `${certificationName} Certificate`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-certificate.png`],
    },
    other: {
      'linkedin:owner': 'Phazur',
    },
  };
}

// Main page component
export default async function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      users (
        full_name,
        avatar_url
      ),
      courses (
        title,
        description,
        level
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const certificate = data as unknown as CertificateWithUser;
  const metadata = (certificate.metadata || {}) as CertificateMetadata;
  const courseTitle = certificate.courses?.title || '';
  const pathType = getPathType(courseTitle);
  const colors = getPathColor(pathType);
  const certificationName = metadata.certificationName || getCertificationName(pathType);
  const designation = metadata.designation || getDesignation(pathType);
  const pathDisplayName = getPathDisplayName(pathType);
  const holderName = certificate.users?.full_name || 'Anonymous';

  const isExpired = certificate.expires_at
    ? new Date(certificate.expires_at) < new Date()
    : false;

  const hasBlockchain = !!certificate.token_id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phazur.com';

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs text-slate-500">Certificate Verification</span>
            <Link
              href="/signup"
              className="px-3 sm:px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Get Certified
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Status Banner */}
        <div
          className={`mb-8 p-4 rounded-xl border ${
            isExpired
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {isExpired ? (
              <>
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-red-400">Certificate Expired</p>
                  <p className="text-sm text-slate-400">
                    This certificate expired on {formatDate(certificate.expires_at)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-emerald-400">Verified Credential</p>
                  <p className="text-sm text-slate-400">
                    This certificate is valid and has been verified by Phazur
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Certificate Card */}
        <div
          className={`relative bg-[#16181d] border border-slate-800/60 rounded-2xl overflow-hidden ring-1 ${colors.ring}`}
        >
          {/* Gradient top bar */}
          <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />

          <div className="p-6 sm:p-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 ${colors.bg} ${colors.border} border rounded-full text-xs mb-4`}
                >
                  <span className={colors.text}>{pathDisplayName}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
                  {certificationName}
                </h1>
                <p className="text-slate-400">{designation}</p>
              </div>
              <div className="flex-shrink-0">
                {certificate.users?.avatar_url ? (
                  <Image
                    src={certificate.users.avatar_url}
                    alt={holderName}
                    width={80}
                    height={80}
                    className="rounded-full ring-2 ring-slate-700"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-slate-700">
                    <span className="text-2xl font-semibold text-slate-400">
                      {holderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Holder Info */}
            <div className="mb-8 pb-8 border-b border-slate-800/60">
              <p className="text-sm text-slate-500 mb-1">Awarded to</p>
              <p className="text-xl font-semibold text-white">{holderName}</p>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Issue Date
                </p>
                <p className="text-white font-medium">
                  {formatDate(certificate.issued_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Certificate ID
                </p>
                <p className="text-white font-mono text-sm">
                  {certificate.certificate_number}
                </p>
              </div>
              {certificate.grade && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Grade
                  </p>
                  <p className="text-white font-medium">{certificate.grade}</p>
                </div>
              )}
            </div>

            {/* Stats Section */}
            {metadata.akusCompleted && (
              <div className="bg-slate-800/30 rounded-xl p-5 mb-8">
                <p className="text-sm text-slate-400 mb-4">Performance Metrics</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-semibold text-white">
                      {metadata.akusCompleted}
                    </p>
                    <p className="text-xs text-slate-500">Modules Completed</p>
                  </div>
                  {metadata.totalLearningTime && (
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-semibold text-white">
                        {metadata.totalLearningTime}h
                      </p>
                      <p className="text-xs text-slate-500">Learning Time</p>
                    </div>
                  )}
                  {metadata.struggleScore && (
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-semibold text-white">
                        {metadata.struggleScore}
                      </p>
                      <p className="text-xs text-slate-500">Mastery Score</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blockchain Verification */}
            {hasBlockchain && (
              <div
                className={`${colors.bg} border ${colors.border} rounded-xl p-5`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">
                      Blockchain Verified (SBT)
                    </p>
                    <p className="text-sm text-slate-400 mb-3">
                      This credential is permanently recorded on the Polygon blockchain
                      as a Soulbound Token.
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Token ID:</span>
                        <span className="text-slate-300 font-mono">
                          {certificate.token_id}
                        </span>
                      </div>
                      {certificate.contract_address && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contract:</span>
                          <span className="text-slate-300 font-mono truncate max-w-[200px]">
                            {certificate.contract_address}
                          </span>
                        </div>
                      )}
                      {certificate.transaction_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${certificate.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 ${colors.text} hover:underline mt-2`}
                        >
                          View on PolygonScan
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Non-blockchain notice */}
            {!hasBlockchain && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5"
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
                  <div>
                    <p className="font-medium text-white mb-1">
                      Platform Verified
                    </p>
                    <p className="text-sm text-slate-400">
                      This certificate is verified by the Phazur platform. The holder
                      can mint this credential as a Soulbound Token (SBT) on the
                      Polygon blockchain for permanent, immutable proof.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">Share this credential</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                `${baseUrl}/verify/certificate/${id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0077B5] hover:bg-[#006699] rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `I earned the ${certificationName} certification from @Phazur!`
              )}&url=${encodeURIComponent(
                `${baseUrl}/verify/certificate/${id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Ready to earn your certification?
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Join thousands of professionals mastering AI operations. Free until
              you are certified.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Start Learning Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/40 py-8 bg-[#0a0b0e] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Phazur"
                width={20}
                height={20}
                className="invert opacity-60"
              />
              <span>Phazur - Build. Ship. Prove.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Polygon Network
              </span>
              <span>Verified by Phazur Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
