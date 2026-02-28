import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  if (process.env.RESEND_API_KEY) {
    const from = process.env.SMTP_FROM || 'noreply@daylora.app';
    console.log(`[resend] Using RESEND_API_KEY env var, from: ${from}`);
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: from,
    };
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
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  const resolvedFrom = process.env.SMTP_FROM || 'Daylora <noreply@daylora.app>';
  return {
    client: new Resend(apiKey),
    fromEmail: resolvedFrom
  };
}
