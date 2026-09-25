"use client";

import type { ReactNode } from "react";

type PayrollPrintItem = {
  staffId: string;
  firstName: string;
  lastName: string;
  staffNumber: string;
  position: string | null;
  baseSalary: string;
  allowances: string;
  grossPay: string;
  taxDeduction: string;
  pensionDeduction: string;
  otherDeduction: string;
  totalDeductions: string;
  netPay: string;
};

type PayrollPrintRun = {
  grossTotal: string;
  deductionsTotal: string;
  netTotal: string;
  processedBy: string | null;
  processedAt: string | Date | null;
};

export type PayrollPrintData = {
  schoolName: string;
  periodName: string;
  status: string;
  periodStart: string | Date | null;
  periodEnd: string | Date | null;
  payDate: string | Date | null;
  run: PayrollPrintRun;
  staffItems: PayrollPrintItem[];
};

function money(value: string | number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | Date | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status) {
    case "processed":
      return "Processed";
    case "paid":
      return "Paid";
    case "void":
      return "Void";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}

function InitialMark({ schoolName }: { schoolName: string }) {
  const initials = schoolName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="payroll-print-mark" aria-hidden="true">
      {initials || "SC"}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="payroll-print-detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function PayrollPrint({
  data,
}: {
  data: PayrollPrintData;
}) {
  const printedAt = new Date();

  return (
    <div className="payroll-print">
      <style>{`
        .payroll-print {
          display: none;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 9mm;
          }

          html,
          body {
            background: #fff !important;
            color: #111827 !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .payroll-print {
            display: block !important;
            width: 100%;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
          }

          .payroll-print *,
          .payroll-print *::before,
          .payroll-print *::after {
            box-sizing: border-box;
          }

          .payroll-print-mark {
            width: 17mm;
            height: 17mm;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #111827;
            font-size: 12pt;
            font-weight: 800;
            letter-spacing: .04em;
          }

          .payroll-print-header {
            display: grid;
            grid-template-columns: 17mm 1fr auto;
            gap: 6mm;
            align-items: center;
            padding-bottom: 5mm;
            border-bottom: 1.5px solid #111827;
          }

          .payroll-print-kicker {
            margin: 0 0 1.2mm;
            font-size: 7pt;
            font-weight: 800;
            letter-spacing: .18em;
            text-transform: uppercase;
            color: #4b5563;
          }

          .payroll-print-title {
            margin: 0;
            font-size: 17pt;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -.02em;
          }

          .payroll-print-school {
            margin: 1mm 0 0;
            font-size: 9pt;
            font-weight: 600;
            color: #374151;
          }

          .payroll-print-status {
            text-align: right;
          }

          .payroll-print-status-label {
            display: block;
            margin-bottom: 1.5mm;
            font-size: 6.5pt;
            font-weight: 800;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: #6b7280;
          }

          .payroll-print-status-value {
            display: inline-block;
            border: 1px solid #374151;
            padding: 1.5mm 3mm;
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .05em;
          }

          .payroll-print-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7mm;
            margin: 5mm 0;
            padding: 4mm 0;
            border-bottom: 1px solid #9ca3af;
          }

          .payroll-print-meta dl {
            margin: 0;
          }

          .payroll-print-detail {
            display: grid;
            grid-template-columns: 31mm 1fr;
            gap: 3mm;
            padding: 1.1mm 0;
          }

          .payroll-print-detail dt {
            color: #6b7280;
          }

          .payroll-print-detail dd {
            margin: 0;
            font-weight: 700;
          }

          .payroll-print-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border: 1px solid #6b7280;
            margin-bottom: 5mm;
          }

          .payroll-print-summary-item {
            padding: 3mm 4mm;
            border-right: 1px solid #6b7280;
          }

          .payroll-print-summary-item:last-child {
            border-right: 0;
          }

          .payroll-print-summary-label {
            display: block;
            margin-bottom: 1mm;
            font-size: 6.5pt;
            font-weight: 800;
            letter-spacing: .1em;
            text-transform: uppercase;
            color: #6b7280;
          }

          .payroll-print-summary-value {
            display: block;
            font-size: 11pt;
            font-weight: 800;
          }

          .payroll-print-section-title {
            margin: 0 0 2.5mm;
            font-size: 8pt;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .payroll-print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .payroll-print-table thead {
            display: table-header-group;
          }

          .payroll-print-table th {
            padding: 2.2mm 1.5mm;
            border-top: 1px solid #111827;
            border-bottom: 1px solid #111827;
            background: #f3f4f6 !important;
            font-size: 6.5pt;
            font-weight: 800;
            letter-spacing: .04em;
            text-transform: uppercase;
            text-align: right;
            vertical-align: bottom;
          }

          .payroll-print-table th:first-child,
          .payroll-print-table th:nth-child(2),
          .payroll-print-table th:nth-child(3) {
            text-align: left;
          }

          .payroll-print-table td {
            padding: 2.2mm 1.5mm;
            border-bottom: 1px solid #d1d5db;
            font-size: 7.2pt;
            text-align: right;
            vertical-align: top;
            white-space: nowrap;
          }

          .payroll-print-table td:first-child,
          .payroll-print-table td:nth-child(2),
          .payroll-print-table td:nth-child(3) {
            text-align: left;
          }

          .payroll-print-table tbody tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .payroll-print-name {
            font-weight: 800;
          }

          .payroll-print-position {
            display: block;
            margin-top: .5mm;
            font-size: 6.3pt;
            color: #6b7280;
          }

          .payroll-print-net {
            font-weight: 800;
          }

          .payroll-print-table tfoot td {
            padding: 2.8mm 1.5mm;
            border-top: 1.5px solid #111827;
            border-bottom: 1.5px solid #111827;
            background: #f9fafb !important;
            font-weight: 800;
          }

          .payroll-print-total-label {
            text-align: left !important;
            text-transform: uppercase;
            letter-spacing: .05em;
          }

          .payroll-print-authorization {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12mm;
            margin-top: 12mm;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .payroll-print-signature {
            min-height: 17mm;
            border-bottom: 1px solid #374151;
            padding-top: 8mm;
          }

          .payroll-print-signature-label {
            margin-top: 2mm;
            font-size: 7pt;
            font-weight: 700;
          }

          .payroll-print-footer {
            display: flex;
            justify-content: space-between;
            gap: 8mm;
            margin-top: 7mm;
            padding-top: 3mm;
            border-top: 1px solid #d1d5db;
            font-size: 6.5pt;
            color: #6b7280;
          }

          .payroll-print-footer span:last-child {
            text-align: right;
          }
        }
      `}</style>

      <header className="payroll-print-header">
        <InitialMark schoolName={data.schoolName} />

        <div>
          <p className="payroll-print-kicker">Official payroll record</p>
          <h1 className="payroll-print-title">Payroll Register</h1>
          <p className="payroll-print-school">{data.schoolName}</p>
        </div>

        <div className="payroll-print-status">
          <span className="payroll-print-status-label">Payroll status</span>
          <span className="payroll-print-status-value">
            {statusLabel(data.status)}
          </span>
        </div>
      </header>

      <section className="payroll-print-meta">
        <dl>
          <Detail label="Payroll period">{data.periodName}</Detail>
          <Detail label="Period starts">{formatDate(data.periodStart)}</Detail>
          <Detail label="Period ends">{formatDate(data.periodEnd)}</Detail>
          <Detail label="Pay date">{formatDate(data.payDate)}</Detail>
        </dl>

        <dl>
          <Detail label="Processed by">
            {data.run.processedBy || "System"}
          </Detail>
          <Detail label="Processed at">
            {formatDate(data.run.processedAt)}
          </Detail>
          <Detail label="Staff count">{data.staffItems.length}</Detail>
          <Detail label="Currency">Ghana cedi (GHS)</Detail>
        </dl>
      </section>

      <section className="payroll-print-summary">
        <div className="payroll-print-summary-item">
          <span className="payroll-print-summary-label">Gross payroll</span>
          <span className="payroll-print-summary-value">
            {money(data.run.grossTotal)}
          </span>
        </div>

        <div className="payroll-print-summary-item">
          <span className="payroll-print-summary-label">Total deductions</span>
          <span className="payroll-print-summary-value">
            {money(data.run.deductionsTotal)}
          </span>
        </div>

        <div className="payroll-print-summary-item">
          <span className="payroll-print-summary-label">Net payroll</span>
          <span className="payroll-print-summary-value">
            {money(data.run.netTotal)}
          </span>
        </div>
      </section>

      <section>
        <h2 className="payroll-print-section-title">Staff payroll register</h2>

        <table className="payroll-print-table">
          <thead>
            <tr>
              <th style={{ width: "18%" }}>Staff member</th>
              <th style={{ width: "9%" }}>Staff no.</th>
              <th style={{ width: "8%" }}>Base salary</th>
              <th style={{ width: "8%" }}>Allowances</th>
              <th style={{ width: "8%" }}>Gross pay</th>
              <th style={{ width: "8%" }}>Tax</th>
              <th style={{ width: "8%" }}>Pension</th>
              <th style={{ width: "8%" }}>Other</th>
              <th style={{ width: "9%" }}>Deductions</th>
              <th style={{ width: "10%" }}>Net pay</th>
            </tr>
          </thead>

          <tbody>
            {data.staffItems.map((item) => (
              <tr key={item.staffId}>
                <td>
                  <span className="payroll-print-name">
                    {item.firstName} {item.lastName}
                  </span>
                  <span className="payroll-print-position">
                    {item.position || "Staff"}
                  </span>
                </td>
                <td>{item.staffNumber}</td>
                <td>{money(item.baseSalary)}</td>
                <td>{money(item.allowances)}</td>
                <td>{money(item.grossPay)}</td>
                <td>-{money(item.taxDeduction)}</td>
                <td>-{money(item.pensionDeduction)}</td>
                <td>-{money(item.otherDeduction)}</td>
                <td>-{money(item.totalDeductions)}</td>
                <td className="payroll-print-net">
                  {money(item.netPay)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td
                colSpan={4}
                className="payroll-print-total-label"
              >
                Total payroll
              </td>
              <td>{money(data.run.grossTotal)}</td>
              <td colSpan={4}>-{money(data.run.deductionsTotal)}</td>
              <td>{money(data.run.netTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="payroll-print-authorization">
        <div>
          <div className="payroll-print-signature" />
          <div className="payroll-print-signature-label">
            Prepared / processed by
          </div>
        </div>

        <div>
          <div className="payroll-print-signature" />
          <div className="payroll-print-signature-label">
            Reviewed / authorized by
          </div>
        </div>

        <div>
          <div className="payroll-print-signature" />
          <div className="payroll-print-signature-label">
            School stamp / official seal
          </div>
        </div>
      </section>

      <footer className="payroll-print-footer">
        <span>
          Official payroll record • {data.schoolName} • {data.periodName}
        </span>
        <span>
          Generated by Heisen SchoolOS • Printed{" "}
          {new Intl.DateTimeFormat("en-GH", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(printedAt)}
        </span>
      </footer>
    </div>
  );
}
