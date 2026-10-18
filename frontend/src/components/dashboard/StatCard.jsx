import {
  ArrowUpRight,
} from "lucide-react";

const THEMES = {
  sky: {
    icon: "bg-sky-500/15 text-sky-300 ring-sky-400/20",
    glow: "bg-sky-500/10",
    line: "from-sky-400 to-cyan-400",
  },

  cyan: {
    icon: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/20",
    glow: "bg-cyan-500/10",
    line: "from-cyan-400 to-sky-400",
  },

  green: {
    icon: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
    glow: "bg-emerald-500/10",
    line: "from-emerald-400 to-teal-400",
  },

  purple: {
    icon: "bg-violet-500/15 text-violet-300 ring-violet-400/20",
    glow: "bg-violet-500/10",
    line: "from-violet-400 to-indigo-400",
  },

  orange: {
    icon: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
    glow: "bg-amber-500/10",
    line: "from-amber-400 to-orange-400",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  color = "sky",
}) {
  const theme = THEMES[color] || THEMES.sky;

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#18233d] to-[#10182d] p-5 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:shadow-indigo-500/10 sm:p-6">

      {/* BACKGROUND GLOW */}

      <div
        className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full ${theme.glow} blur-3xl`}
      />

      {/* CONTENT */}

      <div className="relative flex min-w-0 items-start justify-between gap-3">

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-slate-400 sm:text-sm">
            {title}
          </p>

          <h3 className="mt-4 break-words text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {value ?? "—"}
          </h3>
        </div>

        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-110 ${theme.icon}`}
          >
            <Icon size={23} strokeWidth={2} />
          </div>
        )}

      </div>

      {/* DECORATIVE FOOTER */}

      <div className="relative mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">

        <span className="text-[11px] font-medium text-slate-500">
          QueueX Overview
        </span>

        <ArrowUpRight
          size={15}
          className="text-slate-600 transition-colors group-hover:text-indigo-400"
        />

      </div>

      {/* BOTTOM GRADIENT */}

      <div
        className={`absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r ${theme.line} transition-all duration-500 group-hover:w-full`}
      />

    </div>
  );
}

export default StatCard;