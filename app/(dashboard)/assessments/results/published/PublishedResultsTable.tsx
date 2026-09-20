"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublishedResultPublication } from "./page";

type Props = {
  publications: PublishedResultPublication[];
};

export default function PublishedResultsTable({
  publications,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredPublications = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return publications;
    }

    return publications.filter((publication) => {
      const searchableText = [
        publication.academicYearName,
        publication.termName,
        publication.className,
        publication.streamName,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedQuery,
      );
    });
  }, [publications, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Publication history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Published records are historical snapshots
              and are not recalculated from live assessment
              data.
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label
              htmlFor="published-results-search"
              className="sr-only"
            >
              Search published results
            </label>

            <input
              id="published-results-search"
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search class, stream or term..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
      </div>

      {filteredPublications.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            {publications.length === 0 ? "—" : "⌕"}
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-900">
            {publications.length === 0
              ? "No published results yet"
              : "No matching publications"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {publications.length === 0
              ? "Published result sets will appear here once a result publication has been finalized."
              : "Try a different class, stream, academic year or term."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Academic year
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Term
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Class
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Students
                  </th>

                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Published
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPublications.map(
                  (publication) => (
                    <tr
                      key={publication.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {
                            publication.academicYearName
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {publication.termName}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {publication.className}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {publication.streamName}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-700">
                          {publication.studentCount}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />

                          <span className="text-sm text-slate-600">
                            {publication.publishedAt
                              ? formatPublishedDate(
                                  publication.publishedAt,
                                )
                              : "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/assessments/results/published/${publication.id}`}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View result
                          <span className="ml-2">
                            →
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredPublications.map(
              (publication) => (
                <article
                  key={publication.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {
                          publication.academicYearName
                        }
                      </p>

                      <h3 className="mt-1 text-base font-bold text-slate-950">
                        {publication.className}
                      </h3>

                      <p className="mt-0.5 text-sm text-slate-500">
                        {publication.streamName} •{" "}
                        {publication.termName}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Published
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Students
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {publication.studentCount}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Published
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {publication.publishedAt
                          ? formatPublishedDate(
                              publication.publishedAt,
                            )
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/assessments/results/published/${publication.id}`}
                    className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View published result
                    <span className="ml-2">
                      →
                    </span>
                  </Link>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

function formatPublishedDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

