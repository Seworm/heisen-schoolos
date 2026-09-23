export async function sendInvitationEmail(input: {
  to: string;
  name: string;
  inviteUrl: string;
  schoolName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("RESEND CONFIG MISSING", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
    });

    return { sent: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Create your ${input.schoolName} Heisen SchoolOS account`,
      html: `
        <p>Hello ${input.name},</p>
        <p>
          You have been invited to join
          <strong>${input.schoolName}</strong>
          on Heisen SchoolOS.
        </p>
        <p>
          <a href="${input.inviteUrl}">
            Create your login details
          </a>
        </p>
        <p>
          This invitation expires in seven days.
          Never share your password with anyone.
        </p>
      `,
    }),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    console.error("RESEND API ERROR", {
      status: response.status,
      body: responseBody,
    });

    throw new Error(
      `Resend API error (${response.status}): ${responseBody}`,
    );
  }

  console.log("RESEND EMAIL SENT", responseBody);

  return { sent: true };
}