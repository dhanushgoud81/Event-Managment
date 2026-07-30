import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (config.isDev && (!config.email.user || !config.email.pass)) {
    // Console-based fallback for development
    logger.info('📧 Using console email transport (no SMTP credentials configured)');
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();

    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transport.sendMail(mailOptions);

    if (config.isDev && (!config.email.user || !config.email.pass)) {
      // Log email content in development
      logger.info(
        {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
        '📧 Email sent (console mode)'
      );
      // Parse and log the actual content
      try {
        const message = JSON.parse(info.message);
        logger.debug({ emailContent: message }, 'Email content');
      } catch {
        // Ignore parse errors
      }
    } else {
      logger.info(
        {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        },
        '📧 Email sent successfully'
      );
    }

    return true;
  } catch (error) {
    logger.error({ error, to: options.to, subject: options.subject }, '❌ Failed to send email');
    return false;
  }
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${config.appUrl}/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: `${config.appName} - Verify Your Email`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
          .footer { padding: 24px 32px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.appName}</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}! 👋</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="btn">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #6366f1;">${verifyUrl}</p>
            <p>This link expires in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${config.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: `${config.appName} - Reset Your Password`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
          .footer { padding: 24px 32px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 13px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.appName}</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="btn">Reset Password</a>
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email. Your password will remain unchanged.
            </div>
            <p>This link expires in 1 hour.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${config.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendRegistrationConfirmationEmail(
  email: string,
  firstName: string,
  eventName: string,
  registrationNumber: string,
  ticketType: string,
  amount: string,
  qrCodeUrl?: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `${config.appName} - Registration Confirmed for ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
          .content { padding: 32px; color: #374151; line-height: 1.6; }
          .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 16px 0; }
          .details table { width: 100%; border-collapse: collapse; }
          .details td { padding: 8px 0; }
          .details td:first-child { color: #6b7280; font-weight: 500; }
          .details td:last-child { text-align: right; font-weight: 600; }
          .qr { text-align: center; margin: 24px 0; }
          .qr img { max-width: 200px; border: 2px solid #e5e7eb; border-radius: 8px; }
          .footer { padding: 24px 32px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 13px; }
          .success-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Registration Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}! 🎉</h2>
            <p>Your registration for <strong>${eventName}</strong> has been confirmed!</p>
            <div class="details">
              <table>
                <tr><td>Registration #</td><td>${registrationNumber}</td></tr>
                <tr><td>Event</td><td>${eventName}</td></tr>
                <tr><td>Ticket Type</td><td>${ticketType}</td></tr>
                <tr><td>Amount Paid</td><td>₹${amount}</td></tr>
                <tr><td>Status</td><td><span class="success-badge">Confirmed</span></td></tr>
              </table>
            </div>
            ${qrCodeUrl ? `
            <div class="qr">
              <p><strong>Your Entry QR Code:</strong></p>
              <img src="${qrCodeUrl}" alt="QR Code" />
              <p style="font-size: 13px; color: #6b7280;">Present this QR code at the event entrance</p>
            </div>
            ` : ''}
            <p>You can view your registration details and download your QR code from your dashboard.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${config.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
