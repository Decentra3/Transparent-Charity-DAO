'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useOnchainStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

export function useWallet() {
  const { address, isConnected, isConnecting, status } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { open } = useAppKit();
  const setWallet = useOnchainStore((s) => s.setWallet);

  const connectWallet = useCallback(async () => {
    // Open AppKit modal to connect
    await open?.();
  }, [open]);

  const disconnectWallet = useCallback(async () => {
    await disconnectAsync();
  }, [disconnectAsync]);

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  // Auto-create user when wallet connects
  useEffect(() => {
    const createUserOnConnect = async () => {
      if (isConnected && address) {
        try {
          // Always call createUser when wallet connects (backend handles duplicates)
          await apiClient.createUser({ wallet_address: address });
          console.log('User created/updated for wallet:', address);
        } catch (error) {
          console.log('User creation handled by backend:', error);
          // Don't throw error - backend handles duplicate users gracefully
        }
      }
    };

    createUserOnConnect();
  }, [isConnected, address]);

  // Sync to global store (address, connected, and derived role)
  useEffect(() => {
    void setWallet(address ?? null, isConnected);
  }, [address, isConnected, setWallet]);

  return {
    isConnected,
    address,
    displayAddress,
    isConnecting: isConnecting || status === 'reconnecting',
    connectWallet,
    disconnectWallet,
    // Kept for compatibility with previous code, now always true once hook runs client-side
    isInitialized: true,
  };
}
