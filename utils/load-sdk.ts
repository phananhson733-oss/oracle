const sdkCache = new Map<string, Promise<void>>();

export function loadScript(id: string, src: string): Promise<void> {
  if (sdkCache.has(id)) return sdkCache.get(id)!;

  const existing = document.getElementById(id);
  if (existing) {
    const p = Promise.resolve();
    sdkCache.set(id, p);
    return p;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

  sdkCache.set(id, promise);
  return promise;
}

export const loadGoogleSDK = () =>
  loadScript('google-gsi', 'https://accounts.google.com/gsi/client');

export const loadAppleSDK = () =>
  loadScript('apple-auth', 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
