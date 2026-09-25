import type { PaymentMethod, PaymentStatus } from "@/lib/finance/finance-utils";

export type ReceiptPrintAllocation = {
  invoiceNumber: string;
  amount: string | number;
  issueDate: string | Date | null;
  dueDate: string | Date | null;
  remaining: string | number;
};

export type ReceiptPrintData = {
  schoolName: string;
  receiptNumber: string;
  status: PaymentStatus;
  studentName: string;
  studentNumber: string;
  paymentDate: string | Date | null;
  method: PaymentMethod;
  reference: string | null;
  amount: string | number;
  allocatedAmount: string | number;
  outstandingAfterPayment: string | number;
  notes: string | null;
  allocations: ReceiptPrintAllocation[];
};

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMethod(method: PaymentMethod) {
  return method
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatusLabel(status: PaymentStatus) {
  return status === "reversed" ? "REVERSED" : "POSTED";
}

export default function PaymentReceiptPrint({
  data,
}: {
  data: ReceiptPrintData;
}) {
  const isReversed = data.status === "reversed";

  return (
    <article className="payment-receipt-print">
      <style jsx>{`
        .payment-receipt-print {
          display: none;
        }

        @media print {
          .payment-receipt-print {
            display: block;
            width: 100%;
            color: #111827;
            background: #ffffff;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 10pt;
          }

          .payment-receipt-print * {
            box-sizing: border-box;
          }

          .payment-receipt-print .receipt-header {
            border-bottom: 2px solid #111827;
            padding-bottom: 14px;
          }

          .payment-receipt-print .school-initials {
            width: 58px;
            height: 58px;
            border: 2px solid #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            flex-shrink: 0;
          }

          .payment-receipt-print .header-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
          }

          .payment-receipt-print .school-block {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .payment-receipt-print .eyebrow {
            margin: 0 0 3px;
            font-size: 7pt;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #64748b;
          }

          .payment-receipt-print .school-name {
            margin: 0;
            font-size: 18pt;
            line-height: 1.1;
            font-weight: 800;
            text-transform: uppercase;
          }

          .payment-receipt-print .document-title {
            margin: 5px 0 0;
            font-size: 10pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }

          .payment-receipt-print .receipt-meta {
            min-width: 170px;
            text-align: right;
          }

          .payment-receipt-print .meta-label {
            margin: 0;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #64748b;
          }

          .payment-receipt-print .receipt-number {
            margin: 4px 0 0;
            font-size: 13pt;
            font-weight: 800;
          }

          .payment-receipt-print .status {
            display: inline-block;
            margin-top: 6px;
            padding: 3px 8px;
            border: 1px solid #94a3b8;
            font-size: 7pt;
            font-weight: 800;
            letter-spacing: 0.08em;
          }

          .payment-receipt-print .status.reversed {
            border-color: #b91c1c;
            color: #991b1b;
          }

          .payment-receipt-print .status.posted {
            border-color: #166534;
            color: #166534;
          }

          .payment-receipt-print .section {
            margin-top: 16px;
          }

          .payment-receipt-print .section-title {
            margin: 0 0 7px;
            padding-bottom: 5px;
            border-bottom: 1px solid #cbd5e1;
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.13em;
          }

          .payment-receipt-print .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid #cbd5e1;
          }

          .payment-receipt-print .info-cell {
            padding: 9px 11px;
            border-bottom: 1px solid #cbd5e1;
          }

          .payment-receipt-print .info-cell:nth-child(odd) {
            border-right: 1px solid #cbd5e1;
          }

          .payment-receipt-print .info-cell:nth-last-child(-n + 2) {
            border-bottom: 0;
          }

          .payment-receipt-print .label {
            margin: 0;
            font-size: 7pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #64748b;
          }

          .payment-receipt-print .value {
            margin: 3px 0 0;
            font-size: 10pt;
            font-weight: 700;
          }

          .payment-receipt-print .amount-box {
            margin-top: 16px;
            border: 2px solid #111827;
            padding: 13px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }

          .payment-receipt-print .amount-label {
            margin: 0;
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }

          .payment-receipt-print .amount {
            margin: 2px 0 0;
            font-size: 19pt;
            font-weight: 900;
          }

          .payment-receipt-print .amount-method {
            text-align: right;
            font-size: 8pt;
            color: #475569;
          }

          .payment-receipt-print table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .payment-receipt-print th,
          .payment-receipt-print td {
            border: 1px solid #cbd5e1;
            padding: 7px 8px;
            vertical-align: middle;
          }

          .payment-receipt-print th {
            background: #f1f5f9;
            font-size: 7pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            text-align: left;
          }

          .payment-receipt-print td {
            font-size: 8.5pt;
          }

          .payment-receipt-print .right {
            text-align: right;
          }

          .payment-receipt-print .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid #111827;
          }

          .payment-receipt-print .summary-cell {
            padding: 10px;
            border-right: 1px solid #111827;
          }

          .payment-receipt-print .summary-cell:last-child {
            border-right: 0;
          }

          .payment-receipt-print .summary-value {
            margin: 3px 0 0;
            font-size: 11pt;
            font-weight: 800;
          }

          .payment-receipt-print .notes {
            border: 1px solid #cbd5e1;
            padding: 10px 11px;
            white-space: pre-wrap;
            line-height: 1.5;
          }

          .payment-receipt-print .reversal {
            margin-top: 14px;
            border: 1px solid #b91c1c;
            padding: 10px 11px;
            color: #991b1b;
          }

          .payment-receipt-print .reversal-title {
            margin: 0;
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .payment-receipt-print .reversal-text {
            margin: 4px 0 0;
            font-size: 8pt;
            line-height: 1.4;
          }

          .payment-receipt-print .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 70px;
            margin-top: 34px;
          }

          .payment-receipt-print .signature-line {
            height: 28px;
            border-bottom: 1px solid #111827;
          }

          .payment-receipt-print .signature-label {
            margin-top: 5px;
            font-size: 7pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .payment-receipt-print .footer {
            margin-top: 24px;
            padding-top: 9px;
            border-top: 2px solid #111827;
            display: flex;
            justify-content: space-between;
            gap: 20px;
            font-size: 7pt;
            color: #64748b;
          }

          .payment-receipt-print .footer p {
            margin: 0;
          }

          .payment-receipt-print .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .payment-receipt-print thead {
            display: table-header-group;
          }

          .payment-receipt-print tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="receipt-header">
        <div className="header-row">
          <div className="school-block">
            <div className="school-initials">
              {getInitials(data.schoolName)}
            </div>

            <div>
              <p className="eyebrow">
                Official school fees receipt
              </p>

              <h1 className="school-name">
                {data.schoolName}
              </h1>

              <p className="document-title">
                Payment receipt
              </p>
            </div>
          </div>

          <div className="receipt-meta">
            <p className="meta-label">Receipt number</p>
            <p className="receipt-number">
              {data.receiptNumber}
            </p>

            <span
              className={`status ${
                isReversed ? "reversed" : "posted"
              }`}
            >
              {getStatusLabel(data.status)}
            </span>
          </div>
        </div>
      </div>

      <section className="section avoid-break">
        <h2 className="section-title">Payment particulars</h2>

        <div className="info-grid">
          <div className="info-cell">
            <p className="label">Student name</p>
            <p className="value">{data.studentName}</p>
          </div>

          <div className="info-cell">
            <p className="label">Student number</p>
            <p className="value">{data.studentNumber}</p>
          </div>

          <div className="info-cell">
            <p className="label">Payment date</p>
            <p className="value">
              {formatDate(data.paymentDate)}
            </p>
          </div>

          <div className="info-cell">
            <p className="label">Payment method</p>
            <p className="value">
              {formatMethod(data.method)}
            </p>
          </div>

          <div className="info-cell">
            <p className="label">Transaction reference</p>
            <p className="value">
              {data.reference || "Not provided"}
            </p>
          </div>

          <div className="info-cell">
            <p className="label">Receipt status</p>
            <p className="value">
              {getStatusLabel(data.status)}
            </p>
          </div>
        </div>
      </section>

      <section className="amount-box avoid-break">
        <div>
          <p className="amount-label">Amount received</p>
          <p className="amount">
            {formatMoney(data.amount)}
          </p>
        </div>

        <div className="amount-method">
          <strong>{formatMethod(data.method)}</strong>
          <br />
          Payment recorded by school finance
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          Invoice allocation
        </h2>

        <table>
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Invoice</th>
              <th style={{ width: "16%" }}>Issue date</th>
              <th style={{ width: "16%" }}>Due date</th>
              <th style={{ width: "20%" }} className="right">
                Allocated
              </th>
              <th style={{ width: "20%" }} className="right">
                Balance
              </th>
            </tr>
          </thead>

          <tbody>
            {data.allocations.length > 0 ? (
              data.allocations.map((allocation) => (
                <tr key={allocation.invoiceNumber}>
                  <td>
                    <strong>{allocation.invoiceNumber}</strong>
                  </td>

                  <td>{formatDate(allocation.issueDate)}</td>

                  <td>{formatDate(allocation.dueDate)}</td>

                  <td className="right">
                    {formatMoney(allocation.amount)}
                  </td>

                  <td className="right">
                    {formatMoney(allocation.remaining)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  No invoice allocations were recorded.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={3} className="right">
                <strong>Total allocated</strong>
              </td>

              <td className="right">
                <strong>
                  {formatMoney(data.allocatedAmount)}
                </strong>
              </td>

              <td className="right">
                <strong>
                  {formatMoney(data.outstandingAfterPayment)}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="section avoid-break">
        <h2 className="section-title">
          Financial summary
        </h2>

        <div className="summary-grid">
          <div className="summary-cell">
            <p className="label">Amount received</p>
            <p className="summary-value">
              {formatMoney(data.amount)}
            </p>
          </div>

          <div className="summary-cell">
            <p className="label">Allocated to invoices</p>
            <p className="summary-value">
              {formatMoney(data.allocatedAmount)}
            </p>
          </div>

          <div className="summary-cell">
            <p className="label">
              Outstanding after payment
            </p>
            <p className="summary-value">
              {formatMoney(data.outstandingAfterPayment)}
            </p>
          </div>
        </div>
      </section>

      {data.notes ? (
        <section className="section avoid-break">
          <h2 className="section-title">
            Narration / notes
          </h2>

          <div className="notes">{data.notes}</div>
        </section>
      ) : null}

      {isReversed ? (
        <section className="reversal avoid-break">
          <p className="reversal-title">
            Payment reversed
          </p>

          <p className="reversal-text">
            This document records a payment that has been
            reversed and should not be treated as a current
            collection.
          </p>
        </section>
      ) : null}

      <div className="signatures avoid-break">
        <div>
          <div className="signature-line" />
          <p className="signature-label">
            Authorized finance officer
          </p>
        </div>

        <div>
          <div className="signature-line" />
          <p className="signature-label">
            School stamp / authorization
          </p>
        </div>
      </div>

      <footer className="footer">
        <div>
          <p>
            Official financial record generated from school
            finance records.
          </p>
          <p>
            Receipt: {data.receiptNumber}
          </p>
        </div>

        <div>
          <p>
            Generated by Heisen SchoolOS
          </p>
        </div>
      </footer>
    </article>
  );
}
