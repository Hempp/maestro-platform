/**
 * PUBLIC CERTIFICATE VERIFICATION PAGE (Alternative Route)
 * /verify/certificate/[id]
 *
 * This route handles database certificate ID verification.
 * Mirrors the functionality of /verify/[id] for backwards compatibility.
 *
 * For blockchain token verification by token ID, see /verify/[tokenId]
 */

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Json } from '@/types/database.types';
import CertificateVerificationClient from '@/components/certificate/CertificateVerificationClient';
import PrintStyles from '@/components/PrintStyles';

// Types
interface CertificateMetadata {
  certificationName?: string;
  designation?: string;
  akusCompleted?: number;
  totalLearningTime?: number;
  struggleScore?: number;
  issuerName?: string;
  issuerTitle?: string;
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
      gradientAlt: 'from-purple-400 via-violet-500 to-purple-600',
      ring: 'ring-purple-500/20',
      glow: 'shadow-purple-500/20',
      name: 'purple',
    },
    employee: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      gradient: 'from-cyan-500 to-blue-600',
      gradientAlt: 'from-cyan-400 via-blue-500 to-cyan-600',
      ring: 'ring-cyan-500/20',
      glow: 'shadow-cyan-500/20',
      name: 'cyan',
    },
    owner: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-600',
      gradientAlt: 'from-emerald-400 via-teal-500 to-emerald-600',
      ring: 'ring-emerald-500/20',
      glow: 'shadow-emerald-500/20',
      name: 'emerald',
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

