"use client";

import React from "react";
import {
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
  MapPin,
  BookOpen,
  Award,
  Layers,
  Code2,
  ShieldCheck,
  Building2
} from "lucide-react";
import { PORTFOLIO_DATA } from "./portfolioData";

export default function EducationSection() {
  const academicDisciplines = [
    {
      title: "Data Structures & Algorithms",
      desc: "Algorithmic thinking, complexity analysis (Big-O), search/sort patterns, and efficient in-memory data structures.",
    },
    {
      title: "Database Management Systems",
      desc: "Relational modeling, NoSQL document architecture (MongoDB), indexing strategies, and ACID/atomic transactions.",
    },
    {
      title: "Software Engineering & Architecture",
      desc: "Object-oriented design, modularity, role segregation, separation of concerns, and system reliability.",
    },
    {
      title: "Web Technologies & Protocols",
      desc: "HTTP/REST standards, client-server lifecycle, Server-Sent Events (SSE), stateless JWT sessions, and responsive UX.",
    },
  ];

  return (
    <section id="education" className="py-20 lg:py-28 relative border-t border-slate-800/60">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level 9: Academic Background</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100">
            Education &amp; Academic Timeline
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Verified academic enrollment record provided directly by Darshan Jalondhara, connecting university foundations
            with practical production software engineering.
          </p>
        </div>

        {/* 2-Column Responsive Layout - Fills Desktop Widescreen Beautifully */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          {/* Left Column: Primary Academic Institution Card (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-8 lg:p-10 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
            <div>
              {/* Institution Header */}
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5 mb-6 w-full">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/15">
                  <GraduationCap className="w-6 h-6 sm:w-11 sm:h-11" />
                </div>

                <div className="min-w-0 flex-1 w-full">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                      Higher Education
                    </span>
                    <span className="text-xs font-mono font-semibold text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Active Student
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug w-full break-words">
                    {PORTFOLIO_DATA.profile.education.institution}
                  </h3>
                </div>
              </div>

              {/* Institution Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-1">Enrollment Timeline</span>
                  <div className="flex items-center gap-2 font-mono text-emerald-400 font-bold text-sm">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{PORTFOLIO_DATA.profile.education.period}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Campus Location</span>
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Surat, Gujarat, India</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Academic Status</span>
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>In Progress / Good Standing</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Curriculum Orientation</span>
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Computer Applications &amp; Software</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Pursuing comprehensive higher academic education while actively developing enterprise full-stack
                systems. Practical application of computer science principles to asynchronous backend services,
                distributed events, and modern responsive frontend frameworks.
              </p>
            </div>

            {/* Truthful Note */}
            <div className="pt-5 border-t border-slate-800 text-xs text-slate-400 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Note: Degree title, grades, and specific coursework are omitted per truthful portfolio guidelines. Only verified institutional enrollment is represented.
              </span>
            </div>
          </div>

          {/* Right Column: Academic Engineering Disciplines (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between p-4 sm:p-8 lg:p-10 rounded-3xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl shadow-2xl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Theoretical Foundations
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-100 mb-4">
                Core Academic &amp; Engineering Disciplines
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                University coursework reinforced through direct engineering implementation in GourmetOS:
              </p>

              {/* Disciplines Grid */}
              <div className="space-y-4 mb-6">
                {academicDisciplines.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-100 text-sm mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{d.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-3.5">
                      {d.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic-to-Production Impact */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-200 flex items-center gap-3">
              <Award className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-emerald-300 block mb-0.5">Theory to Production Implementation</strong>
                Applied database normalization, async event loops, and RESTful statelessness directly into production code.
              </div>
            </div>
          </div>
        </div>

        {/* 3 Full-Width Key Verification Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">Verified Institutional Record</div>
              <div className="text-xs text-slate-400">Enrolled at accredited university</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">100% Truthful Portfolio</div>
              <div className="text-xs text-slate-400">Zero inflated or unverified claims</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">Continuous Applied Learning</div>
              <div className="text-xs text-slate-400">Pairing syllabus with live software delivery</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
