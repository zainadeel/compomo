export type SafeUrlProtocol = 'blob:' | 'http:' | 'https:' | 'mailto:';

export interface ResolveSafeUrlOptions {
  protocols?: readonly SafeUrlProtocol[];
  baseUrl?: string | URL;
}

const DEFAULT_PROTOCOLS: readonly SafeUrlProtocol[] = ['http:', 'https:'];

/**
 * Resolve a consumer-authored URL only when its protocol is explicitly allowed.
 * Relative URLs use the current document base in browser rendering; server-side
 * callers can provide `baseUrl` when they intentionally support relative input.
 */
export function resolveSafeUrl(
  value: string | null | undefined,
  options: ResolveSafeUrlOptions = {}
): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  const baseUrl =
    options.baseUrl ?? (typeof document === 'undefined' ? undefined : document.baseURI);

  try {
    const url = baseUrl === undefined ? new URL(candidate) : new URL(candidate, baseUrl);
    const protocols = options.protocols ?? DEFAULT_PROTOCOLS;
    return protocols.includes(url.protocol as SafeUrlProtocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
