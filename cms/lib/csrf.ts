const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function isTrustedOrigin(request: Request, expectedOrigin: string): boolean {
  if (SAFE_METHODS.has(request.method)) return true
  const origin = request.headers.get('Origin')
  return origin === expectedOrigin
}
