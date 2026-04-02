import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import * as emailService from "@/services/email-campaign.service";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "HQ_ADMIN" && session.user?.role !== "BRANCH_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, targetId } = body;

    if (type === "single") {
      const result = await emailService.sendSingleEmail(body.to, body.subject, body.html);
      return NextResponse.json(result);
    }

    if (type === "overdue") {
      const result = await emailService.sendPaymentReminders();
      return NextResponse.json(result);
    }

    if (type === "contract_expiry") {
      const result = await emailService.sendContractExpiryReminders();
      return NextResponse.json(result);
    }

    if (type === "event" && targetId) {
      const result = await emailService.sendEventNotification(targetId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown type." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as Record<string, unknown>).statusCode as number },
      );
    }
    logger.error("Failed to send email", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
