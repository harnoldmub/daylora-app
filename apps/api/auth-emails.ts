import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@nocely.app";
const siteUrl = process.env.APP_BASE_URL || (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000"));

export const authEmails = {
  async sendVerificationEmail(email: string, firstName: string, token: string) {
    const verifyLink = `${siteUrl}/verify-email?token=${token}`;

    if (!process.env.SMTP_USER) {
      console.log("SMTP not configured. Verification Link (Dev):", verifyLink);
      return;
    }

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Vérifiez votre adresse email - Nocely",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Bienvenue sur Nocely, ${firstName} !</h2>
          <p>Votre espace est presque prêt. Confirmez votre adresse email pour activer votre compte Nocely.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #C8A96A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmer mon email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expirera dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Nocely — Votre mariage, sublimé en ligne.</p>
        </div>
      `,
    });
  },

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${siteUrl}/reset-password?token=${token}`;

    if (!process.env.SMTP_USER) {
      console.log("SMTP not configured. Reset Link (Dev):", resetLink);
      return;
    }

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Nocely",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe Nocely.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #333; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #666; font-size: 14px;">Ce lien expira dans 1 heure. Si vous n'avez pas demandé ce changement, merci d'ignorer cet email par sécurité.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Nocely — La nouvelle génération de sites de mariage.</p>
        </div>
      `,
    });
  }
};
