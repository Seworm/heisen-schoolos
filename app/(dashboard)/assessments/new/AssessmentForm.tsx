"use client";

import { useActionState, useMemo, useState } from "react";

import { createAssessment } from "./actions";

type Option = {
  id: string;
  name: string;
};

type StreamOption = {
  id: string;
  name: string;
  className: string;
  classLevelId: string;
};

type SubjectOption = {
  id: string;
  name: string;
  classLevelId: string;
};

type PeriodOption = {
  id: string;
  name: string;
  academicYearId: string;
  termId: string;
};

type TermOption = {
  id: string;
  name: string;
  academicYearId: string;
};

type Props = {
  academicYears: Option[];
  terms: TermOption[];
  periods: PeriodOption[];
  streams: StreamOption[];
  subjects: SubjectOption[];
  assessmentTypes: Option[];
};

const initialState = {
  error: "",
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClassName =
  "block text-sm font-medium text-slate-900";

export default function AssessmentForm({
  academicYears,
  terms,
  periods,
  streams,
  subjects,
  assessmentTypes,
}: Props) {
  const [state, formAction, pending] =
    useActionState(
      createAssessment,
      initialState,
    );

  const [academicYearId, setAcademicYearId] =
    useState("");

  const [termId, setTermId] =
    useState("");

  const [assessmentPeriodId, setAssessmentPeriodId] =
    useState("");

  const [streamId, setStreamId] =
    useState("");

  const [subjectId, setSubjectId] =
    useState("");

  /*
   * ------------------------------------------------------------
   * Filter terms by academic year
   * ------------------------------------------------------------
   */

  const filteredTerms = useMemo(() => {
    if (!academicYearId) {
      return [];
    }

    return terms.filter(
      (term) =>
        term.academicYearId ===
        academicYearId,
    );
  }, [academicYearId, terms]);

  /*
   * ------------------------------------------------------------
   * Filter assessment periods by academic year + term
   * ------------------------------------------------------------
   */

  const filteredPeriods = useMemo(() => {
    if (
      !academicYearId ||
      !termId
    ) {
      return [];
    }

    return periods.filter(
      (period) =>
        period.academicYearId ===
          academicYearId &&
        period.termId === termId,
    );
  }, [
    academicYearId,
    termId,
    periods,
  ]);

  /*
   * ------------------------------------------------------------
   * Selected stream
   * ------------------------------------------------------------
   */

  const selectedStream = useMemo(() => {
    return streams.find(
      (stream) =>
        stream.id === streamId,
    );
  }, [streamId, streams]);

  /*
   * ------------------------------------------------------------
   * Filter subjects by selected class level
   * ------------------------------------------------------------
   */

  const filteredSubjects = useMemo(() => {
    if (!selectedStream) {
      return [];
    }

    return subjects.filter(
      (subject) =>
        subject.classLevelId ===
        selectedStream.classLevelId,
    );
  }, [selectedStream, subjects]);

  /*
   * ------------------------------------------------------------
   * Academic year change
   * ------------------------------------------------------------
   */

  function handleAcademicYearChange(
    value: string,
  ) {
    setAcademicYearId(value);

    /*
     * Reset everything that depends on
     * the academic year.
     */
    setTermId("");
    setAssessmentPeriodId("");
  }

  /*
   * ------------------------------------------------------------
   * Term change
   * ------------------------------------------------------------
   */

  function handleTermChange(
    value: string,
  ) {
    setTermId(value);

    /*
     * Period depends on the selected term.
     */
    setAssessmentPeriodId("");
  }

  /*
   * ------------------------------------------------------------
   * Stream change
   * ------------------------------------------------------------
   */

  function handleStreamChange(
    value: string,
  ) {
    setStreamId(value);

    /*
     * Subject depends on the selected class.
     */
    setSubjectId("");
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
    >
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <div className="font-semibold">
            Unable to create assessment
          </div>

          <p className="mt-1">
            {state.error}
          </p>
        </div>
      )}

      {/* ======================================================
          ACADEMIC CONTEXT
      ======================================================= */}

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Academic context
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Select the academic year, term and
            assessment period for this assessment.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Academic year */}

          <div>
            <label
              htmlFor="academicYearId"
              className={labelClassName}
            >
              Academic year
            </label>

            <select
              id="academicYearId"
              name="academicYearId"
              required
              value={academicYearId}
              onChange={(event) =>
                handleAcademicYearChange(
                  event.target.value,
                )
              }
              className={inputClassName}
            >
              <option value="">
                Select academic year
              </option>

              {academicYears.map(
                (year) => (
                  <option
                    key={year.id}
                    value={year.id}
                  >
                    {year.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Term */}

          <div>
            <label
              htmlFor="termId"
              className={labelClassName}
            >
              Term
            </label>

            <select
              id="termId"
              name="termId"
              required
              value={termId}
              disabled={!academicYearId}
              onChange={(event) =>
                handleTermChange(
                  event.target.value,
                )
              }
              className={inputClassName}
            >
              <option value="">
                {!academicYearId
                  ? "Select academic year first"
                  : filteredTerms.length === 0
                    ? "No terms available"
                    : "Select term"}
              </option>

              {filteredTerms.map(
                (term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {/* Assessment period */}

        <div>
          <label
            htmlFor="assessmentPeriodId"
            className={labelClassName}
          >
            Assessment period
          </label>

          <select
            id="assessmentPeriodId"
            name="assessmentPeriodId"
            required
            value={assessmentPeriodId}
            disabled={
              !academicYearId ||
              !termId
            }
            onChange={(event) =>
              setAssessmentPeriodId(
                event.target.value,
              )
            }
            className={inputClassName}
          >
            <option value="">
              {!academicYearId
                ? "Select academic year first"
                : !termId
                  ? "Select term first"
                  : filteredPeriods.length ===
                      0
                    ? "No assessment periods available"
                    : "Select assessment period"}
            </option>

            {filteredPeriods.map(
              (period) => (
                <option
                  key={period.id}
                  value={period.id}
                >
                  {period.name}
                </option>
              ),
            )}
          </select>

          {academicYearId &&
            termId &&
            filteredPeriods.length ===
              0 && (
              <p className="mt-2 text-xs text-amber-600">
                No assessment period has been
                created for this term yet.
              </p>
            )}
        </div>
      </section>

      {/* ======================================================
          CLASS AND SUBJECT
      ======================================================= */}

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Class and subject
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Select the stream and subject being
            assessed.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Stream */}

          <div>
            <label
              htmlFor="streamId"
              className={labelClassName}
            >
              Class / Stream
            </label>

            <select
              id="streamId"
              name="streamId"
              required
              value={streamId}
              onChange={(event) =>
                handleStreamChange(
                  event.target.value,
                )
              }
              className={inputClassName}
            >
              <option value="">
                Select stream
              </option>

              {streams.map(
                (stream) => (
                  <option
                    key={stream.id}
                    value={stream.id}
                  >
                    {stream.className}{" "}
                    {stream.name}
                  </option>
                ),
              )}
            </select>

            {selectedStream && (
              <p className="mt-2 text-xs text-slate-500">
                Creating this assessment for{" "}
                <span className="font-medium text-slate-700">
                  {selectedStream.className}{" "}
                  {selectedStream.name}
                </span>
                .
              </p>
            )}
          </div>

          {/* Subject */}

          <div>
            <label
              htmlFor="subjectId"
              className={labelClassName}
            >
              Subject
            </label>

            <select
              id="subjectId"
              name="subjectId"
              required
              value={subjectId}
              disabled={!streamId}
              onChange={(event) =>
                setSubjectId(
                  event.target.value,
                )
              }
              className={inputClassName}
            >
              <option value="">
                {!streamId
                  ? "Select stream first"
                  : filteredSubjects.length ===
                      0
                    ? "No subjects assigned"
                    : "Select subject"}
              </option>

              {filteredSubjects.map(
                (subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ),
              )}
            </select>

            {streamId &&
              filteredSubjects.length ===
                0 && (
                <p className="mt-2 text-xs text-amber-600">
                  No subjects have been assigned
                  to this class yet.
                </p>
              )}

            {streamId &&
              filteredSubjects.length >
                0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Showing subjects assigned to{" "}
                  {selectedStream?.className}.
                </p>
              )}
          </div>
        </div>
      </section>

      {/* ======================================================
          ASSESSMENT CONFIGURATION
      ======================================================= */}

      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Assessment configuration
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Define the assessment type, maximum
            score and title.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Assessment type */}

          <div>
            <label
              htmlFor="assessmentTypeId"
              className={labelClassName}
            >
              Assessment type
            </label>

            <select
              id="assessmentTypeId"
              name="assessmentTypeId"
              required
              defaultValue=""
              className={inputClassName}
            >
              <option value="">
                Select type
              </option>

              {assessmentTypes.map(
                (type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Maximum score */}

          <div>
            <label
              htmlFor="maxScore"
              className={labelClassName}
            >
              Maximum score
            </label>

            <input
              id="maxScore"
              name="maxScore"
              type="number"
              min="0.01"
              max="999999.99"
              step="0.01"
              required
              placeholder="e.g. 20"
              className={inputClassName}
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter the maximum raw mark before
              grading or weighting.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Assessment name */}

          <div>
            <label
              htmlFor="name"
              className={labelClassName}
            >
              Assessment name
            </label>

            <input
              id="name"
              name="name"
              required
              maxLength={200}
              placeholder="e.g. Mathematics CAT 1"
              className={inputClassName}
            />
          </div>

          {/* Assessment date */}

          <div>
            <label
              htmlFor="assessmentDate"
              className={labelClassName}
            >
              Assessment date
            </label>

            <input
              id="assessmentDate"
              name="assessmentDate"
              type="date"
              className={inputClassName}
            />

            <p className="mt-2 text-xs text-slate-500">
              If provided, the date must fall
              within the selected academic period.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          INSTRUCTIONS
      ======================================================= */}

      <section>
        <label
          htmlFor="instructions"
          className={labelClassName}
        >
          Instructions
        </label>

        <textarea
          id="instructions"
          name="instructions"
          rows={4}
          maxLength={5000}
          placeholder="Optional instructions for teachers or markers"
          className={`${inputClassName} resize-y`}
        />

        <p className="mt-2 text-xs text-slate-500">
          Optional. These instructions can be
          displayed to teachers when entering scores.
        </p>
      </section>

      {/* ======================================================
          ACTIONS
      ======================================================= */}

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          The assessment will be created in{" "}
          <span className="font-medium text-slate-700">
            Draft
          </span>{" "}
          status.
        </p>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Creating..."
            : "Create assessment"}
        </button>
      </div>
    </form>
  );
}