import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  // Use Gmail SMTP or any SMTP provider configured via env
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

const FROM = () => process.env.SMTP_FROM || `"Occasia" <${process.env.SMTP_USER || 'noreply@occasia.com'}>`;

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    console.warn('[Email] SMTP not configured — skipping email to', to);
    return null;
  }
  return getTransporter().sendMail({ from: FROM(), to, subject, html });
};

// ---------- Email Templates ----------

export const sendPasswordResetEmail = async (email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: 'Reset Your Occasia Password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Password Reset</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
};

export const sendBookingConfirmationEmail = async (booking) => {
  const itemsList = booking.items.map(i => `<li>${i.name} × ${i.quantity} — LKR ${(i.unitPrice * i.quantity).toLocaleString()}</li>`).join('');
  return sendEmail({
    to: booking.customerEmail,
    subject: `Booking Confirmed — ${booking.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Booking Confirmed! 🎉</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Your booking <strong>${booking.orderId}</strong> has been confirmed.</p>
        <ul>${itemsList}</ul>
        <p><strong>Event Date:</strong> ${new Date(booking.eventDate).toLocaleDateString()}</p>
        <p><strong>Return Date:</strong> ${new Date(booking.returnDate).toLocaleDateString()}</p>
        <p><strong>Total:</strong> LKR ${booking.total.toLocaleString()}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="color:#64748b;font-size:13px">Thank you for choosing Occasia!</p>
      </div>
    `
  });
};

export const sendPaymentSuccessEmail = async (booking) => {
  return sendEmail({
    to: booking.customerEmail,
    subject: `Payment Received — ${booking.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Payment Successful ✅</h2>
        <p>Hi ${booking.customerName},</p>
        <p>We've received your payment of <strong>LKR ${booking.total.toLocaleString()}</strong> for order <strong>${booking.orderId}</strong>.</p>
        <p style="color:#64748b;font-size:13px">Thank you for choosing Occasia!</p>
      </div>
    `
  });
};

export const sendBookingCancellationEmail = async (booking) => {
  return sendEmail({
    to: booking.customerEmail,
    subject: `Booking Cancelled — ${booking.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Booking Cancelled</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Your booking <strong>${booking.orderId}</strong> has been cancelled.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p style="color:#64748b;font-size:13px">— Occasia Team</p>
      </div>
    `
  });
};

export const sendStatusUpdateEmail = async (booking, field, newValue) => {
  return sendEmail({
    to: booking.customerEmail,
    subject: `Order Update — ${booking.orderId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Order Update</h2>
        <p>Hi ${booking.customerName},</p>
        <p>Your order <strong>${booking.orderId}</strong> has been updated:</p>
        <p><strong>${field}:</strong> ${newValue}</p>
        <p style="color:#64748b;font-size:13px">— Occasia Team</p>
      </div>
    `
  });
};
