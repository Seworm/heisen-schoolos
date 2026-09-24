import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Coins,
  MessageSquare,
  UsersRound,
} from "lucide-react";
import { PublicFooter, PublicNav } from "@/components/PublicSite";

const modules = [
  {
    icon: UsersRound,
    title: "Student information",
    text: "Admissions, guardians, classes, placements and complete student records.",
  },
  {
    icon: BookOpen,
    title: "Academics",
    text: "Curriculum, subjects, assessments, report cards and academic progress.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance & welfare",
    text: "Daily attendance, discipline, safeguarding, library and transport workflows.",
  },
  {
    icon: Coins,
    title: "Fees & accounting",
    text: "Invoices, payments, feeding fees, scholarships, cashbook and reports.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    text: "Targeted announcements, parent notifications and Ghana-ready SMS.",
  },
  {
    icon: BarChart3,
    title: "Actionable insights",
    text: "Exportable reports that help school leaders make faster decisions.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#071c34] text-white">
      <PublicNav />

      <section className="relative overflow-hidden border-y border-white/10 bg-[#081c35]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(246,165,58,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.04),transparent_18%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="mx-auto flex max-w-[1080px] justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#f6a53a]/30 bg-[#f6a53a]/10 px-5 py-2.5 text-sm font-bold text-[#f8d79b] shadow-[0_0_20px_rgba(246,165,58,0.08)]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#f6a53a]" />
              12,000+ Users already On-Board
            </div>
          </div>

          <div className="mt-10 text-center">
            <h1 className="mx-auto max-w-6xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl lg:text-[7rem]">
              Welcome To The World&apos;s
              <span className="block">Leading EdTech Platform</span>
            </h1>

            <p className="mx-auto mt-8 max-w-5xl text-lg leading-8 text-slate-300 lg:text-[1.8rem] lg:leading-[1.5]">
              ADESUAPA seeks to empower learners, educators and parents, our cutting-edge website and
              mobile application delivers unparalleled access to quality education, personalized learning
              experiences, and innovative teaching tools.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[28px] border border-slate-200 bg-[#f3f6fb] text-slate-900 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
            <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="border-r border-slate-200 bg-slate-100/80 p-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Greenfield International School</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">Dashboard</p>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  {[
                    "Dashboard",
                    "Subscriptions",
                    "SMS & AI",
                    "Academics",
                    "Core",
                    "Essential",
                    "Advanced",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={[
                        "flex items-center justify-between rounded-xl px-3 py-2.5",
                        index === 0 ? "bg-white text-slate-900 shadow-sm" : "bg-transparent",
                      ].join(" ")}
                    >
                      <span>{item}</span>
                      {index === 0 && <span className="h-2 w-2 rounded-full bg-[#f6a53a]" />}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-5 lg:p-6">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">School Dashboard</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Greenfield International School</h2>
                    <p className="mt-1 text-sm text-slate-500">(Greenfield International School Main Campus)</p>
                  </div>

                  <div className="flex items-center gap-3 self-start rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                      D
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Demo Administrator</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Admin</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-100 p-5">
                  <p className="text-2xl font-bold text-slate-900">Good Morning, Demo Administrator</p>
                  <p className="mt-2 text-sm text-slate-600">Welcome to your dashboard. Here&apos;s an overview of your school&apos;s current status.</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Total Students", "1,830", "blue"],
                    ["Total Staff", "43", "amber"],
                    ["Subscriptions Day Left", "248", "slate"],
                    ["SMS Balance", "91", "green"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{label}</span>
                        <span className={[
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                          tone === "blue" && "bg-sky-100 text-sky-700",
                          tone === "amber" && "bg-amber-100 text-amber-700",
                          tone === "slate" && "bg-slate-200 text-slate-700",
                          tone === "green" && "bg-emerald-100 text-emerald-700",
                        ].join(" ")}>
                          {tone === "blue" && "👩‍🎓"}
                          {tone === "amber" && "👥"}
                          {tone === "slate" && "📅"}
                          {tone === "green" && "💬"}
                        </span>
                      </div>
                      <p className="mt-5 text-3xl font-black tracking-tight text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f6a53a]">One connected platform</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            From first admission to final report card.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Replace disconnected spreadsheets and manual follow-up with workflows your whole school can use.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-[#0d2346] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:border-[#f6a53a]/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6a53a]/10 text-[#f6a53a]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0a1e37] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-2xl font-extrabold">Ready to run a better school?</p>
            <p className="mt-2 text-sm text-slate-300">Set up your workspace and bring your team together.</p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f6a53a] px-5 py-3 font-bold text-[#0b1730] hover:bg-[#f9ba67]"
          >
            Create your school
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

