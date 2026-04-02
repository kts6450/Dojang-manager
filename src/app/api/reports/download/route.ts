import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { logger } from "@/lib/logger";
import { generateReport } from "@/services/report.service";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const type = req.nextUrl.searchParams.get("type") ?? "members";
    const { rows, sheetName, colWidths } = await generateReport(type);

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const fileName = encodeURIComponent(`${type}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Record<string, unknown>).statusCode as number });
    }
    logger.error("Failed to generate report download", { error: String(error) });
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
  }
}
