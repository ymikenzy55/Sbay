import nodemailer from 'nodemailer';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
import { env } from '../config/env.js';

let transporter = null;

/**
 * Initialize email transporter with Gmail SMTP
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    // eslint-disable-next-line no-console
    console.warn('[email] EMAIL_USER or EMAIL_PASS not configured. Emails will be logged only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(user, resetUrl) {
  const transport = getTransporter();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(`[email] Password reset link for ${user.email}: ${resetUrl}`);
    return;
  }

  const mailOptions = {
    from: `"sBay" <${env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Reset Your sBay Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A7E3E 0%, #0d9647 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #0A7E3E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>We received a request to reset your password for your sBay account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This link will expire in 30 minutes</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} sBay - Campus Marketplace Reimagined</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log(`[email] Password reset email sent to ${user.email}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[email] Failed to send password reset email:', error.message);
    throw error;
  }
}

/**
 * Send welcome email (optional - for future use)
 */
export async function sendWelcomeEmail(user) {
  const transport = getTransporter();
  if (!transport) return;

  const mailOptions = {
    from: `"sBay" <${env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Welcome to sBay! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0A7E3E 0%, #0d9647 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #0A7E3E; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to sBay! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>Welcome to sBay - Ghana's premier campus marketplace!</p>
            <p>You can now:</p>
            <ul>
              <li>Browse thousands of products from fellow students</li>
              <li>Buy textbooks, electronics, fashion, and more</li>
              <li>Sell items you no longer need</li>
              <li>Connect with buyers and sellers on campus</li>
            </ul>
            <p style="text-align: center;">
              <a href="https://sbaygh.com/home" class="button">Start Shopping</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} sBay - Campus Marketplace Reimagined</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    // eslint-disable-next-line no-console
    console.log(`[email] Welcome email sent to ${user.email}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[email] Failed to send welcome email:', error.message);
  }
}
