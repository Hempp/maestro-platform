'use client';

/**
 * CREDENTIAL VERIFICATION PORTAL
 * Allows employers to verify Maestro certificates
 * Checks blockchain for SBT authenticity
 */

import { useState } from 'react';

interface MicroCredentialResult {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface VerificationResult {
  valid: boolean;
  certificate?: {
    holderAddress: string;
    certificationName: string;
    path: 'student' | 'employee' | 'owner';
    level: string;
    issueDate: string;
    competencies: {
      name: string;
      level: number;
    }[];
    struggleScore: number;
    totalLearningTime: number;
    akusCompleted: number;
  };
  officialCertificate?: {
    name: string;
    designation: string;
    path: string;
    focus: string;
    outcome: string;
  };
  microCredentials?: MicroCredentialResult[];
  interpretation?: {
    struggleScore: { rating: string; description: string };
    certificationLevel: string;
    employerValue: string;
  };
  blockchainProof?: {
    chain: string;
    transactionHash: string;
    verifyOnExplorer: string;
  };
  error?: string;
}

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!tokenId && !walletAddress) return;

    setIsVerifying(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, walletAddress }),
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ valid: false, error: 'Verification service unavailable' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            MAESTRO
          </a>
          <span className="text-sm text-slate-400">Credential Verification</span>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Verify a Maestro Certificate
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Employers and institutions can verify the authenticity of Maestro
            AI Workflow certifications. Our certificates are blockchain-verified
            Soulbound Tokens (SBTs) on Polygon.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-slate-900 rounded-xl p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="tokenId"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Certificate Token ID
              </label>
              <input
                id="tokenId"
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Enter the SBT token ID"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="tokenId-help"
              />
              <p id="tokenId-help" className="mt-2 text-xs text-slate-500">
                Found on the certificate or in the holder&apos;s wallet
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <div>
              <label
                htmlFor="walletAddress"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Wallet Address
              </label>
              <input
                id="walletAddress"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                aria-describedby="wallet-help"
              />
              <p id="wallet-help" className="mt-2 text-xs text-slate-500">
                View all certificates held by this wallet
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={isVerifying || (!tokenId && !walletAddress)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-busy={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Certificate'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div
            role="region"
            aria-live="polite"
            aria-label="Verification results"
            className={`rounded-xl p-8 ${
              result.valid
                ? 'bg-emerald-900/30 border border-emerald-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            {result.valid && result.certificate ? (
              <>
                {/* Valid Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-emerald-400">
                      Valid Certificate
                    </h2>
                    <p className="text-emerald-300/70">
                      This credential is authentic and blockchain-verified
                    </p>
                  </div>
                </div>

                {/* Official Certificate Banner */}
                {result.officialCertificate && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {result.officialCertificate.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.certificate.path === 'student' ? 'bg-purple-500/20 text-purple-400' :
                        result.certificate.path === 'employee' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {result.officialCertificate.designation}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-2">
                      <strong>Focus:</strong> {result.officialCertificate.focus}
                    </p>
                    <p className="text-emerald-400 text-sm font-medium">
                      {result.officialCertificate.outcome}
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400">Holder Wallet</div>
                      <div className="text-white font-mono text-sm">
                        {result.certificate.holderAddress?.slice(0, 10)}...{result.certificate.holderAddress?.slice(-8)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Issue Date</div>
                      <div className="text-white">
                        {new Date(result.certificate.issueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Learning Time</div>
                      <div className="text-white">
                        {result.certificate.totalLearningTime?.toFixed(1)} hours
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Struggle Score</div>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{result.certificate.struggleScore}/100</span>
                        {result.interpretation && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            result.certificate.struggleScore <= 20 ? 'bg-emerald-500/20 text-emerald-400' :
                            result.certificate.struggleScore <= 40 ? 'bg-blue-500/20 text-blue-400' :
                            result.certificate.struggleScore <= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {result.interpretation.struggleScore.rating}
                          </span>
                        )}
                      </div>
                      {result.interpretation && (
                        <p className="text-xs text-slate-500 mt-1">
                          {result.interpretation.struggleScore.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-2">
                        Verified Competencies ({result.certificate.competencies?.length || 0})
                      </div>
                      <div className="space-y-2">
                        {result.certificate.competencies?.map((comp) => (
                          <div
                            key={comp.name}
                            className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded"
                          >
                            <span className="text-white">{comp.name}</span>
                            <span className="text-emerald-400">
                              Level {comp.level}/5
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro-Credentials */}
                {result.microCredentials && result.microCredentials.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-3">Skill Badges Earned</div>
                    <div className="flex flex-wrap gap-3">
                      {result.microCredentials.map((mc) => (
                        <div
                          key={mc.id}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700"
                        >
                          <span className="text-xl">{mc.icon}</span>
                          <div>
                            <div className="text-white text-sm font-medium">{mc.name}</div>
                            <div className="text-slate-400 text-xs">{mc.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blockchain Proof */}
                {result.blockchainProof && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">
                      Blockchain Verification ({result.blockchainProof.chain})
                    </div>
                    <a
                      href={result.blockchainProof.verifyOnExplorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all"
                    >
                      {result.blockchainProof.transactionHash}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-400">
                    Certificate Not Found
                  </h2>
                  <p className="text-red-300/70">
                    {result.error || 'No valid certificate found for this identifier'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Educational Standards Info */}
        <div className="mt-12 bg-slate-900/50 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Our Educational Standards
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-blue-400 mb-2">
                Competency-Based Assessment
              </h3>
              <p className="text-slate-400">
                All certifications are based on demonstrated competency, not seat
                time. Learners must achieve verified proficiency in each skill area.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-2">
                Industry-Aligned Curriculum
              </h3>
              <p className="text-slate-400">
                Our curriculum maps to O*NET occupational standards, LinkedIn Skills
                data, and major cloud provider certifications (AWS, Google, Azure).
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-2">
                Project-Based Verification
              </h3>
              <p className="text-slate-400">
                Every certification requires completion of a capstone project that
                demonstrates real-world application of learned skills.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-2">
                Blockchain Immutability
              </h3>
              <p className="text-slate-400">
                Certificates are Soulbound Tokens (SBTs) on Polygon—they cannot be
                transferred, forged, or revoked without on-chain evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility Statement */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            This platform is designed to meet WCAG 2.1 AA accessibility standards.
            <br />
            <a href="/accessibility" className="text-blue-400 hover:underline">
              View our Accessibility Statement
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
