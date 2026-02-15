import nodemailer from "nodemailer";
import { type Wedding, type EmailLog } from "@shared/schema";
import { storage } from "./storage";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail =
  process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

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

export async function sendRsvpConfirmationEmail(wedding: Wedding, guestData: {
  firstName: string;
  lastName: string;
  availability: string;
}) {
  const type = 'rsvp_received_admin';
  const subject = `Nouvelle réponse RSVP - ${guestData.firstName} ${guestData.lastName}`;
  const recipient = wedding.config.seo.title.includes('Marie') ? "we@ar2k26.com" : wedding.ownerId; // Fallback or logic

  try {
    const availabilityText =
      {
        "19-march": "19 mars uniquement",
        "21-march": "21 mars uniquement",
        both: "Les deux dates",
        unavailable: "Pas disponible",
      }[guestData.availability] || guestData.availability;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; border-bottom: 2px solid ${wedding.config.theme.primaryColor}; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; margin: 0; }
            .content { padding: 30px 0; }
            .info-box { background: #f9f9f9; border-left: 4px solid ${wedding.config.theme.primaryColor}; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${wedding.title}</h1>
          </div>
          <div class="content">
            <h2>Nouvelle réponse RSVP reçue</h2>
            <div class="info-box">
              <p><strong>Invité :</strong> ${guestData.firstName} ${guestData.lastName}</p>
              <p><strong>Disponibilité :</strong> ${availabilityText}</p>
            </div>
            <p>Gérez vos invités dans votre tableau de bord.</p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipient,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, recipient, subject, type, 'sent', undefined, guestData);
    return info;
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
}) {
  const type = 'rsvp_confirmation_guest';
  const subject = `Merci ${guestData.firstName} ! Votre réponse a bien été enregistrée - ${wedding.title}`;

  try {
    const availabilityText =
      {
        "19-march": "19 mars uniquement",
        "21-march": "21 mars uniquement",
        both: "Les deux dates",
        unavailable: "Pas disponible",
      }[guestData.availability] || guestData.availability;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; border-bottom: 2px solid ${wedding.config.theme.primaryColor}; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; margin: 0; }
            .content { padding: 30px 0; }
            .confirmation-box { background: ${wedding.config.theme.primaryColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${wedding.title}</h1>
          </div>
          <div class="content">
            <div class="confirmation-box">
              <h2>Merci ${guestData.firstName} !</h2>
              <p>Votre réponse a bien été enregistrée</p>
            </div>
            <p>Cher(e) ${guestData.firstName} ${guestData.lastName}, nous avons bien reçu votre réponse : <strong>${availabilityText}</strong>.</p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: guestData.email,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, guestData.email, subject, type, 'sent', undefined, guestData);
    return info;
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
  const recipient = wedding.ownerId; // Logic for admin recipient

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; border-bottom: 2px solid ${wedding.config.theme.primaryColor}; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; margin: 0; }
            .amount-box { background: ${wedding.config.theme.primaryColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${wedding.title}</h1>
          </div>
          <div class="content">
            <h2>Nouvelle contribution reçue !</h2>
            <div class="amount-box">
              <h2>${formattedAmount} ${currencySymbol}</h2>
            </div>
            <p><strong>Donateur :</strong> ${contributionData.donorName}</p>
            ${contributionData.message ? `<p><em>"${contributionData.message}"</em></p>` : ''}
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipient,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, recipient, subject, type, 'sent', undefined, contributionData);
    return info;
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
  const subject = `Merci ${contributorData.donorName} ! 💕 - ${wedding.title}`;

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 30px 0; border-bottom: 2px solid ${wedding.config.theme.primaryColor}; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; margin: 0; }
            .thank-you-box { background: ${wedding.config.theme.primaryColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${wedding.title}</h1>
          </div>
          <div class="content">
            <div class="thank-you-box">
              <h2>Merci infiniment, ${contributorData.donorName} !</h2>
              <p>Votre générosité de ${formattedAmount} ${currencySymbol} nous touche profondément.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: contributorData.email,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, contributorData.email, subject, type, 'sent', undefined, contributorData);
    return info;
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
}) {
  const type = 'invitation_personalized_guest';
  const subject = `Vous êtes invité(e) à notre mariage - ${wedding.title}`;

  try {
    const customMessage = recipientData.message || `Nous serions honorés de votre présence à notre mariage.`;
    const domain = process.env.APP_BASE_URL || process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
    const invitationPageLink = recipientData.publicToken
      ? `${domain}/invitation/${recipientData.publicToken}`
      : (recipientData.id ? `${domain}/invitation/${recipientData.id}` : null);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { padding: 40px; border: 1px solid ${wedding.config.theme.primaryColor}; border-radius: 12px; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; text-align: center; }
            .cta-button { display: inline-block; background: ${wedding.config.theme.primaryColor}; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>${wedding.title}</h1></div>
            <div style="text-align: center;">
              <p>Cher(e) ${recipientData.firstName} ${recipientData.lastName},</p>
              <p>${customMessage}</p>
              ${invitationPageLink ? `<a href="${invitationPageLink}" class="cta-button">Accéder à mon invitation</a>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipientData.email,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, recipientData.email, subject, type, 'sent', undefined, recipientData);
    return info;
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
  const subject = `Information importante concernant notre mariage - ${wedding.title}`;

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header h1 { color: ${wedding.config.theme.primaryColor}; border-bottom: 2px solid ${wedding.config.theme.primaryColor}; }
          </style>
        </head>
        <body>
          <h1>${wedding.title}</h1>
          <p>Cher(e) ${guestData.firstName}, nous vous contactons pour vous informer d'un changement dans l'organisation de notre événement.</p>
          <p>Veuillez consulter votre invitation mise à jour sur notre site.</p>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: guestData.email,
      subject,
      html: emailHtml,
    });

    await logEmail(wedding.id, guestData.email, subject, type, 'sent', undefined, guestData);
    return info;
  } catch (error) {
    await logEmail(wedding.id, guestData.email, subject, type, 'failed', (error as Error).message, guestData);
    throw error;
  }
}
