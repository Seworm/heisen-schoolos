"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  saveGradingConfiguration,
} from "../actions";

type AssessmentType = {
  id: string;
  name: string;
  category: string;
};

type SchemeItem = {
  id?: string;
  assessmentTypeId: string;
  weightPercent: number;
};

type GradeBand = {
  id?: string;
  grade: string;
  label: string;
  minimumPercent: number;
  maximumPercent: number;
  remark: string;
  sortOrder: number;
};

type Props = {
  schemeId: string;
  schemeStatus: string;
  assessmentTypes: AssessmentType[];
  initialItems: SchemeItem[];
  initialBands: GradeBand[];
};

const DEFAULT_BANDS: GradeBand[] = [
  {
    grade: "A",
    label: "Excellent",
    minimumPercent: 80,
    maximumPercent: 100,
    remark: "Excellent performance",
    sortOrder: 1,
  },
  {
    grade: "B",
    label: "Very Good",
    minimumPercent: 70,
    maximumPercent: 79.99,
    remark: "Very good performance",
    sortOrder: 2,
  },
  {
    grade: "C",
    label: "Good",
    minimumPercent: 60,
    maximumPercent: 69.99,
    remark: "Good performance",
    sortOrder: 3,
  },
  {
    grade: "D",
    label: "Credit",
    minimumPercent: 50,
    maximumPercent: 59.99,
    remark: "Satisfactory performance",
    sortOrder: 4,
  },
  {
    grade: "E",
    label: "Pass",
    minimumPercent: 40,
    maximumPercent: 49.99,
    remark: "Pass",
    sortOrder: 5,
  },
  {
    grade: "F",
    label: "Fail",
    minimumPercent: 0,
    maximumPercent: 39.99,
    remark: "Needs improvement",
    sortOrder: 6,
  },
];

