import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port') || 587;
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('SMTP Mailer transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP configurations missing (SMTP_HOST, SMTP_USER, SMTP_PASS). Mailer will log OTPs directly to terminal console.',
      );
    }
  }

  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: 'register' | 'login' | 'forgot_password',
  ): Promise<void> {
    const from =
      this.configService.get<string>('smtp.from') ||
      'no-reply@foodplatform.com';
    const subjectMap = {
      register: 'Verify your account - Food Ordering Platform',
      login: 'Verify your login - Food Ordering Platform',
      forgot_password: 'Reset your password - Food Ordering Platform',
    };

    const subject = subjectMap[purpose] || 'Verification OTP';
    const actionText =
      purpose === 'register'
        ? 'verifying your registration'
        : purpose === 'login'
          ? 'logging in to your account'
          : 'resetting your password';

    const htmlContent = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
              <!-- Header Bar -->
              <tr>
                <td align="center" style="background-color: #dc2626; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Foodies Express</h1>
                  <p style="color: #fecaca; margin: 5px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">Artisanal Pizzas & Gourmet Sides</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center;">
                  <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">Account Verification Code</h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    You are receiving this email to facilitate <strong>${actionText}</strong>. Please use the verification code below to proceed:
                  </p>
                  
                  <!-- OTP Code Block -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 30px;">
                    <tr>
                      <td align="center" style="background-color: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 40px; letter-spacing: 8px;">
                        <span style="font-size: 36px; font-weight: 900; color: #dc2626; font-family: Courier, monospace; margin-right: -8px;">${otp}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                    This code is valid for <strong>5 minutes</strong>. If you did not request this verification, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Foodies Express. All rights reserved.
                  </p>
                  <p style="color: #d1d5db; font-size: 11px; margin: 5px 0 0 0;">
                    Vizianagaram, Andhra Pradesh, 535003, India
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Foodies Express" <${from}>`,
          to: email,
          subject,
          html: htmlContent,
        });
        this.logger.log(
          `OTP successfully sent via SMTP to ${email} for ${purpose}`,
        );
        return;
      } catch (error: any) {
        this.logger.error(
          `Failed to send email via SMTP to ${email}: ${error.message || error}`,
        );
      }
    }

    // Fallback log
    console.log(
      '\n==================================================================',
    );
    console.log(`[MAILER FALLBACK LOG]`);
    console.log(`To: ${email}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`OTP Verification Code: ${otp}`);
    console.log(
      '==================================================================\n',
    );
  }

  async sendOrderStatusEmail(
    email: string,
    order: any,
    status: 'delivered' | 'cancelled',
  ): Promise<void> {
    const from =
      this.configService.get<string>('smtp.from') ||
      'no-reply@foodplatform.com';

    const isDelivered = status === 'delivered';
    const subject = isDelivered
      ? `🍕 Hot & Fresh! Your Order #FEX-${order.id} is Delivered!`
      : `⚠️ Order Update: Your Order #FEX-${order.id} has been Cancelled`;

    const statusTitle = isDelivered ? 'Order Delivered!' : 'Order Cancelled';
    const statusDesc = isDelivered
      ? 'Your order has been delivered hot and fresh by our rider. Enjoy your delicious hot meal!'
      : 'We regret to inform you that your order has been cancelled. If payment was made, a refund will be processed shortly.';

    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0; font-size: 14px; color: #333;">
            ${item.quantity}x ${item.product?.name || 'Pizza Item'}
          </td>
          <td style="padding: 10px 0; font-size: 14px; text-align: right; font-weight: bold; color: #ff3e3e;">
            ₹${(item.price || 0) * item.quantity}
          </td>
        </tr>
      `,
      )
      .join('');

    const htmlContent = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
              <!-- Header Bar -->
              <tr>
                <td align="center" style="background-color: #dc2626; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Foodies Express</h1>
                  <p style="color: #fecaca; margin: 5px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">Artisanal Pizzas & Gourmet Sides</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 40px 20px 40px;">
                  <h2 style="color: ${isDelivered ? '#16a34a' : '#dc2626'}; margin: 0 0 10px 0; font-size: 24px; font-weight: 700; text-align: center;">
                    ${statusTitle}
                  </h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                    ${statusDesc}
                  </p>
                  
                  <h3 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Details (#FEX-${order.id})</h3>
                  
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                    <thead>
                      <tr>
                        <th align="left" style="padding: 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e5e7eb;">Item</th>
                        <th align="right" style="padding: 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e5e7eb;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals Section -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
                    <tr>
                      <td align="left" style="padding: 6px 0; font-size: 14px; color: #4b5563;">Subtotal</td>
                      <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #1f2937;">₹${order.totalAmount}</td>
                    </tr>
                    <tr>
                      <td align="left" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: #1f2937; border-top: 1px solid #f3f4f6; padding-top: 10px;">Total Amount Paid</td>
                      <td align="right" style="padding: 8px 0; font-size: 18px; font-weight: 800; color: #dc2626; border-top: 1px solid #f3f4f6; padding-top: 10px;">₹${order.totalAmount}</td>
                    </tr>
                  </table>

                  <!-- Delivery Address -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 25px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #dc2626;">Delivery Destination:</p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4b5563;">${order.deliveryAddress}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Foodies Express. All rights reserved.
                  </p>
                  <p style="color: #d1d5db; font-size: 11px; margin: 5px 0 0 0;">
                    Vizianagaram, Andhra Pradesh, 535003, India
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Foodies Express" <${from}>`,
          to: email,
          subject,
          html: htmlContent,
        });
        this.logger.log(
          `Order status email successfully sent to ${email} for status ${status}`,
        );
        return;
      } catch (error: any) {
        this.logger.error(
          `Failed to send order email via SMTP to ${email}: ${error.message}`,
        );
      }
    }

    // Fallback log
    console.log(
      '\n==================================================================',
    );
    console.log(`[MAILER ORDER FALLBACK LOG]`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: ${status}`);
    console.log(`Order Total: ₹${order.totalAmount}`);
    console.log(
      '==================================================================\n',
    );
  }

  async sendBroadcastEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const from =
      this.configService.get<string>('smtp.from') ||
      'no-reply@foodplatform.com';

    const htmlContent = `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7f7f7; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
              <!-- Header Bar -->
              <tr>
                <td align="center" style="background-color: #dc2626; padding: 30px 20px;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">Foodies Express</h1>
                  <p style="color: #fecaca; margin: 5px 0 0 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">Special Announcement</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 40px 30px 40px;">
                  <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px; font-weight: 700; text-align: center;">${subject}</h2>
                  <div style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <div style="text-align: center;">
                    <a href="http://localhost:3000/menu" style="background-color: #dc2626; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Order Fresh Pizzas Now</a>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafafa; border-top: 1px solid #f3f4f6; padding: 30px; text-align: center;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    You received this email because you are a registered customer at Foodies Express.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                    &copy; ${new Date().getFullYear()} Foodies Express. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"Foodies Express" <${from}>`,
          to: email,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Broadcast email successfully sent to ${email}`);
        return;
      } catch (error: any) {
        this.logger.error(
          `Failed to send broadcast email to ${email}: ${error.message}`,
        );
      }
    }

    // Fallback log
    console.log(
      '\n==================================================================',
    );
    console.log(`[MAILER BROADCAST FALLBACK LOG]`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(
      '==================================================================\n',
    );
  }
}
