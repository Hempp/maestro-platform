'use client';

/**
 * Print Styles Component
 * Client component to inject print-specific CSS
 */

export default function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 0.5in;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print\\:hidden {
          display: none !important;
        }
        .print\\:block {
          display: block !important;
        }
        .print\\:bg-white {
          background-color: white !important;
        }
        .print\\:text-black {
          color: black !important;
        }
        .print\\:border-gray-300 {
          border-color: #d1d5db !important;
        }
        .print\\:shadow-none {
          box-shadow: none !important;
        }
      }
    `}</style>
  );
}
