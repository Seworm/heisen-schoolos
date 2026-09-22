export async function sendInvitationEmail(input: {
  to: string;
  name: string;
  inviteUrl: string;
  schoolName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Create your ${input.schoolName} Heisen SchoolOS account`,
      html: `<p>Hello ${input.name},</p><p>You have been invited to join <strong>${input.schoolName}</strong> on Heisen SchoolOS.</p><p><a href="${input.inviteUrl}">Create your login details</a></p><p>This invitation expires in seven days. Never share your password with anyone.</p>`,
    }),
  });
  if (!response.ok) throw new Error("The invitation was created, but the email could not be sent.");
  return { sent: true };
}
