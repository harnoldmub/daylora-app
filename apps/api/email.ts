import { type Wedding, type EmailLog } from "@shared/schema";
import { storage } from "./storage";
import { getUncachableResendClient } from "./resend-client";

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emailLayout(wedding: Wedding, content: string) {
  const pc = wedding.config.theme.primaryColor || "#b8956a";
  const sc = wedding.config.theme.secondaryColor || "#f5f0eb";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{margin:0;padding:0;background:#faf9f7;font-family:'Georgia','Times New Roman',serif;color:#3d3d3d;line-height:1.8;-webkit-font-smoothing:antialiased}
  .wrapper{max-width:560px;margin:0 auto;padding:40px 20px}
  .card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06)}
  .top-bar{height:4px;background:linear-gradient(90deg,${pc},${pc})}
  .header{text-align:center;padding:40px 32px 24px}
  .header h1{font-size:28px;font-weight:400;letter-spacing:2px;color:${pc};margin:0}
  .header .divider{width:40px;height:1px;background:${pc};margin:16px auto 0}
  .body{padding:0 32px 32px}
  .body h2{font-size:18px;font-weight:600;color:#2d2d2d;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .body p{font-size:15px;margin:0 0 12px;color:#555}
  .info-card{background:${sc};border-radius:12px;padding:20px 24px;margin:20px 0}
  .info-card p{margin:4px 0;font-size:14px;color:#444}
  .info-card strong{color:#2d2d2d}
  .highlight{background:${pc};color:#fff;border-radius:12px;padding:24px;text-align:center;margin:20px 0}
  .highlight h3{font-size:22px;margin:0 0 6px;font-weight:400;letter-spacing:1px}
  .highlight p{margin:4px 0;font-size:14px;opacity:0.9;color:#fff}
  .cta{display:inline-block;background:${pc};color:#fff !important;padding:14px 32px;border-radius:50px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px;margin-top:8px}
  .cta-outline{display:inline-block;border:1.5px solid ${pc};color:${pc} !important;padding:12px 28px;border-radius:50px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px}
  .footer{text-align:center;padding:24px 32px;font-size:12px;color:#aaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .footer a{color:${pc};text-decoration:none}
  .text-center{text-align:center}
  .mt-8{margin-top:8px}
  .mt-16{margin-top:16px}
  .quote{font-style:italic;color:#777;border-left:3px solid ${pc};padding:8px 16px;margin:16px 0;font-size:15px}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="top-bar"></div>
    <div class="header">
      <h1>${esc(wedding.title)}</h1>
      <div class="divider"></div>
    </div>
    <div class="body">
      ${content}
    </div>
  </div>
  <div class="footer">
    Envoyé avec amour via <a href="https://daylora.app">Daylora</a>
  </div>
</div>
</body>
</html>`;
}

function availabilityLabel(value: string): string {
  const map: Record<string, string> = {
    "19-march": "19 mars uniquement",
    "21-march": "21 mars uniquement",
    both: "Les deux dates",
    unavailable: "Ne pourra pas être présent(e)",
    pending: "En attente de réponse",
    confirmed: "Sera présent(e) avec joie",
    declined: "Ne pourra pas être présent(e)",
  };
  return map[value] || value;
}

function availabilityEmoji(value: string): string {
  if (value === "confirmed" || value === "both") return "🎉";
  if (value === "declined" || value === "unavailable") return "💌";
  return "⏳";
}

async function logEmail(
  weddingId: string,
  recipient: string,
  subject: string,
  type: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  payload?: any
) {
  try {
    await storage.createEmailLog({
      weddingId,
      to: recipient,
      subject,
      type,
      status,
      providerId: null,
      payload: payload || {},
      guestId: payload?.guestId || null,
    });
  } catch (err) {
    console.error("Failed to log email to database:", err);
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const { client, fromEmail } = await getUncachableResendClient();
  const result = await client.emails.send({ from: fromEmail, to, subject, html });
  if (result.error) {
    console.error("[resend] Email send failed:", result.error);
    throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
  }
  console.log("[resend] Email sent, id:", result.data?.id);
  return result;
}

export async function sendRsvpConfirmationEmail(wedding: Wedding, guestData: {
  firstName: string;
  lastName: string;
  availability: string;
}) {
  const type = 'rsvp_received_admin';
  const subject = `Nouvelle réponse RSVP - ${guestData.firstName} ${guestData.lastName}`;

  const owner = await storage.getUser(wedding.ownerId);
  if (!owner?.email) {
    console.warn(`[email] Skipping RSVP admin notification: no email found for owner ${wedding.ownerId}`);
    return;
  }
  const recipient = owner.email;

  try {
    const appDomain = process.env.APP_DOMAIN || "daylora.app";
    const dashboardUrl = `https://${appDomain}/${wedding.slug}/guests`;
    const emoji = availabilityEmoji(guestData.availability);
    const label = availabilityLabel(guestData.availability);

    const emailHtml = emailLayout(wedding, `
      <h2>${emoji} Nouvelle réponse RSVP</h2>
      <p>${esc(guestData.firstName)} ${esc(guestData.lastName)} vient de répondre à votre invitation.</p>
      <div class="info-card">
        <p><strong>Invité(e) :</strong> ${esc(guestData.firstName)} ${esc(guestData.lastName)}</p>
        <p><strong>Réponse :</strong> ${label}</p>
      </div>
      <div class="text-center mt-16">
        <a href="${dashboardUrl}" class="cta">Gérer mes invités</a>
      </div>
    `);

    await sendEmail(recipient, subject, emailHtml);
    await logEmail(wedding.id, recipient, subject, type, 'sent', undefined, guestData);
  } catch (error) {
    await logEmail(wedding.id, recipient, subject, type, 'failed', (error as Error).message, guestData);
    throw error;
  }
}

export async function sendGuestConfirmationEmail(wedding: Wedding, guestData: {
  email: string;
  firstName: string;
  lastName: string;
  availability: string;
  invitationTypeLabel?: string | null;
  tableLabel?: string | null;
  options?: string[];
}) {
  const type = 'rsvp_confirmation_guest';
  const subject = `Merci ${guestData.firstName} ! Votre réponse est bien enregistrée`;

  try {
    const label = availabilityLabel(guestData.availability);
    const isConfirmed = guestData.availability === "confirmed" || guestData.availability === "both";
    const isDeclined = guestData.availability === "declined" || guestData.availability === "unavailable";

    const confirmMessage = isConfirmed
      ? `Nous sommes ravis de compter sur votre présence ! Nous avons hâte de partager ce moment avec vous.`
      : isDeclined
        ? `Nous comprenons et nous sommes touchés que vous ayez pris le temps de répondre. Vous serez dans nos pensées ce jour-là.`
        : `Nous avons bien noté votre réponse. N'hésitez pas à revenir vers nous si quoi que ce soit change.`;

    const detailsHtml = [
      guestData.invitationTypeLabel ? `<p><strong>Invitation :</strong> ${esc(guestData.invitationTypeLabel)}</p>` : "",
      guestData.tableLabel ? `<p><strong>Table :</strong> ${esc(guestData.tableLabel)}</p>` : "",
      guestData.options?.length ? `<p><strong>Options :</strong> ${guestData.options.map(o => esc(o)).join(", ")}</p>` : "",
    ].filter(Boolean).join("");

    const emailHtml = emailLayout(wedding, `
      <div class="highlight">
        <h3>Merci ${esc(guestData.firstName)} !</h3>
        <p>Votre réponse est bien enregistrée</p>
      </div>
      <p>${confirmMessage}</p>
      <div class="info-card">
        <p><strong>Votre réponse :</strong> ${label}</p>
        ${detailsHtml}
      </div>
      <p style="font-size:13px;color:#999;margin-top:24px;">Si vous souhaitez modifier votre réponse, n'hésitez pas à retourner sur le site du mariage.</p>
    `);

    await sendEmail(guestData.email, subject, emailHtml);
    await logEmail(wedding.id, guestData.email, subject, type, 'sent', undefined, guestData);
  } catch (error) {
    await logEmail(wedding.id, guestData.email, subject, type, 'failed', (error as Error).message, guestData);
    throw error;
  }
}

export async function sendContributionNotification(wedding: Wedding, contributionData: {
  donorName: string;
  amount: number;
  currency: string;
  message?: string | null;
}) {
  const type = 'contribution_received_admin';
  const formattedAmount = (contributionData.amount / 100).toFixed(2);
  const currencySymbol = contributionData.currency === 'eur' ? '€' : contributionData.currency.toUpperCase();
  const subject = `Nouvelle contribution - ${contributionData.donorName} : ${formattedAmount}${currencySymbol}`;

  const owner = await storage.getUser(wedding.ownerId);
  if (!owner?.email) {
    console.warn(`[email] Skipping contribution admin notification: no email found for owner ${wedding.ownerId}`);
    return;
  }
  const recipient = owner.email;

  try {
    const appDomain = process.env.APP_DOMAIN || "daylora.app";
    const dashboardUrl = `https://${appDomain}/${wedding.slug}/dashboard`;

    const emailHtml = emailLayout(wedding, `
      <h2>Nouvelle contribution reçue !</h2>
      <p>${esc(contributionData.donorName)} vient de participer à votre cagnotte.</p>
      <div class="highlight">
        <h3>${formattedAmount} ${currencySymbol}</h3>
        <p>de la part de ${esc(contributionData.donorName)}</p>
      </div>
      ${contributionData.message ? `<div class="quote">${esc(contributionData.message)}</div>` : ""}
      <div class="text-center mt-16">
        <a href="${dashboardUrl}" class="cta">Voir mon tableau de bord</a>
      </div>
    `);

    await sendEmail(recipient, subject, emailHtml);
    await logEmail(wedding.id, recipient, subject, type, 'sent', undefined, contributionData);
  } catch (error) {
    await logEmail(wedding.id, recipient, subject, type, 'failed', (error as Error).message, contributionData);
    throw error;
  }
}

export async function sendContributorThankYou(wedding: Wedding, contributorData: {
  email: string;
  donorName: string;
  amount: number;
  currency: string;
}) {
  const type = 'contribution_thank_you_guest';
  const formattedAmount = (contributorData.amount / 100).toFixed(2);
  const currencySymbol = contributorData.currency === 'eur' ? '€' : contributorData.currency.toUpperCase();
  const subject = `Merci pour votre générosité, ${contributorData.donorName} !`;

  try {
    const emailHtml = emailLayout(wedding, `
      <div class="highlight">
        <h3>Merci infiniment !</h3>
        <p>${formattedAmount} ${currencySymbol}</p>
      </div>
      <p>${esc(contributorData.donorName)}, votre générosité nous touche énormément. Cette contribution compte beaucoup pour nous et nous aide à construire les souvenirs de ce jour si spécial.</p>
      <p>Du fond du cœur, merci.</p>
    `);

    await sendEmail(contributorData.email, subject, emailHtml);
    await logEmail(wedding.id, contributorData.email, subject, type, 'sent', undefined, contributorData);
  } catch (error) {
    await logEmail(wedding.id, contributorData.email, subject, type, 'failed', (error as Error).message, contributorData);
    throw error;
  }
}

export async function sendPersonalizedInvitation(wedding: Wedding, recipientData: {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  message?: string;
  publicToken?: string;
  invitationTypeLabel?: string;
  tableLabel?: string;
  segments?: Array<{ label: string; time?: string; venueLabel?: string }>;
  options?: string[];
}) {
  const type = 'invitation_personalized_guest';
  const subject = `Vous êtes invité(e) au mariage de ${wedding.title}`;

  try {
    const customMessage = recipientData.message || `Nous serions honorés de votre présence pour célébrer notre union.`;
    const domain = process.env.APP_BASE_URL || "https://daylora.app";
    const invitationPageLink = recipientData.publicToken
      ? `${domain}/${wedding.slug}/guest/${recipientData.publicToken}`
      : (recipientData.id ? `${domain}/invitation/${recipientData.id}` : null);
    const directConfirmLink = recipientData.publicToken ? `${domain}/api/rsvp/respond/${recipientData.publicToken}/confirmed` : null;
    const directDeclineLink = recipientData.publicToken ? `${domain}/api/rsvp/respond/${recipientData.publicToken}/declined` : null;

    const segmentsHtml = recipientData.segments?.length
      ? `<div class="info-card">
          <p style="margin:0 0 12px;font-weight:600;">Votre programme</p>
          ${recipientData.segments.map((segment) => `
            <div style="margin-bottom:10px;">
              <div style="font-weight:600;">${esc(segment.label)}</div>
              <div style="font-size:14px;color:#666;">${[segment.time, segment.venueLabel].filter(Boolean).map(s => esc(s)).join(" · ")}</div>
            </div>
          `).join("")}
        </div>`
      : "";

    const detailsHtml = [
      recipientData.invitationTypeLabel ? `<p><strong>Invitation :</strong> ${esc(recipientData.invitationTypeLabel)}</p>` : "",
      recipientData.tableLabel ? `<p><strong>Table :</strong> ${esc(recipientData.tableLabel)}</p>` : "",
      recipientData.options?.length ? `<p><strong>Options :</strong> ${recipientData.options.map(o => esc(o)).join(", ")}</p>` : "",
    ].filter(Boolean).join("");

    const actionsHtml = directConfirmLink
      ? `<div class="text-center mt-16" style="margin-bottom:8px;">
          <a href="${directConfirmLink}" class="cta">Confirmer ma présence</a>
        </div>
        <div class="text-center" style="margin-bottom:8px;">
          <a href="${directDeclineLink}" class="cta-outline">Je ne pourrai pas venir</a>
        </div>
        ${invitationPageLink ? `<div class="text-center mt-8"><a href="${invitationPageLink}" style="font-size:13px;color:#888;text-decoration:underline;">Voir mon invitation complète</a></div>` : ""}`
      : invitationPageLink
        ? `<div class="text-center mt-16">
            <a href="${invitationPageLink}" class="cta">Voir mon invitation</a>
          </div>`
        : "";

    const emailHtml = emailLayout(wedding, `
      <div class="text-center">
        <p style="font-size:16px;">Cher(e) ${esc(recipientData.firstName)},</p>
        <p>${esc(customMessage)}</p>
      </div>
      ${detailsHtml ? `<div class="info-card">${detailsHtml}</div>` : ""}
      ${segmentsHtml}
      ${actionsHtml}
    `);

    await sendEmail(recipientData.email, subject, emailHtml);
    await logEmail(wedding.id, recipientData.email, subject, type, 'sent', undefined, recipientData);
  } catch (error) {
    await logEmail(wedding.id, recipientData.email, subject, type, 'failed', (error as Error).message, recipientData);
    throw error;
  }
}

export async function sendDateChangeApologyEmail(wedding: Wedding, guestData: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const type = 'date_change_apology';
  const subject = `Information importante — ${wedding.title}`;

  try {
    const domain = process.env.APP_BASE_URL || "https://daylora.app";
    const siteUrl = `${domain}/${wedding.slug}`;

    const emailHtml = emailLayout(wedding, `
      <h2>Information importante</h2>
      <p>${esc(guestData.firstName)}, nous vous écrivons pour vous informer d'un changement dans l'organisation de notre mariage.</p>
      <p>Nous vous invitons à consulter votre invitation mise à jour pour retrouver toutes les nouvelles informations.</p>
      <p>Nous nous excusons pour ce désagrément et espérons toujours avoir le plaisir de vous compter parmi nous.</p>
      <div class="text-center mt-16">
        <a href="${siteUrl}" class="cta">Voir les détails</a>
      </div>
    `);

    await sendEmail(guestData.email, subject, emailHtml);
    await logEmail(wedding.id, guestData.email, subject, type, 'sent', undefined, guestData);
  } catch (error) {
    await logEmail(wedding.id, guestData.email, subject, type, 'failed', (error as Error).message, guestData);
    throw error;
  }
}

export async function sendPremiumConfirmationEmail(wedding: Wedding, ownerEmail: string, billingType: "subscription" | "one_time") {
  const type = 'premium_confirmation';
  const planLabel = billingType === "one_time" ? "Premium Annuel (149\u20AC)" : "Premium Mensuel (23,99\u20AC/mois)";
  const subject = "Bienvenue dans Daylora Premium !";

  try {
    const appDomain = process.env.APP_DOMAIN || "daylora.app";
    const siteUrl = `https://${appDomain}/${wedding.slug}`;

    const featuresHtml = [
      "Tous les templates (Modern, Minimal…)",
      "Invités et cadeaux illimités",
      "Galerie jusqu'à 50 photos",
      "Pages personnalisées",
      "Contributions et blagues live",
      "Sans branding Daylora",
    ].map(f => `<p style="margin:6px 0;font-size:14px;">✓ ${f}</p>`).join("");

    const emailHtml = emailLayout(wedding, `
      <div class="highlight">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;opacity:0.8;color:#fff">Premium</p>
        <h3>Bienvenue dans Daylora Premium</h3>
        <p>${planLabel}</p>
      </div>
      <p>Votre site de mariage vient de passer au niveau supérieur. Voici ce qui est maintenant débloqué :</p>
      <div class="info-card">
        ${featuresHtml}
      </div>
      <div class="text-center mt-16">
        <a href="${siteUrl}" class="cta">Accéder à mon site</a>
      </div>
      <p style="font-size:13px;color:#999;margin-top:24px;">Si vous avez la moindre question, n'hésitez pas à nous contacter via le chat de support dans votre espace Daylora.</p>
    `);

    await sendEmail(ownerEmail, subject, emailHtml);
    await logEmail(wedding.id, ownerEmail, subject, type, 'sent');
  } catch (error) {
    await logEmail(wedding.id, ownerEmail, subject, type, 'failed', (error as Error).message);
  }
}
