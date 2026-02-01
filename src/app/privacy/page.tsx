/**
 * PRIVACY POLICY
 * FERPA-aligned data protection for educational records
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="/" className="text-xl font-bold text-white">
            MAESTRO
          </a>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Educational Records Protection</h2>
            <p className="text-slate-300 mb-4">
              Maestro is committed to protecting your educational records in alignment with
              the Family Educational Rights and Privacy Act (FERPA) principles. While Maestro
              is not a FERPA-covered institution, we voluntarily adopt these standards to
              ensure the highest level of privacy protection for our learners.
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>You have the right to access your educational records</li>
              <li>You have the right to request corrections to your records</li>
              <li>We will not disclose your records without your consent</li>
              <li>You will be notified of your privacy rights annually</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Data We Collect</h2>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Learning Data</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
              <li>Course progress and completion status</li>
              <li>Assessment scores and struggle scores</li>
              <li>Time spent on learning activities</li>
              <li>Hints requested and used</li>
              <li>Workflow sandbox interactions</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-200 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
              <li>Email address (if provided)</li>
              <li>Wallet address (for certificate minting)</li>
              <li>Business tier selection</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-200 mb-2">Interaction DNA (Anonymized)</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Typing patterns (for adaptive learning)</li>
              <li>Learning style preferences</li>
              <li>Struggle areas and mastered concepts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li><strong>Personalization:</strong> Adapt content to your learning style</li>
              <li><strong>Progress Tracking:</strong> Show your advancement through courses</li>
              <li><strong>Certification:</strong> Verify completion for blockchain credentials</li>
              <li><strong>Improvement:</strong> Enhance our curriculum based on aggregate patterns</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Data Sharing</h2>
            <p className="text-slate-300 mb-4">We do not sell your data. We share data only:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>With your explicit consent (e.g., verification by employers)</li>
              <li>To mint your blockchain certificate (wallet address + achievement data)</li>
              <li>When required by law</li>
              <li>In aggregate, anonymized form for research</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Blockchain Certificates</h2>
            <p className="text-slate-300 mb-4">
              When you earn a certificate, the following is permanently recorded on the
              Polygon blockchain:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Your wallet address</li>
              <li>Certification name and date</li>
              <li>Competency levels achieved</li>
              <li>Struggle score</li>
              <li>Maestro verification signature</li>
            </ul>
            <p className="text-slate-400 mt-4 text-sm">
              Note: Blockchain data is immutable and cannot be deleted. Do not mint
              certificates if you do not want this information permanently public.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Your Rights</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account data (excluding blockchain records)</li>
              <li><strong>Portability:</strong> Export your learning data</li>
              <li><strong>Opt-out:</strong> Disable personalization features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Data Security</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>API keys and secrets never exposed to client</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliance (planned)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-slate-300">
              Maestro is not intended for users under 13 years of age. We do not knowingly
              collect personal information from children under 13. If you believe we have
              collected such information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Contact Us</h2>
            <p className="text-slate-300">
              For privacy-related inquiries or to exercise your rights:
            </p>
            <p className="text-blue-400 mt-2">privacy@maestro.ai</p>
          </section>
        </div>
      </main>
    </div>
  );
}
