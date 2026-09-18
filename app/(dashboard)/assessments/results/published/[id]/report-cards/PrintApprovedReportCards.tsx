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

    try {
      const iframe = document.createElement("iframe");

      iframe.style.position = "fixed";
      iframe.style.left = "-10000px";
      iframe.style.top = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.border = "0";

      document.body.appendChild(iframe);

      const frameWindow = iframe.contentWindow;

      if (!frameWindow) {
        throw new Error("Unable to create print frame.");
      }

      const frameDocument = iframe.contentDocument;

      if (!frameDocument) {
        throw new Error("Unable to access print frame.");
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
                background: white;
              }

              body {
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              }

              iframe {
                display: block;
                width: 100%;
                height: 1122px;
                border: 0;
                page-break-after: always;
              }

              iframe:last-child {
                page-break-after: auto;
              }

              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            </style>
          </head>

          <body>
            ${cards
              .map(
                (card) =>
                  `<iframe src="${card.reportCardUrl}" title="${escapeHtml(
                    card.studentName,
                  )}"></iframe>`,
              )
              .join("")}
          </body>
        </html>
      `);

      frameDocument.close();

      const frames = Array.from(
        frameDocument.querySelectorAll("iframe"),
      );

      await Promise.all(
        frames.map(
          (childFrame) =>
            new Promise<void>((resolve) => {
              childFrame.addEventListener("load", () => resolve(), {
                once: true,
              });
            }),
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      frameWindow.focus();
      frameWindow.print();

      setTimeout(() => {
        iframe.remove();
      }, 2000);
    } catch (error) {
      console.error(error);

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
        {printing ? "…" : "▣"}
      </span>

      {printing
        ? "Preparing..."
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