import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { sendEmail, verifySmtpConnection } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "HQ_ADMIN" && session.user?.role !== "BRANCH_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sendTestTo = typeof body.sendTestTo === "string" ? body.sendTestTo.trim() : "";

    const verifyResult = await verifySmtpConnection();
    if (!verifyResult.ok) {
      return NextResponse.json(
        { ok: false, step: "verify", error: verifyResult.error },
        { status: 400 },
      );
    }

    if (!sendTestTo) {
      return NextResponse.json({
        ok: true,
        step: "verify",
        message: "SMTP connection verified. Add sendTestTo in the body to send a test email.",
      });
    }

    const sendResult = await sendEmail({
      to: sendTestTo,
      subject: "[Dojang Manager] SMTP test",
      html: "<p>This is a test email from Dojang Manager. If you received this, SMTP is working.</p>",
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { ok: false, step: "send", verifyOk: true, error: sendResult.error ?? "Send failed" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      step: "send",
      message: `Test email sent to ${sendTestTo}.`,
    });
  } catch (error) {
    logger.error("SMTP test failed", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
