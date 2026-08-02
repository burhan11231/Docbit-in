import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 'mock-resend-key');

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (process.env.RESEND_API_KEY) {
    return await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@docbit.com',
      to,
      subject,
      html
    });
  } else {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return { id: 'mock-email-id' };
  }
};
