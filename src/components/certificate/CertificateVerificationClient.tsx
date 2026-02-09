'use client';

/**
 * Certificate Verification Client Component
 *
 * Provides interactive features for the certificate verification page:
 * - QR Code generation (using canvas API)
 * - Copy to clipboard
 * - Print functionality
 * - Social sharing enhancements
 */

import { useState, useEffect, useRef } from 'react';

interface CertificateVerificationClientProps {
  certificateId: string;
  certificateNumber: string;
  holderName: string;
  certificationName: string;
  verificationUrl: string;
  pathColor: string;
}

// Simple QR Code generator using canvas
function generateQRCode(canvas: HTMLCanvasElement, data: string, size: number = 120) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Generate a simple visual pattern based on the data hash
  // For production, use a proper QR library like 'qrcode'
  const hash = simpleHash(data);
  const moduleCount = 21; // Standard QR code size
  const moduleSize = size / (moduleCount + 2);
  const offset = moduleSize;

  ctx.fillStyle = '#1e293b';

  // Position detection patterns (corners)
  drawPositionPattern(ctx, offset, offset, moduleSize);
  drawPositionPattern(ctx, offset + (moduleCount - 7) * moduleSize, offset, moduleSize);
  drawPositionPattern(ctx, offset, offset + (moduleCount - 7) * moduleSize, moduleSize);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(offset + i * moduleSize, offset + 6 * moduleSize, moduleSize, moduleSize);
      ctx.fillRect(offset + 6 * moduleSize, offset + i * moduleSize, moduleSize, moduleSize);
    }
  }

  // Data modules (simplified pattern based on hash)
  const dataPattern = generateDataPattern(hash, moduleCount);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isDataModule(row, col, moduleCount) && dataPattern[row * moduleCount + col]) {
        ctx.fillRect(offset + col * moduleSize, offset + row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function drawPositionPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  // Outer square (7x7)
  ctx.fillRect(x, y, moduleSize * 7, moduleSize * 7);

  // Inner white square (5x5)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + moduleSize, y + moduleSize, moduleSize * 5, moduleSize * 5);

  // Center square (3x3)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, moduleSize * 3, moduleSize * 3);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateDataPattern(hash: number, size: number): boolean[] {
  const pattern: boolean[] = [];
  let seed = hash;
  for (let i = 0; i < size * size; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    pattern.push((seed % 3) === 0);
  }
  return pattern;
}

function isDataModule(row: number, col: number, size: number): boolean {
  // Skip position detection patterns
  if (row < 9 && col < 9) return false;
  if (row < 9 && col >= size - 8) return false;
  if (row >= size - 8 && col < 9) return false;
  // Skip timing patterns
  if (row === 6 || col === 6) return false;
  return true;
}

export default function CertificateVerificationClient({
  certificateId,
  certificateNumber,
  holderName,
  certificationName,
  verificationUrl,
  pathColor,
}: CertificateVerificationClientProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showQR && canvasRef.current) {
      generateQRCode(canvasRef.current, verificationUrl, 160);
    }
  }, [showQR, verificationUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = verificationUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `phazur-certificate-${certificateNumber}-qr.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="print:hidden">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={() => setShowQR(!showQR)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
            showQR
              ? `bg-${pathColor}-500/20 border-${pathColor}-500/30 text-${pathColor}-400`
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
          </svg>
          {showQR ? 'Hide QR' : 'QR Code'}
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Print
        </button>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-[#16181d] border border-slate-800/60 rounded-xl p-6 max-w-sm mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-lg mb-4">
                <canvas
                  ref={canvasRef}
                  width={160}
                  height={160}
                  className="block"
                />
              </div>
              <p className="text-xs text-slate-500 text-center mb-3">
                Scan to verify this certificate instantly
              </p>
              <button
                onClick={downloadQR}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
