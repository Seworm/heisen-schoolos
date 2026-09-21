export type PaymentProviderName = "manual" | "mock";

export type PaymentProviderIntent = {
  provider: PaymentProviderName;
  providerReference: string | null;
  instructions: string;
};

export type PaymentProviderVerification = {
  providerTransactionId: string;
  status: "confirmed" | "failed";
  amount: string;
  currency: string;
  rawResponse: Record<string, unknown>;
  failureReason?: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createIntent(input: {
    clientReference: string;
    amount: string;
    currency: string;
  }): Promise<PaymentProviderIntent>;
  verifyTransaction(input: {
    providerTransactionId: string;
    expectedAmount: string;
    currency: string;
  }): Promise<PaymentProviderVerification>;
}

/**
 * Safe default until a licensed provider adapter is configured. It never
 * claims that money was received and exposes no provider credentials.
 */
class ManualProvider implements PaymentProvider {
  readonly name = "manual" as const;

  async createIntent(): Promise<PaymentProviderIntent> {
    return {
      provider: this.name,
      providerReference: null,
      instructions: "Collect payment manually and verify it from the school's bank or mobile-money statement.",
    };
  }

  async verifyTransaction(input: {
    providerTransactionId: string;
    expectedAmount: string;
    currency: string;
  }): Promise<PaymentProviderVerification> {
    return {
      providerTransactionId: input.providerTransactionId,
      status: "failed",
      amount: input.expectedAmount,
      currency: input.currency,
      rawResponse: { provider: this.name, verified: false },
      failureReason: "Manual payments require an authorised reconciliation workflow.",
    };
  }
}

/**
 * Deterministic local adapter for staging/tests only. A transaction is
 * confirmed only when explicitly prefixed with `mock_confirmed_`.
 */
class MockProvider implements PaymentProvider {
  readonly name = "mock" as const;

  async createIntent(input: {
    clientReference: string;
    amount: string;
    currency: string;
  }): Promise<PaymentProviderIntent> {
    return {
      provider: this.name,
      providerReference: `mock_${input.clientReference}`,
      instructions: "Use mock_confirmed_<reference> to simulate a confirmed transaction in non-production environments.",
    };
  }

  async verifyTransaction(input: {
    providerTransactionId: string;
    expectedAmount: string;
    currency: string;
  }): Promise<PaymentProviderVerification> {
    const confirmed = input.providerTransactionId.startsWith("mock_confirmed_");
    return {
      providerTransactionId: input.providerTransactionId,
      status: confirmed ? "confirmed" : "failed",
      amount: input.expectedAmount,
      currency: input.currency,
      rawResponse: { provider: this.name, simulated: true, confirmed },
      ...(confirmed ? {} : { failureReason: "Mock transaction was not marked confirmed." }),
    };
  }
}

export function getPaymentProvider(
  requested?: PaymentProviderName,
): PaymentProvider {
  const configured = requested ?? process.env.PAYMENT_PROVIDER;
  if (configured === "mock" && process.env.NODE_ENV !== "production") {
    return new MockProvider();
  }
  return new ManualProvider();
}
