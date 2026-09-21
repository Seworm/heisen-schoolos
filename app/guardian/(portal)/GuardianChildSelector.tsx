export function GuardianChildSelector({
  childOptions,
  selectedChildId,
  currentPath,
}: {
  childOptions: Array<{
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    studentNumber: string;
    schoolId: string;
  }>;
  selectedChildId?: string;
  currentPath: string;
}) {
  const selected = childOptions.find((child) => child.id === selectedChildId) ?? childOptions[0];

  return (
    <form action={currentPath} method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="guardian-child" className="text-sm font-medium text-slate-700">
        Child
      </label>
      <div className="flex items-center gap-2">
        <select
          id="guardian-child"
          name="child"
          defaultValue={selected?.id ?? ""}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
        >
          {childOptions.map((child) => (
            <option key={child.id} value={child.id}>
              {child.firstName} {child.lastName} ({child.studentNumber})
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          View
        </button>
      </div>
    </form>
  );
}
