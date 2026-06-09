import { NextResponse } from "next/server";
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function POST(req: Request) {
  const { name, email, message } = await req.json() as { name: string; email: string; message: string };

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    await getResend().emails.send({
      from: "Agora Help <onboarding@resend.dev>",
      to: "akdekdouk@gmail.com",
      replyTo: email,
      subject: `[Agora Help] Message from ${name}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
