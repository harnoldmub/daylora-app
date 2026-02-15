import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM || "onboarding@resend.dev";
const siteUrl = process.env.APP_BASE_URL || process.env.SITE_URL || "http://localhost:5174";

/**
 * AuthEmails handles transactional emails for the SaaS Auth system.
 */
export const authEmails = {
  /**
   * Send a verification email with a secure link.
   */
  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const verifyLink = `${siteUrl}/app/verify-email?token=${token}`;

    if (!resend) {
      console.log("RESEND_API_KEY not found. Verification Link (Dev):", verifyLink);
      return;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Vérifiez votre adresse email - Libala",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Bienvenue sur Libala, ${firstName} !</h2>
          <p>Merci de vous être inscrit. Pour activer votre compte et commencer à organiser votre mariage, merci de confirmer votre adresse email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #C8A96A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmer mon email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Libala - La plateforme élégante pour organiser votre mariage.</p>
        </div>
      `,
    });
  },

  /**
   * Send a password reset email.
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${siteUrl}/app/reset-password?token=${token}`;

    if (!resend) {
      console.log("RESEND_API_KEY not found. Reset Link (Dev):", resetLink);
      return;
    }

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Libala",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Libala.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #333; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expira dans 1 heure. Si vous n'avez pas demandé ce changement, merci d'ignorer cet email par sécurité.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Libala - La plateforme élégante pour organiser votre mariage.</p>
        </div>
      `,
    });
  }
};
