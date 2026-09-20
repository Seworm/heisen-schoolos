"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from "lucide-react";

import {
  createFeeStructureAction,
  updateFeeStructureItemsAction,
} from "../../actions";

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean | null;
};

type Term = {
  id: string;
  name: string;
  academicYearId: string;
};

type ClassLevel = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
};

type FeeItem = {
  feeCategoryId: string;
  amount: string;
  description: string;
};

type Props = {
  mode: "create" | "edit";
  feeStructureId?: string;
  academicYears: AcademicYear[];
  terms: Term[];
  classLevels: ClassLevel[];
  categories: Category[];
  initialValues?: {
    name: string;
    description: string;
    academicYearId: string;
    termId: string;
    classLevelId: string;
    items: FeeItem[];
  };
};

export default function FeeStructureForm({
  mode,
  feeStructureId,
  academicYears,
  terms,
  classLevels,
  categories,
  initialValues,
}: Props) {
  const [academicYearId, setAcademicYearId] = useState(
    initialValues?.academicYearId ||
      academicYears.find((year) => year.isCurrent)?.id ||
      academicYears[0]?.id ||
      "",
  );

  const [termId, setTermId] = useState(
    initialValues?.termId || "",
  );

  const [classLevelId, setClassLevelId] = useState(
    initialValues?.classLevelId || "",
  );

  const [items, setItems] = useState<FeeItem[]>(
    initialValues?.items?.length
      ? initialValues.items
      : [
          {
            feeCategoryId: "",
            amount: "",
            description: "",
          },
        ],
  );

  const filteredTerms = useMemo(
    () =>
      terms.filter(
        (term) => term.academicYearId === academicYearId,
      ),
    [terms, academicYearId],
  );

  const total = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  function updateItem(
    index: number,
    field: keyof FeeItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        feeCategoryId: "",
        amount: "",
        description: "",
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const selectedCategoryIds = items
    .map((item) => item.feeCategoryId)
    .filter(Boolean);

  const availableCategories = (currentCategoryId: string) =>
    categories.filter(
      (category) =>
        category.id === currentCategoryId ||
        !selectedCategoryIds.includes(category.id),
    );

  return (
    <form
      action={async (formData) => {
  formData.set(
    "items",
    JSON.stringify(
      items.map((item) => ({
        feeCategoryId: item.feeCategoryId,
        amount: item.amount,
        description: item.description || undefined,
      })),
    ),
  );

  if (mode === "create") {
    await createFeeStructureAction(formData);
  } else {
    await updateFeeStructureItemsAction(formData);
  }
}}
      className="space-y-6"
    >
      {mode === "edit" && (
        <input
          type="hidden"
          name="feeStructureId"
          value={feeStructureId}
        />
      )}

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold">Structure details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the academic context this fee structure applies to.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Structure name" required>
            <input
              name="name"
              required
              defaultValue={initialValues?.name || ""}
              placeholder="e.g. JHS 1 Term 1 Fees"
              className="input-field"
            />
          </Field>

          <Field label="Class level" required>
            <select
              name="classLevelId"
              required
              value={classLevelId}
              onChange={(event) =>
                setClassLevelId(event.target.value)
              }
              className="input-field"
            >
              <option value="">Select class level</option>
              {classLevels.map((classLevel) => (
                <option
                  key={classLevel.id}
                  value={classLevel.id}
                >
                  {classLevel.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Academic year" required>
            <select
              name="academicYearId"
              required
              value={academicYearId}
              onChange={(event) => {
                const nextYearId = event.target.value;
                setAcademicYearId(nextYearId);
                setTermId("");
              }}
              className="input-field"
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Term" required>
            <select
              name="termId"
              required
              value={termId}
              onChange={(event) =>
                setTermId(event.target.value)
              }
              className="input-field"
            >
              <option value="">Select term</option>
              {filteredTerms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>

            {academicYearId && filteredTerms.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                No terms are configured for this academic year.
              </p>
            )}
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                name="description"
                defaultValue={initialValues?.description || ""}
                rows={3}
                placeholder="Optional description..."
                className="input-field resize-none"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Fee components</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each fee category and its amount.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add fee
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="p-6">
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">
                No active fee categories
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create at least one active fee category before
                creating a fee structure.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {items.map((item, index) => (
                <div
                  key={`${index}-${item.feeCategoryId}`}
                  className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_1fr_auto]"
                >
                  <Field label="Fee category" required>
                    <select
                      required
                      value={item.feeCategoryId}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "feeCategoryId",
                          event.target.value,
                        )
                      }
                      className="input-field"
                    >
                      <option value="">
                        Select fee category
                      </option>

                      {availableCategories(
                        item.feeCategoryId,
                      ).map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Amount" required>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                        GHS
                      </span>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.amount}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "amount",
                            event.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="input-field pl-12"
                      />
                    </div>
                  </Field>

                  <Field label="Description">
                    <input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          index,
                          "description",
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                      className="input-field"
                    />
                  </Field>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      aria-label="Remove fee"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-4">
              <span className="font-medium">Total fee</span>
              <span className="text-xl font-semibold">
                {new Intl.NumberFormat("en-GH", {
                  style: "currency",
                  currency: "GHS",
                  minimumFractionDigits: 2,
                }).format(total)}
              </span>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={
            mode === "edit" && feeStructureId
              ? `/finance/fee-structures/${feeStructureId}`
              : "/finance/fee-structures"
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={categories.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {mode === "create"
            ? "Create fee structure"
            : "Save changes"}
        </button>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }

        .input-field:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-destructive">*</span>
        )}
      </span>
      {children}
    </label>
  );
}

