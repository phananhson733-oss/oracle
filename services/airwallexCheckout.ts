// Airwallex Hosted Payment Page redirect via CDN-loaded SDK
// Uses the official redirectToCheckout() which auto-redirects to successUrl after payment

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadAirwallexScript(env: 'demo' | 'prod'): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    const base = env === 'demo'
      ? 'https://checkout-demo.airwallex.com'
      : 'https://checkout.airwallex.com';
    const script = document.createElement('script');
    script.src = `${base}/assets/elements.bundle.min.js`;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Airwallex SDK'));
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export async function redirectToAirwallexCheckout(params: {
  env: 'demo' | 'prod';
  intentId: string;
  clientSecret: string;
  currency: string;
  successUrl: string;
}): Promise<void> {
  await loadAirwallexScript(params.env);

  const Airwallex = (window as any).Airwallex;
  if (!Airwallex?.redirectToCheckout) {
    throw new Error('Airwallex SDK not available');
  }

  Airwallex.redirectToCheckout({
    env: params.env,
    mode: 'payment',
    intent_id: params.intentId,
    client_secret: params.clientSecret,
    currency: params.currency,
    successUrl: params.successUrl,
  });
}
