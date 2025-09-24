/**
 * IPFS utility functions for Pinata integration
 */

/**
 * Get IPFS URL for a given hash (CID)
 * Uses NEXT_PUBLIC_GATEWAY_URL from environment variables
 * Falls back to public Pinata gateway if not configured
 */
export function getIPFSUrl(hash: string): string | undefined {
  // Debug logs
  // eslint-disable-next-line no-console
  // console.log('[IPFS] getIPFSUrl called with hash:', hash);

  if (!hash) {
    // eslint-disable-next-line no-console
    console.warn('[IPFS] getIPFSUrl received empty/undefined hash');
    return undefined;
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'gateway.pinata.cloud';
  const url = `https://${gatewayUrl}/ipfs/${hash}`;

  // eslint-disable-next-line no-console
  // console.log('[IPFS] Using gateway:', gatewayUrl, '→ URL:', url);

  return url;
}

/**
 * Detect file type based on hash or filename patterns
 * This is a simple heuristic - in production you might want to check actual file content
 */
export function getFileType(hash: string): 'image' | 'document' | 'file' | null {
  // Debug logs
  // eslint-disable-next-line no-console
  // console.log('[IPFS] getFileType called with hash:', hash);

  if (!hash) {
    // eslint-disable-next-line no-console
    console.warn('[IPFS] getFileType received empty/undefined hash');
    return null;
  }

  // Simple pattern matching - in production you might want to check actual file content
  if (hash.includes('image') || hash.includes('img') || hash.includes('jpg') || hash.includes('png') || hash.includes('gif')) {
    // eslint-disable-next-line no-console
    // console.log('[IPFS] getFileType result: image');
    return 'image';
  }
  
  if (hash.includes('pdf') || hash.includes('doc') || hash.includes('txt')) {
    // eslint-disable-next-line no-console
    // console.log('[IPFS] getFileType result: document');
    return 'document';
  }
  
  // eslint-disable-next-line no-console
  // console.log('[IPFS] getFileType result: file (default)');
  return 'file';
}

/**
 * Format IPFS hash for display (truncate if too long)
 */
export function formatIPFSHash(hash: string, maxLength: number = 20): string {
  // Debug logs
  // eslint-disable-next-line no-console
  // console.log('[IPFS] formatIPFSHash called with hash length:', hash ? hash.length : 0, 'maxLength:', maxLength);

  if (!hash) return '';
  if (hash.length <= maxLength) {
    // eslint-disable-next-line no-console
    // console.log('[IPFS] formatIPFSHash result (no truncate):', hash);
    return hash;
  }
  const truncated = `${hash.slice(0, maxLength)}...`;
  // eslint-disable-next-line no-console
  // console.log('[IPFS] formatIPFSHash result (truncated):', truncated);
  return truncated;
}
