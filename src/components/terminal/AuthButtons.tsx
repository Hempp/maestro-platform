'use client';

/**
 * MAGIC LINK AUTH BUTTONS
 * One-click authentication with Google or Crypto Wallet
 */

import { useState } from 'react';

interface AuthButtonsProps {
  onAuthSuccess?: (method: 'google' | 'wallet', address?: string) => void;
  compact?: boolean;
}

export default function AuthButtons({ onAuthSuccess, compact = false }: AuthButtonsProps) {
  const [isConnecting, setIsConnecting] = useState<'google' | 'wallet' | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setIsConnecting('google');

    // Simulate OAuth flow - in production, use next-auth or similar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo, simulate success
    setIsConnecting(null);
    onAuthSuccess?.('google');
  };

  const handleWalletConnect = async () => {
    setIsConnecting('wallet');

    try {
      // Check if MetaMask or similar is available
      const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;

      if (ethereum) {
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnecting(null);
        onAuthSuccess?.('wallet', address);
      } else {
        // No wallet detected - show install prompt
        alert('Please install MetaMask or another Web3 wallet to continue');
        setIsConnecting(null);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setIsConnecting(null);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletAddress) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 border border-emerald-500/50 rounded-lg text-sm">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-emerald-400 font-mono">{truncateAddress(walletAddress)}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleGoogleAuth}
          disabled={isConnecting !== null}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-slate-600 rounded-lg text-sm text-white transition flex items-center gap-2 disabled:opacity-50"
        >
          {isConnecting === 'google' ? (
            <span className="animate-spin">G</span>
          ) : (
            <GoogleIcon />
          )}
          <span className="hidden sm:inline">Google</span>
        </button>
        <button
          onClick={handleWalletConnect}
          disabled={isConnecting !== null}
          className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-sm text-orange-400 transition flex items-center gap-2 disabled:opacity-50"
        >
          {isConnecting === 'wallet' ? (
            <span className="animate-spin">W</span>
          ) : (
            <WalletIcon />
          )}
          <span className="hidden sm:inline">Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
      <button
        onClick={handleGoogleAuth}
        disabled={isConnecting !== null}
        className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-medium transition flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isConnecting === 'google' ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      <button
        onClick={handleWalletConnect}
        disabled={isConnecting !== null}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isConnecting === 'wallet' ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <WalletIcon />
        )}
        Connect Wallet
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}
