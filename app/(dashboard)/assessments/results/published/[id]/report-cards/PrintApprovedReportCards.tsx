"use client";

import { useState } from "react";

type ApprovedReportCard = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  reportCardUrl: string;
};

export default function PrintApprovedReportCards({
  cards,
}: {
  cards: ApprovedReportCard[];
}) {
  const [printing, setPrinting] = useState(false);

  async function handlePrintAll() {
    if (cards.length === 0 || printing) return;

    setPrinting(true);

    let printFrame: HTMLIFrameElement | null = null;

    try {
      printFrame = document.createElement("iframe");

      printFrame.setAttribute("aria-hidden", "true");

      Object.assign(printFrame.style, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: "1px",
        height: "1px",
        border: "0",
        visibility: "hidden",
      });

      document.body.appendChild(printFrame);

      const frameWindow = printFrame.contentWindow;
      const frameDocument = printFrame.contentDocument;

      if (!frameWindow || !frameDocument) {
        throw new Error("Unable to create the print document.");
      }

      frameDocument.open();

      frameDocument.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Approved Report Cards</title>

            <style>
              html,
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
              }

              body {
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              .print-card {
                display: block;
                width: 100%;
                height: 297mm;
                border: 0;
                page-break-after: always;
                break-after: page;
              }

              .print-card:last-child {
                page-break-after: auto;
                break-after: auto;
              }

              @page {
                size: A4 portrait;
                margin: 9mm;
              }
            </style>
          </head>

          <body>
            ${cards
              .map(
                (card) => `
                  <iframe
                    class="print-card"
                    src="${escapeHtml(card.reportCardUrl)}"
                    title="${escapeHtml(
                      `${card.studentName} - ${card.studentNumber}`,
                    )}"
                  ></iframe>
                `,
              )
              .join("")}
          </body>
        </html>
      `);

      frameDocument.close();

      const frames = Array.from(
        frameDocument.querySelectorAll<HTMLIFrameElement>(
          "iframe.print-card",
        ),
      );

      await Promise.all(
        frames.map(
          (childFrame) =>
            new Promise<void>((resolve, reject) => {
              const timeout = window.setTimeout(() => {
                reject(
                  new Error(
                    `Timed out loading ${childFrame.title}.`,
                  ),
                );
              }, 15000);

              childFrame.addEventListener(
                "load",
                () => {
                  window.clearTimeout(timeout);
                  resolve();
                },
                { once: true },
              );

              childFrame.addEventListener(
                "error",
                () => {
                  window.clearTimeout(timeout);
                  reject(
                    new Error(
                      `Unable to load ${childFrame.title}.`,
                    ),
                  );
                },
                { once: true },
              );
            }),
        ),
      );

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 500);
      });

      frameWindow.focus();
      frameWindow.print();

      window.setTimeout(() => {
        printFrame?.remove();
      }, 2000);
    } catch (error) {
      console.error("Batch report-card printing failed:", error);

      printFrame?.remove();

      window.alert(
        "The approved report cards could not be prepared for printing. Please try again.",
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePrintAll}
      disabled={printing || cards.length === 0}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span aria-hidden="true">
        {printing ? "..." : "▣"}
      </span>

      {printing
        ? "Preparing report cards..."
        : `Print All Approved (${cards.length})`}
    </button>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
