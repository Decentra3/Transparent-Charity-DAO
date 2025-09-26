/**
 * Generate a unique ID for requests and projects
 * Format: {type}_{timestamp}_{randomString}
 */
export function generateUniqueId(type: 'request' | 'project'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  return `${type === 'request' ? 'req' : 'proj'}_${timestamp}_${randomString}`;
}

/**
 * Generate a unique project ID for AI analysis
 * Format: {timestamp}_{randomString}
 */
export function generateProjectId(): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 12);
  return `${timestamp}_${randomString}`;
}
