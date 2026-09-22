import Link from "next/link";
import { PublicFooter, PublicNav } from "@/components/PublicSite";

const features = ["Students, staff and admissions", "Academics, attendance and results", "Fees, payroll and reporting", "Transport, communications and operations"];

export default function Home() {
  return <main className="min-h-screen bg-[#f8fcf9] text-slate-950">
    <PublicNav />
    <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:py-28">
      <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087443]">Heisen SMS · Education OS</p><h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-6xl">Run your school with clarity.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">One intelligent platform for school leaders, teachers, finance teams, students and families.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="rounded-xl bg-[#087443] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-[#056137]">Register your school</Link><Link href="/pricing" className="rounded-xl border border-[#cfe4d5] bg-white px-5 py-3 text-sm font-bold text-[#087443] hover:bg-[#edf7f0]">View pricing</Link></div></div>
      <div className="rounded-3xl border border-[#d9e9de] bg-white p-6 shadow-xl shadow-emerald-950/10"><div className="rounded-2xl bg-[#edf7f0] p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#087443]">Everything connected</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{features.map((feature) => <div key={feature} className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">{feature}</div>)}</div></div><p className="mt-5 text-sm leading-6 text-slate-500">Built for growing schools that need secure workflows, useful insights and a calm daily operating system.</p></div>
    </section>
    <section className="border-y border-[#e1eee4] bg-white"><div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:grid-cols-3 lg:px-8"><Metric value="1" label="connected school workspace" /><Metric value="24/7" label="secure access for your team" /><Metric value="GHS" label="built for Ghanaian schools" /></div></section>
    <PublicFooter />
  </main>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div><p className="text-3xl font-bold text-[#087443]">{value}</p><p className="mt-1 text-sm text-slate-500">{label}</p></div>; }
