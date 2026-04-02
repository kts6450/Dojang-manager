import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { memberUpdateSchema } from "@/lib/validations/member";
import * as memberService from "@/services/member.service";
import type { Session } from "next-auth";
import type { ServiceContext } from "@/lib/service-context";
import type { UserRole } from "@/lib/rbac";

function buildCtx(session: Session): ServiceContext {
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    branchId: session.user.branchId,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const user = await memberService.getMember(id, buildCtx(session!));
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to get member", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = memberUpdateSchema.parse(await req.json());
    const user = await memberService.updateMember(id, body as Record<string, unknown>, buildCtx(session!));
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to update member", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await memberService.deleteMember(id, buildCtx(session!));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to delete member", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
