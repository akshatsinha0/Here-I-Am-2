// backend/src/services/emailService.ts
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configure transporter (using Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate secure verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `HereIAm2 Team <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="max-width: 600px; margin: 20px auto; padding: 30px; border-radius: 10px; background: #f8f9fa;">
        <h1 style="color: #2563eb; margin-bottom: 25px;">Welcome to HereIAm2! 👋</h1>
        
        <p style="font-size: 16px; line-height: 1.6;">
          Thank you for signing up! Please verify your email address to activate your account.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 14px 28px; 
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          Can't click the button? Copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">
            ${verificationUrl}
          </a>
        </p>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This link will expire in 24 hours.<br>
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};