export default function GradingSchemeEditor({
  schemeId,
  schemeStatus,
  assessmentTypes,
  initialItems,
  initialBands,
}: Props) {
  const router = useRouter();

  const [items, setItems] =
    useState<SchemeItem[]>(
      initialItems,
    );

  const [bands, setBands] =
    useState<GradeBand[]>(
      initialBands.length > 0
        ? initialBands
        : DEFAULT_BANDS,
    );

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const totalWeight = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (Number.isFinite(
            item.weightPercent,
          )
            ? item.weightPercent
            : 0),
        0,
      ),
    [items],
  );

  const weightValid =
    Math.abs(totalWeight - 100) <
    0.001;

  const bandsValid = useMemo(() => {
    if (bands.length === 0) {
      return false;
    }

    const sorted = [...bands].sort(
      (a, b) =>
        a.minimumPercent -
        b.minimumPercent,
    );

    if (
      sorted[0].minimumPercent !==
      0
    ) {
      return false;
    }

    const last =
      sorted[sorted.length - 1];

    if (
      last.maximumPercent !==
      100
    ) {
      return false;
    }

    for (
      let index = 0;
      index < sorted.length;
      index++
    ) {
      const current =
        sorted[index];

      if (
        current.minimumPercent <
          0 ||
        current.maximumPercent >
          100 ||
        current.minimumPercent >
          current.maximumPercent
      ) {
        return false;
      }

      const next =
        sorted[index + 1];

      if (!next) {
        continue;
      }

      const expected =
        Math.round(
          (current.maximumPercent +
            0.01) *
            100,
        ) / 100;

      if (
        Math.abs(
          next.minimumPercent -
            expected,
        ) > 0.001
      ) {
        return false;
      }
    }

    return true;
  }, [bands]);

  const configurationValid =
    weightValid && bandsValid;

  function addAssessmentType() {
    const available =
      assessmentTypes.find(
        (type) =>
          !items.some(
            (item) =>
              item.assessmentTypeId ===
              type.id,
          ),
      );

    if (!available) {
      return;
    }

    setItems((current) => [
      ...current,
      {
        assessmentTypeId:
          available.id,
        weightPercent: 0,
      },
    ]);

    setError(null);
  }

  function removeAssessmentType(
    index: number,
  ) {
    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );

    setError(null);
  }

  function updateAssessmentType(
    index: number,
    assessmentTypeId: string,
  ) {
    setItems((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                assessmentTypeId,
              }
            : item,
      ),
    );
  }

  function updateWeight(
    index: number,
    value: string,
  ) {
    const parsed =
      value === ""
        ? 0
        : Number(value);

    setItems((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                weightPercent:
                  Number.isFinite(parsed)
                    ? parsed
                    : 0,
              }
            : item,
      ),
    );
  }

  function addGradeBand() {
    const nextSortOrder =
      bands.length + 1;

    setBands((current) => [
      ...current,
      {
        grade: "",
        label: "",
        minimumPercent: 0,
        maximumPercent: 0,
        remark: "",
        sortOrder: nextSortOrder,
      },
    ]);
  }

  function removeGradeBand(
    index: number,
  ) {
    setBands((current) =>
      current
        .filter(
          (_, bandIndex) =>
            bandIndex !== index,
        )
        .map(
          (band, bandIndex) => ({
            ...band,
            sortOrder:
              bandIndex + 1,
          }),
        ),
    );
  }

  function updateBand(
    index: number,
    field:
      | "grade"
      | "label"
      | "minimumPercent"
      | "maximumPercent"
      | "remark",
    value: string,
  ) {
    setBands((current) =>
      current.map(
        (band, bandIndex) => {
          if (
            bandIndex !== index
          ) {
            return band;
          }

          if (
            field ===
              "minimumPercent" ||
            field ===
              "maximumPercent"
          ) {
            const parsed =
              value === ""
                ? 0
                : Number(value);

            return {
              ...band,
              [field]:
                Number.isFinite(
                  parsed,
                )
                  ? parsed
                  : 0,
            };
          }

          return {
            ...band,
            [field]: value,
          };
        },
      ),
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (!weightValid) {
      setError(
        `Assessment weights must total exactly 100%. Current total: ${totalWeight.toFixed(
          2,
        )}%.`,
      );

      return;
    }

    if (!bandsValid) {
      setError(
        "Grade bands must cover 0% to 100% continuously without gaps or overlaps.",
      );

      return;
    }

    if (items.length === 0) {
      setError(
        "Add at least one assessment component.",
      );

      return;
    }

    const assessmentTypeIds =
      items.map(
        (item) =>
          item.assessmentTypeId,
      );

    if (
      new Set(
        assessmentTypeIds,
      ).size !==
      assessmentTypeIds.length
    ) {
      setError(
        "Each assessment type can only appear once in a grading scheme.",
      );

      return;
    }

    if (
      bands.some(
        (band) =>
          !band.grade.trim(),
      )
    ) {
      setError(
        "Every grade band must have a grade.",
      );

      return;
    }

    setSaving(true);

    const result =
      await saveGradingConfiguration({
        schemeId,
        items,
        bands,
      });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess(
      "Grading configuration saved successfully.",
    );

    router.refresh();
  }

  const editable =
    schemeStatus !== "archived";

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Assessment weights
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The weights must total exactly 100%.
            </p>
          </div>

          <div
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              weightValid
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {totalWeight.toFixed(2)}%
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map(
            (item, index) => (
              <div
                key={
                  item.id ??
                  `${item.assessmentTypeId}-${index}`
                }
                className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_180px_auto] md:items-end"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assessment type
                  </label>

                  <select
                    value={
                      item.assessmentTypeId
                    }
                    onChange={(event) =>
                      updateAssessmentType(
                        index,
                        event.target
                          .value,
                      )
                    }
                    disabled={!editable}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    {assessmentTypes.map(
                      (type) => (
                        <option
                          key={type.id}
                          value={type.id}
                          disabled={
                            items.some(
                              (
                                other,
                                otherIndex,
                              ) =>
                                otherIndex !==
                                  index &&
                                other.assessmentTypeId ===
                                  type.id,
                            )
                          }
                        >
                          {type.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Weight %
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      item.weightPercent
                    }
                    onChange={(event) =>
                      updateWeight(
                        index,
                        event.target
                          .value,
                      )
                    }
                    disabled={!editable}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeAssessmentType(
                      index,
                    )
                  }
                  disabled={!editable}
                  className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ),
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={addAssessmentType}
            disabled={
              !editable ||
              items.length >=
                assessmentTypes.length
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add assessment component
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">
              Grade bands
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define how final percentages become grades.
            </p>
          </div>

          <button
            type="button"
            onClick={addGradeBand}
            disabled={!editable}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add grade
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {bands.map(
            (band, index) => (
              <div
                key={
                  band.id ??
                  `band-${index}`
                }
                className="space-y-4 px-6 py-5"
              >
                <div className="grid gap-4 lg:grid-cols-[100px_1fr_150px_150px_1fr_auto] lg:items-end">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Grade
                    </label>

                    <input
                      value={band.grade}
                      maxLength={10}
                      onChange={(event) =>
                        updateBand(
                          index,
                          "grade",
                          event.target
                            .value,
                        )
                      }
                      disabled={!editable}
                      placeholder="A"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-bold outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Label
                    </label>

                    <input
                      value={band.label}
                      maxLength={100}
                      onChange={(event) =>
                        updateBand(
                          index,
                          "label",
                          event.target
                            .value,
                        )
                      }
                      disabled={!editable}
                      placeholder="Excellent"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Minimum %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        band.minimumPercent
                      }
                      onChange={(event) =>
                        updateBand(
                          index,
                          "minimumPercent",
                          event.target
                            .value,
                        )
                      }
                      disabled={!editable}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Maximum %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        band.maximumPercent
                      }
                      onChange={(event) =>
                        updateBand(
                          index,
                          "maximumPercent",
                          event.target
                            .value,
                        )
                      }
                      disabled={!editable}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Remark
                    </label>

                    <input
                      value={band.remark}
                      maxLength={255}
                      onChange={(event) =>
                        updateBand(
                          index,
                          "remark",
                          event.target
                            .value,
                        )
                      }
                      disabled={!editable}
                      placeholder="Excellent performance"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeGradeBand(
                        index,
                      )
                    }
                    disabled={
                      !editable
                    }
                    className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {editable && (
        <div className="sticky bottom-4 z-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Configuration status
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {configurationValid
                ? "Configuration is valid and ready to save."
                : "Complete the required configuration before saving."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving ||
              !configurationValid
            }
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Saving..."
              : "Save configuration"}
          </button>
        </div>
      )}
    </div>
  );
}