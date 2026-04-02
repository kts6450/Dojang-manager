import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { memberCreateSchema } from "@/lib/validations/member";
import * as memberService from "@/services/member.service";
import type { ServiceContext } from "@/lib/service-context";
import type { UserRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const ctx: ServiceContext = {
      userId: session.user.id,
      role: session.user.role as UserRole,
      branchId: session.user.branchId,
      selectedBranchId: searchParams.get("branchId"),
    };

    const result = await memberService.listMembers({
      search: searchParams.get("search") || "",
      role: searchParams.get("role") || "",
      status: searchParams.get("status") || "",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    }, ctx);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Failed to list members", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx: ServiceContext = {
      userId: session.user.id,
      role: session.user.role as UserRole,
      branchId: session.user.branchId,
    };

    const body = memberCreateSchema.parse(await req.json());
    const result = await memberService.createMember(body, ctx);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to create member", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
