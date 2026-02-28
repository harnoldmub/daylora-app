import { Resend } from 'resend';

const FROM_EMAIL = 'Daylora <noreply@daylora.app>';

let connectionSettings: any;

async function getApiKey(): Promise<string> {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('No Resend credentials found. Set RESEND_API_KEY or configure the Resend connector.');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return connectionSettings.settings.api_key;
}

export async function getUncachableResendClient() {
  const apiKey = await getApiKey();
  console.log(`[resend] Sending from: ${FROM_EMAIL}`);
  return {
    client: new Resend(apiKey),
    fromEmail: FROM_EMAIL
  };
}
