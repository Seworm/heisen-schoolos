import { BrevoClient } from "@getbrevo/brevo";

function normalizeGhanaPhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (compact.startsWith("+")) return compact.slice(1);
  if (compact.startsWith("0")) return `233${compact.slice(1)}`;
  return compact;
}

export async function sendTransactionalSms(input: {
  recipient: string;
  content: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SMS_SENDER;
  if (!apiKey || !sender) {
    throw new Error("SMS delivery is not configured. Set BREVO_API_KEY and BREVO_SMS_SENDER.");
  }
  const recipient = normalizeGhanaPhone(input.recipient);
  if (!/^\d{6,15}$/.test(recipient)) throw new Error("Recipient phone number is invalid.");
  if (!input.content.trim()) throw new Error("SMS content is required.");
  if (input.content.length > 1600) throw new Error("SMS content cannot exceed 1,600 characters.");

  const brevo = new BrevoClient({ apiKey });
  try {
    const response = await brevo.transactionalSms.sendTransacSms({
      sender,
      recipient,
      content: input.content.trim(),
    });
    return { messageId: response.messageId, recipient };
  } catch (error) {
    throw new Error(error instanceof Error ? `SMS delivery failed: ${error.message}` : "SMS delivery failed.");
  }
}
