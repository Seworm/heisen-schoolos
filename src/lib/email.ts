import { BrevoClient } from "@getbrevo/brevo";

export async function sendInvitationEmail(input: {
  to: string;
  name: string;
  inviteUrl: string;
  schoolName: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || "Heisen SchoolOS";

  if (!apiKey || !fromEmail) {
    console.error("BREVO CONFIG MISSING", {
      hasApiKey: Boolean(apiKey),
      hasFromEmail: Boolean(fromEmail),
    });

    return { sent: false };
  }

  const brevo = new BrevoClient({
    apiKey,
  });

  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: input.to,
          name: input.name,
        },
      ],
      subject: `Create your ${input.schoolName} Heisen SchoolOS account`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <div style="max-width: 600px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #047857;">Welcome to Heisen SchoolOS</h2>

              <p>Hello ${input.name},</p>

              <p>
                You have been invited to join
                <strong>${input.schoolName}</strong>
                on Heisen SchoolOS.
              </p>

              <p>
                Click the button below to create your login details:
              </p>

              <p style="margin: 32px 0;">
                <a
                  href="${input.inviteUrl}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #047857;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                  "
                >
                  Create My Account
                </a>
              </p>

              <p>
                This invitation expires in seven days.
              </p>

              <p>
                Never share your password with anyone.
              </p>

              <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e5e7eb;" />

              <p style="font-size: 13px; color: #6b7280;">
                This email was sent by ${input.schoolName} through Heisen SchoolOS.
              </p>
            </div>
          </body>
        </html>
      `,
      textContent: `
Hello ${input.name},

You have been invited to join ${input.schoolName} on Heisen SchoolOS.

Create your login details:
${input.inviteUrl}

This invitation expires in seven days.

Never share your password with anyone.

This email was sent through Heisen SchoolOS.
      `,
    });

    console.log("BREVO EMAIL SENT", {
      messageId: response.messageId,
      to: input.to,
    });

    return {
      sent: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error("BREVO EMAIL ERROR", error);
    throw new Error(
      error instanceof Error
        ? `Brevo email failed: ${error.message}`
        : "Brevo email failed.",
    );
  }
}