function getExpirationStatus(expiresAt: string | null): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
  message: string;
} {
  if (!expiresAt) {
    return { isExpired: false, isExpiringSoon: false, daysRemaining: null, message: 'No Expiration' };
  }

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { isExpired: true, isExpiringSoon: false, daysRemaining: diffDays, message: 'Expired' };
  } else if (diffDays <= 30) {
    return { isExpired: false, isExpiringSoon: true, daysRemaining: diffDays, message: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}` };
  } else if (diffDays <= 90) {
    return { isExpired: false, isExpiringSoon: true, daysRemaining: diffDays, message: `Expires in ${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) === 1 ? '' : 's'}` };
  }

  return { isExpired: false, isExpiringSoon: false, daysRemaining: diffDays, message: 'Valid' };
}

function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  const description = `Verified: ${holderName} has earned the ${certificationName} certification from Phazur. Certificate ID: ${certificate.certificate_number}. This credential demonstrates mastery in AI operations and workflow automation.`;

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

  const expirationStatus = getExpirationStatus(certificate.expires_at);
  const hasBlockchain = !!certificate.token_id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phazur.com';
  const verificationUrl = `${baseUrl}/verify/certificate/${id}`;

  // Issuer information
  const issuerName = metadata.issuerName || 'Phazur Certification Authority';
  const issuerTitle = metadata.issuerTitle || 'AI Education Platform';

  return (
    <div className="min-h-screen bg-[#0f1115] text-white print:bg-white print:text-black">
      {/* Print Styles */}
      <PrintStyles />

      {/* Header - Hidden on Print */}
      <header className="border-b border-slate-800/40 bg-[#0f1115]/80 backdrop-blur-xl print:hidden">
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
            <span className="text-xs text-slate-500 hidden sm:inline">Certificate Verification</span>
            <Link
              href="/signup"
              className="px-3 sm:px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              Get Certified
            </Link>
          </div>
        </nav>
      </header>

      {/* Print Header */}
      <div className="hidden print:block mb-8 pb-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PHAZUR</h1>
              <p className="text-xs text-gray-500">Certificate Verification</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Verified: {new Date().toLocaleDateString()}</p>
            <p>{verificationUrl}</p>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:py-0">
        {/* Animated Verification Badge */}
        <div
          className={`mb-8 p-4 sm:p-5 rounded-xl border print:rounded-none print:border-2 ${
            expirationStatus.isExpired
              ? 'bg-red-500/10 border-red-500/30 print:border-red-500'
              : expirationStatus.isExpiringSoon
              ? 'bg-amber-500/10 border-amber-500/30 print:border-amber-500'
              : 'bg-emerald-500/10 border-emerald-500/30 print:border-emerald-500'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3">
            <div className="flex items-center gap-3">
              {expirationStatus.isExpired ? (
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
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
                </div>
              ) : (
                <div className="relative">
                  {/* Animated pulse ring */}
                  <div className="absolute inset-0 animate-ping opacity-30">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="relative w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <div>
                <p className={`font-semibold text-lg ${
                  expirationStatus.isExpired ? 'text-red-400' :
                  expirationStatus.isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'
                } print:text-black`}>
                  {expirationStatus.isExpired ? 'Certificate Expired' : 'Verified Credential'}
                </p>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  {expirationStatus.isExpired
                    ? `Expired on ${formatDate(certificate.expires_at)}`
                    : expirationStatus.isExpiringSoon
                    ? expirationStatus.message
                    : 'This certificate is valid and verified by Phazur'}
                </p>
              </div>
            </div>

            {/* Verification Timestamp */}
            {certificate.verified_at && (
              <div className="sm:ml-auto text-xs text-slate-500 print:text-gray-500">
                <span className="hidden sm:inline">Last verified: </span>
                {formatDate(certificate.verified_at)}
              </div>
            )}
          </div>

          {/* Blockchain verification badge */}
          {hasBlockchain && !expirationStatus.isExpired && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 print:border-gray-300">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <span className="text-purple-400 font-medium print:text-purple-700">Immutably recorded on Polygon blockchain</span>
              </div>
            </div>
          )}
        </div>

        {/* Client-side Interactive Features */}
        <CertificateVerificationClient
          certificateId={id}
          certificateNumber={certificate.certificate_number}
          holderName={holderName}
          certificationName={certificationName}
          verificationUrl={verificationUrl}
          pathColor={colors.name}
        />

        {/* Certificate Card */}
        <div
          className={`relative bg-[#16181d] border border-slate-800/60 rounded-2xl overflow-hidden ring-1 ${colors.ring} shadow-2xl ${colors.glow} print:bg-white print:border-2 print:border-gray-300 print:shadow-none print:rounded-lg`}
        >
          {/* Decorative gradient top bar */}
          <div className={`h-2 bg-gradient-to-r ${colors.gradient} print:h-3`} />

          {/* Certificate watermark pattern - hidden on print */}
          <div className="absolute inset-0 opacity-[0.02] print:hidden" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.03) 10px,
              rgba(255,255,255,0.03) 20px
            )`
          }} />

          <div className="relative p-6 sm:p-8 lg:p-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
              <div className="flex-1">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.bg} ${colors.border} border rounded-full text-xs mb-4 print:bg-gray-100 print:border-gray-300`}
                >
                  <span className={`${colors.text} font-medium print:text-gray-700`}>{pathDisplayName}</span>
                  {hasBlockchain && (
                    <>
                      <span className="text-slate-600 print:text-gray-400">|</span>
                      <span className="text-purple-400 print:text-purple-700">SBT Verified</span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 print:text-gray-900">
                  {certificationName}
                </h1>
                <p className="text-slate-400 text-lg print:text-gray-600">{designation}</p>
              </div>
              <div className="flex-shrink-0">
                {certificate.users?.avatar_url ? (
                  <Image
                    src={certificate.users.avatar_url}
                    alt={holderName}
                    width={96}
                    height={96}
                    className="rounded-full ring-4 ring-slate-700 shadow-xl print:ring-2 print:ring-gray-300"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ring-4 ring-slate-700 shadow-xl print:ring-2 print:ring-gray-300 print:bg-gray-100">
                    <span className="text-3xl font-bold text-slate-300 print:text-gray-600">
                      {holderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Holder Info */}
            <div className="mb-8 pb-8 border-b border-slate-800/60 print:border-gray-200">
              <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider print:text-gray-500">Awarded to</p>
              <p className="text-2xl sm:text-3xl font-bold text-white print:text-gray-900">{holderName}</p>
            </div>

            {/* Details Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800/30 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 print:text-gray-500">
                  Issue Date
                </p>
                <p className="text-white font-semibold print:text-gray-900">
                  {formatDate(certificate.issued_at)}
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 print:text-gray-500">
                  Certificate ID
                </p>
                <p className="text-white font-mono text-sm font-semibold print:text-gray-900">
                  {certificate.certificate_number}
                </p>
              </div>
              {certificate.expires_at && (
                <div className="bg-slate-800/30 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 print:text-gray-500">
                    Expiration
                  </p>
                  <p className={`font-semibold ${
                    expirationStatus.isExpired ? 'text-red-400' :
                    expirationStatus.isExpiringSoon ? 'text-amber-400' : 'text-white'
                  } print:text-gray-900`}>
                    {formatDate(certificate.expires_at)}
                  </p>
                </div>
              )}
              {certificate.grade && (
                <div className="bg-slate-800/30 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 print:text-gray-500">
                    Grade Achieved
                  </p>
                  <p className={`text-xl font-bold ${colors.text} print:text-gray-900`}>{certificate.grade}</p>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            {(metadata.akusCompleted || metadata.totalLearningTime || metadata.struggleScore) && (
              <div className="bg-slate-800/30 rounded-xl p-5 mb-8 print:bg-gray-50 print:border print:border-gray-200">
                <p className="text-sm text-slate-400 mb-4 font-medium print:text-gray-600">Performance Metrics</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {metadata.akusCompleted && (
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                      <p className={`text-3xl font-bold bg-gradient-to-r ${colors.gradientAlt} bg-clip-text text-transparent print:text-gray-900`}>
                        {metadata.akusCompleted}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 print:text-gray-500">Modules Completed</p>
                    </div>
                  )}
                  {metadata.totalLearningTime && (
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                      <p className={`text-3xl font-bold bg-gradient-to-r ${colors.gradientAlt} bg-clip-text text-transparent print:text-gray-900`}>
                        {metadata.totalLearningTime}h
                      </p>
                      <p className="text-xs text-slate-500 mt-1 print:text-gray-500">Learning Time</p>
                    </div>
                  )}
                  {metadata.struggleScore && (
                    <div className="text-center p-4 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                      <p className={`text-3xl font-bold bg-gradient-to-r ${colors.gradientAlt} bg-clip-text text-transparent print:text-gray-900`}>
                        {metadata.struggleScore}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 print:text-gray-500">Mastery Score</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issuer Information */}
            <div className="mb-8 pb-8 border-b border-slate-800/60 print:border-gray-200">
              <p className="text-sm text-slate-500 mb-4 font-medium uppercase tracking-wider print:text-gray-500">Issued By</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center print:bg-gray-100 print:border print:border-gray-200">
                  <Image
                    src="/logo.png"
                    alt="Phazur"
                    width={32}
                    height={32}
                    className="invert opacity-90 print:invert-0"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white print:text-gray-900">{issuerName}</p>
                  <p className="text-sm text-slate-400 print:text-gray-600">{issuerTitle}</p>
                </div>
              </div>
            </div>

            {/* Course Information */}
            {certificate.courses && (
              <div className="mb-8 pb-8 border-b border-slate-800/60 print:border-gray-200">
                <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-wider print:text-gray-500">Course Completed</p>
                <h3 className="text-lg font-semibold text-white mb-2 print:text-gray-900">
                  {certificate.courses.title}
                </h3>
                {certificate.courses.description && (
                  <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                    {certificate.courses.description}
                  </p>
                )}
                {certificate.courses.level && (
                  <span className={`inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${colors.border} border print:bg-gray-100 print:text-gray-700 print:border-gray-300`}>
                    {certificate.courses.level} Level
                  </span>
                )}
              </div>
            )}

            {/* Blockchain Verification Section */}
            {hasBlockchain && (
              <div
                className={`${colors.bg} border ${colors.border} rounded-xl p-5 print:bg-purple-50 print:border-purple-200`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 shadow-lg print:bg-purple-100`}
                  >
                    <svg
                      className="w-6 h-6 text-white print:text-purple-700"
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white print:text-gray-900">
                        Blockchain Verified (SBT)
                      </p>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-full uppercase tracking-wider print:bg-purple-100 print:text-purple-700">
                        Immutable
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 print:text-gray-600">
                      This credential is permanently recorded on the Polygon blockchain
                      as a non-transferable Soulbound Token, providing tamper-proof verification.
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                        <span className="text-slate-500 print:text-gray-500">Token ID:</span>
                        <span className="text-white font-mono font-medium print:text-gray-900">
                          #{certificate.token_id}
                        </span>
                      </div>
                      {certificate.contract_address && (
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                          <span className="text-slate-500 print:text-gray-500">Contract:</span>
                          <span className="text-white font-mono text-sm print:text-gray-900" title={certificate.contract_address}>
                            {truncateAddress(certificate.contract_address)}
                          </span>
                        </div>
                      )}
                      {certificate.ipfs_hash && (
                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg print:bg-white print:border print:border-gray-200">
                          <span className="text-slate-500 print:text-gray-500">IPFS Hash:</span>
                          <span className="text-white font-mono text-sm print:text-gray-900" title={certificate.ipfs_hash}>
                            {truncateAddress(certificate.ipfs_hash)}
                          </span>
                        </div>
                      )}
                      {certificate.transaction_hash && (
                        <a
                          href={`https://polygonscan.com/tx/${certificate.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2 mt-2 ${colors.bg} ${colors.border} border rounded-lg ${colors.text} hover:opacity-80 transition-opacity font-medium print:text-purple-700 print:border-purple-300`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          View on PolygonScan
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Non-blockchain notice */}
            {!hasBlockchain && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 print:bg-gray-50 print:border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center flex-shrink-0 print:bg-gray-200">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1 print:text-gray-900">
                      Platform Verified
                    </p>
                    <p className="text-sm text-slate-400 print:text-gray-600">
                      This certificate is verified by the Phazur platform. The holder
                      can upgrade this credential to a Soulbound Token (SBT) on the
                      Polygon blockchain for permanent, immutable proof of achievement.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Sharing Section - Hidden on Print */}
        <div className="mt-10 text-center print:hidden">
          <p className="text-sm text-slate-500 mb-5">Share this credential</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0077B5] hover:bg-[#006699] rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-[#0077B5]/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `I earned the ${certificationName} certification from @Phazur! Verify my credential:`
              )}&url=${encodeURIComponent(verificationUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`${holderName} - ${certificationName} Certificate`)}&body=${encodeURIComponent(`I earned the ${certificationName} certification from Phazur!\n\nVerify my credential: ${verificationUrl}`)}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Email
            </a>
          </div>
        </div>

        {/* CTA Section - Hidden on Print */}
        <div className="mt-16 text-center print:hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-slate-900/80 border border-slate-700/50 rounded-2xl p-8 sm:p-10">
            {/* Decorative gradient orbs */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${colors.gradient} rounded-full opacity-10 blur-3xl`} />
            <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br ${colors.gradient} rounded-full opacity-10 blur-3xl`} />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to earn your certification?
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join thousands of professionals mastering AI operations.
                Start your learning journey today - free until you are certified.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] shadow-xl"
                >
                  Start Learning Free
                  <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center px-6 py-4 text-white hover:text-slate-300 font-medium transition-colors"
                >
                  Explore Paths
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Hidden on Print */}
      <footer className="border-t border-slate-800/40 py-8 bg-[#0a0b0e] mt-16 print:hidden">
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
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Polygon Network
              </span>
              <span>Verified by Phazur Platform</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Print Footer */}
      <div className="hidden print:block mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>This certificate was verified on {new Date().toLocaleDateString()} at {verificationUrl}</p>
        <p className="mt-1">Phazur - Build. Ship. Prove. | Verified by Phazur Platform</p>
      </div>
    </div>
  );
}
