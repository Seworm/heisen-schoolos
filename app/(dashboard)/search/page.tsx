import { Search } from "lucide-react";
export default function SearchPage(){return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8"><p className="text-sm text-slate-500">School-wide search</p><h1 className="text-3xl font-semibold tracking-tight">Search</h1><form action="/search" className="mt-6 flex gap-2"><input name="q" placeholder="Student name, ID, guardian, teacher or class" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2"/><button className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white"><Search className="h-4 w-4"/>Search</button></form><p className="mt-6 text-sm text-slate-500">Search results are school-scoped on the server.</p></main>}


