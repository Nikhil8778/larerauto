import { sendAdminAlert, sendReviewEmail } from "@/lib/email";

type ReviewRequestBody = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReviewRequestBody;

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const subject = body.subject?.trim() || "";
    const message = body.message?.trim() || "";

    if (!name || !email || !message) {
      return Response.json(
        { success: false, error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    await sendReviewEmail({
      customerName: name,
      customerEmail: email,
      subject: subject || undefined,
      message,
    });

    await sendAdminAlert({
      subject: "New website review / complaint received",
      detailsHtml: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Review email error:", error);
    return Response.json(
      { success: false, error: "Failed to send review email." },
      { status: 500 }
    );
  }
}