'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';

interface RouteProtectionProps {
  children: React.ReactNode;
  requireConnection?: boolean;
  rerequestTo?: string;
  // legacy prop kept for backward compatibility; treated as requireConnection=true
  requiredRole?: 'user' | 'dao_member';
}

export function RouteProtection({ 
  children, 
  requireConnection, 
  rerequestTo = '/dashboard',
  requiredRole,
}: RouteProtectionProps) {
  const { isConnected, isInitialized } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const checkAccess = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const needsConnection = requireConnection ?? (typeof requiredRole !== 'undefined');
      const hasAccess = needsConnection ? isConnected : true;

      if (hasAccess) {
        setIsAuthorized(true);
        setIsChecking(false);
      } else {
        setIsChecking(false);
        router.replace(rerequestTo);
      }
    };

    checkAccess();
  }, [isInitialized, isConnected, requireConnection, requiredRole, rerequestTo, router]);

  if (isChecking || !isInitialized || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!isInitialized ? 'Initializing wallet...' : 
             isChecking ? 'Checking permissions...' : 
             'Rerequesting...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
