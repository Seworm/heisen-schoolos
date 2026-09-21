import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, History, TrendingUp } from "lucide-react";
import { getCumulativeTranscript } from "@/lib/transcript";
import PrintTranscriptButton from "./PrintTranscriptButton";

export const dynamic = "force-dynamic";

export default async function StudentTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transcript = await getCumulativeTranscript(id);
  if (!transcript) notFound();

  const fullName = [transcript.student.firstName, transcript.student.middleName, transcript.student.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8" id="transcript">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link href={`/students/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">← Back to student</Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#006b3f]">Academic records</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Cumulative transcript</h1>
          <p className="mt-2 text-sm text-slate-500">A complete history of published academic performance.</p>
        </div>
        <PrintTranscriptButton />
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[#ce1126] via-[#fcd116] to-[#006b3f]" />
        <div className="flex flex-wrap items-center justify-between gap-6 px-6 py-7 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#111111] text-xl font-bold text-white">{transcript.student.firstName[0]}{transcript.student.lastName[0]}</div>
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Student</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{fullName}</h2><p className="mt-1 text-sm text-slate-500">{transcript.student.studentNumber} · {transcript.school.name}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Summary label="Published terms" value={String(transcript.terms.length)} icon={History} />
            <Summary label="Cumulative average" value={`${transcript.cumulativeAverage}%`} icon={TrendingUp} />
            <Summary label="Subjects tracked" value={String(transcript.subjectAverages.length)} icon={BookOpen} />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5"><h2 className="font-bold">Subject performance over time</h2><p className="mt-1 text-xs text-slate-500">Averages are calculated from published term results only.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3 text-right">Cumulative average</th><th className="px-5 py-3 text-right">Terms recorded</th></tr></thead><tbody className="divide-y divide-slate-100">{transcript.subjectAverages.map((subject) => <tr key={subject.subjectId}><td className="px-5 py-4 font-semibold text-slate-800">{subject.subjectName}</td><td className="px-5 py-4 text-right font-bold text-[#006b3f]">{subject.averagePercentage}%</td><td className="px-5 py-4 text-right text-slate-500">{subject.attempts}</td></tr>)}</tbody></table></div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><Award className="h-5 w-5 text-[#f0a800]" /><h2 className="text-xl font-bold">Term-by-term record</h2></div>
        {transcript.terms.map((term) => (
          <article key={term.publicationId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4"><div><h3 className="font-bold">{term.academicYearName} · {term.termName}</h3><p className="mt-1 text-xs text-slate-500">{term.className} · {term.streamName}</p></div><div className="text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Overall</p><p className="text-xl font-bold text-[#006b3f]">{term.overallPercentage}% <span className="text-sm text-slate-400">· #{term.position}</span></p></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Subject</th><th className="px-5 py-3 text-right">Final</th><th className="px-5 py-3">Grade</th><th className="px-5 py-3">Remark</th></tr></thead><tbody className="divide-y divide-slate-100">{term.subjects.map((subject) => <tr key={`${term.publicationId}-${subject.subjectId}`}><td className="px-5 py-3 font-medium text-slate-800">{subject.subjectName}</td><td className="px-5 py-3 text-right font-semibold">{subject.finalPercentage}%</td><td className="px-5 py-3"><span className="rounded-full bg-[#fcd116]/20 px-2.5 py-1 text-xs font-bold text-[#7a5b00]">{subject.grade ?? "—"}</span></td><td className="px-5 py-3 text-slate-500">{subject.remark ?? "—"}</td></tr>)}</tbody></table></div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: string; icon: typeof History }) {
  return <div><Icon className="mb-1 h-4 w-4 text-[#ce1126]" /><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p></div>;
}
