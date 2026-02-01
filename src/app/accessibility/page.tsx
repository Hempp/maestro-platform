/**
 * ACCESSIBILITY STATEMENT
 * WCAG 2.1 AA Compliance Declaration
 */

export default function AccessibilityPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8">Accessibility Statement</h1>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Our Commitment</h2>
            <p className="text-slate-300 mb-4">
              Maestro is committed to ensuring digital accessibility for people with
              disabilities. We continually improve the user experience for everyone and
              apply relevant accessibility standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Conformance Status</h2>
            <p className="text-slate-300 mb-4">
              The Web Content Accessibility Guidelines (WCAG) defines requirements for
              designers and developers to improve accessibility for people with disabilities.
              It defines three levels of conformance: Level A, Level AA, and Level AAA.
            </p>
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-4">
              <p className="text-emerald-300 font-medium">
                Maestro is designed to conform with WCAG 2.1 Level AA standards.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Accessibility Features</h2>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-6">Keyboard Navigation</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>All interactive elements are accessible via keyboard</li>
              <li>Skip links provided to bypass navigation</li>
              <li>Focus indicators are visible and clear</li>
              <li>No keyboard traps in modals or interactive widgets</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-6">Screen Reader Support</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>All images have descriptive alt text</li>
              <li>ARIA labels for interactive components</li>
              <li>Live regions announce dynamic content changes</li>
              <li>Semantic HTML structure throughout</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-6">Visual Accessibility</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>4.5:1 minimum color contrast for text</li>
              <li>3:1 minimum contrast for UI components</li>
              <li>Text can be resized up to 200% without loss of content</li>
              <li>No reliance on color alone to convey information</li>
              <li>Reduced motion respected via prefers-reduced-motion</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-200 mb-2 mt-6">Cognitive Accessibility</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Clear, simple language in instructions</li>
              <li>Consistent navigation across pages</li>
              <li>Error messages with clear correction suggestions</li>
              <li>Adequate time for task completion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Compatibility</h2>
            <p className="text-slate-300 mb-4">
              Maestro is designed to be compatible with:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Recent versions of popular screen readers (NVDA, JAWS, VoiceOver)</li>
              <li>Modern browsers (Chrome, Firefox, Safari, Edge)</li>
              <li>Mobile devices and responsive layouts</li>
              <li>Browser zoom up to 400%</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Known Limitations</h2>
            <p className="text-slate-300 mb-4">
              While we strive for full accessibility, some areas may have limitations:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                <strong>Workflow Sandbox:</strong> The drag-and-drop interface has
                keyboard alternatives, but complex workflows may be challenging for
                some assistive technologies.
              </li>
              <li>
                <strong>Third-party Integrations:</strong> Some embedded content from
                third parties may not meet our accessibility standards.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Assessment Methods</h2>
            <p className="text-slate-300 mb-4">
              Maestro assesses accessibility through:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Automated testing with axe-core and Lighthouse</li>
              <li>Manual testing with screen readers</li>
              <li>Keyboard-only navigation testing</li>
              <li>Color contrast verification</li>
              <li>User feedback and testing with people with disabilities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Feedback</h2>
            <p className="text-slate-300 mb-4">
              We welcome your feedback on the accessibility of Maestro. If you encounter
              accessibility barriers, please contact us:
            </p>
            <ul className="list-none text-slate-300 space-y-2">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:accessibility@maestro.ai" className="text-blue-400 hover:underline">
                  accessibility@maestro.ai
                </a>
              </li>
            </ul>
            <p className="text-slate-400 mt-4 text-sm">
              We aim to respond to accessibility feedback within 5 business days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Enforcement</h2>
            <p className="text-slate-300">
              If you are not satisfied with our response to your accessibility concern,
              you may escalate to the appropriate regulatory body in your jurisdiction.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
