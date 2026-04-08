import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? `"도장 매니저" <noreply@dojang.com>`;

function isEmailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** SMTP 서버 연결만 검증 (메일 발송 없음). 설정이 없으면 실패 반환. */
export async function verifySmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "SMTP credentials not configured (SMTP_USER / SMTP_PASS)." };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP 설정이 없어 발송 건너뜀:", payload.subject, "→", payload.to);
    return { success: false, error: "SMTP 미설정" };
  }

  try {
    await transporter.sendMail({ from: FROM, ...payload });
    return { success: true };
  } catch (err) {
    console.error("[Email] 발송 실패:", err);
    return { success: false, error: String(err) };
  }
}

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px 32px; }
  .header h1 { color: white; margin: 0; font-size: 20px; }
  .header p { color: #bfdbfe; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 28px 32px; }
  .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  .badge-yellow { background: #fef9c3; color: #ca8a04; }
  .badge-blue { background: #dbeafe; color: #2563eb; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 16px; }
  .info-row { display: flex; gap: 8px; margin: 8px 0; font-size: 14px; }
  .info-label { color: #94a3b8; width: 80px; flex-shrink: 0; }
  .info-value { color: #1e293b; font-weight: 500; }
  h2 { font-size: 18px; color: #1e293b; margin: 0 0 16px; }
  p { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🥋 도장 매니저</h1>
      <p>무도관 통합 관리 시스템</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      본 메일은 도장 매니저 시스템에서 자동 발송됩니다. 문의사항은 관리자에게 연락하세요.
    </div>
  </div>
</body></html>`;
}

// 수강료 연체 알림
export function buildOverdueEmail(memberName: string, amount: number, dueDate: Date) {
  return baseTemplate(`
    <h2>수강료 납부 안내</h2>
    <p><strong>${memberName}</strong>님의 수강료 납부 기한이 지났습니다.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <div class="info-row"><span class="info-label">회원명</span><span class="info-value">${memberName}</span></div>
      <div class="info-row"><span class="info-label">금액</span><span class="info-value">₩${amount.toLocaleString()}</span></div>
      <div class="info-row"><span class="info-label">납부 기한</span><span class="info-value">${dueDate.toLocaleDateString("ko-KR")}</span></div>
      <div class="info-row"><span class="info-label">상태</span><span class="info-value"><span class="badge badge-red">연체</span></span></div>
    </div>
    <p>빠른 시일 내에 납부 처리 부탁드립니다.</p>
  `);
}

// 계약 만료 임박 알림
export function buildContractExpiryEmail(memberName: string, contractTitle: string, endDate: Date, daysLeft: number) {
  return baseTemplate(`
    <h2>계약 만료 안내</h2>
    <p><strong>${memberName}</strong>님의 계약 만료일이 다가오고 있습니다.</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;">
      <div class="info-row"><span class="info-label">계약명</span><span class="info-value">${contractTitle}</span></div>
      <div class="info-row"><span class="info-label">만료일</span><span class="info-value">${endDate.toLocaleDateString("ko-KR")}</span></div>
      <div class="info-row"><span class="info-label">남은 일수</span><span class="info-value"><span class="badge badge-yellow">${daysLeft}일 남음</span></span></div>
    </div>
    <p>계약 갱신이 필요하시면 담당자에게 문의하세요.</p>
  `);
}

// 이벤트 공지
export function buildEventEmail(eventTitle: string, eventDate: Date, eventType: string, description?: string) {
  const TYPE_LABELS: Record<string, string> = {
    competition: "대회", seminar: "세미나", exam: "심사", social: "행사", other: "기타",
  };
  return baseTemplate(`
    <h2>이벤트 공지</h2>
    <p>새로운 이벤트가 등록되었습니다. 확인하고 참가 신청해주세요!</p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;">
      <div class="info-row"><span class="info-label">이벤트명</span><span class="info-value">${eventTitle}</span></div>
      <div class="info-row"><span class="info-label">일시</span><span class="info-value">${eventDate.toLocaleDateString("ko-KR")}</span></div>
      <div class="info-row"><span class="info-label">종류</span><span class="info-value"><span class="badge badge-blue">${TYPE_LABELS[eventType] ?? "기타"}</span></span></div>
      ${description ? `<div class="info-row"><span class="info-label">설명</span><span class="info-value">${description}</span></div>` : ""}
    </div>
  `);
}

// 승급 축하
export function buildPromotionEmail(memberName: string, newBelt: string) {
  const BELT_LABELS: Record<string, string> = {
    white: "흰띠", yellow: "노란띠", orange: "주황띠", green: "초록띠",
    blue: "파란띠", purple: "보라띠", red: "빨간띠", brown: "갈색띠", black: "검정띠",
  };
  return baseTemplate(`
    <h2>🎉 승급을 축하합니다!</h2>
    <p><strong>${memberName}</strong>님이 승급 심사에 합격하셨습니다!</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
      <p style="font-size:24px;margin:0 0 8px;">🥋</p>
      <p style="font-size:18px;font-weight:700;color:#166534;margin:0;">${BELT_LABELS[newBelt] ?? newBelt} 취득</p>
      <p style="color:#16a34a;margin:4px 0 0;font-size:13px;">${memberName}님의 열정에 박수를 보냅니다.</p>
    </div>
    <p>앞으로도 꾸준한 수련으로 더 높은 목표를 향해 나아가세요!</p>
  `);
}
