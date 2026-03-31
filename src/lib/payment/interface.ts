/**
 * 결제 추상화 인터페이스
 * Stripe, 토스페이먼츠, 카카오페이 등 어떤 PG사도 이 인터페이스를 구현하면 교체 가능
 */

export interface PaymentItem {
  name: string;
  amount: number;
  quantity?: number;
}

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: PaymentItem[];
  metadata?: Record<string, string>;
  successUrl?: string;
  failUrl?: string;
}

export interface PaymentResult {
  paymentKey: string;
  orderId: string;
  amount: number;
  status: "DONE" | "CANCELED" | "PARTIAL_CANCELED" | "ABORTED" | "EXPIRED";
  method?: string;
  approvedAt?: string;
  receiptUrl?: string;
}

export interface RefundRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

export interface SubscriptionRequest {
  customerId: string;
  planId: string;
  amount: number;
  interval: "monthly" | "yearly";
  startDate?: Date;
}

/**
 * 결제 게이트웨이 추상 인터페이스
 * 각 PG사는 이 인터페이스를 구현해야 합니다.
 */
export interface IPaymentGateway {
  /** 결제 요청 URL 생성 (리다이렉트 방식) */
  createPaymentUrl(request: PaymentRequest): Promise<string>;

  /** 결제 확인 */
  confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult>;

  /** 결제 취소/환불 */
  cancelPayment(request: RefundRequest): Promise<PaymentResult>;

  /** 결제 조회 */
  getPayment(paymentKey: string): Promise<PaymentResult>;

  /** 정기결제 등록 (선택적) */
  createSubscription?(request: SubscriptionRequest): Promise<{ subscriptionId: string }>;

  /** 정기결제 취소 (선택적) */
  cancelSubscription?(subscriptionId: string): Promise<void>;
}

/**
 * 미구현 플레이스홀더 (나중에 Stripe/토스페이먼츠로 교체)
 */
export class MockPaymentGateway implements IPaymentGateway {
  async createPaymentUrl(request: PaymentRequest): Promise<string> {
    console.log("[MockPayment] createPaymentUrl:", request);
    return `/payment/mock?orderId=${request.orderId}&amount=${request.amount}`;
  }

  async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult> {
    console.log("[MockPayment] confirmPayment:", { paymentKey, orderId, amount });
    return {
      paymentKey,
      orderId,
      amount,
      status: "DONE",
      method: "카드",
      approvedAt: new Date().toISOString(),
    };
  }

  async cancelPayment(request: RefundRequest): Promise<PaymentResult> {
    console.log("[MockPayment] cancelPayment:", request);
    return {
      paymentKey: request.paymentKey,
      orderId: "",
      amount: request.cancelAmount ?? 0,
      status: "CANCELED",
    };
  }

  async getPayment(paymentKey: string): Promise<PaymentResult> {
    console.log("[MockPayment] getPayment:", paymentKey);
    return {
      paymentKey,
      orderId: "",
      amount: 0,
      status: "DONE",
    };
  }
}

/**
 * 현재 활성화된 결제 게이트웨이 인스턴스
 * 환경변수 PAYMENT_PROVIDER 에 따라 교체:
 *   PAYMENT_PROVIDER=toss → TossPaymentsGateway (추후 구현)
 *   PAYMENT_PROVIDER=stripe → StripeGateway (추후 구현)
 *   기본값 → MockPaymentGateway
 */
export function getPaymentGateway(): IPaymentGateway {
  const provider = process.env.PAYMENT_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
    default:
      return new MockPaymentGateway();
  }
}
