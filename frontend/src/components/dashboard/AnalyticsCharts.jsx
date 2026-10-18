import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// ==========================================
// CHART COLORS
// ==========================================

const COLORS = [
  "#38bdf8",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

// ==========================================
// SHARED STYLES
// ==========================================

const chartCardClass =
  "min-w-0 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 p-4 sm:p-6";

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "12px",
  color: "#ffffff",
  fontSize: "12px",
};

// ==========================================
// RESPONSIVE HOOK
// ==========================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 640
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}

// ==========================================
// SHORTEN LONG QUEUE NAMES
// ==========================================

const shortenName = (value, maxLength = 12) => {
  if (!value) return "";

  return value.length > maxLength
    ? `${value.substring(0, maxLength)}...`
    : value;
};

// ==========================================
// ANALYTICS CHARTS
// ==========================================

function AnalyticsCharts({ charts }) {
  const isMobile = useIsMobile();

  if (!charts) {
    return (
      <p className="text-slate-400">
        No chart data available.
      </p>
    );
  }

  const {
    dailyActivity = [],
    queuePerformance = [],
    statusDistribution = [],
  } = charts;

  const totalTokens = statusDistribution.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">

      {/* ==================================
          DAILY QUEUE ACTIVITY
      ================================== */}

      <div className={chartCardClass}>
        <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
          Daily Queue Activity
        </h3>

        <p className="mb-5 text-xs text-slate-400 sm:mb-6 sm:text-sm">
          Tokens generated and completed in the last 7 days.
        </p>

        {dailyActivity.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No daily activity data available.
          </div>
        ) : (
          <div className="h-64 min-w-0 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyActivity}
                margin={{
                  top: 10,
                  right: isMobile ? 5 : 20,
                  left: isMobile ? -25 : 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{
                    fontSize: isMobile ? 9 : 12,
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    isMobile
                      ? String(value).slice(5)
                      : value
                  }
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{
                    fontSize: isMobile ? 10 : 12,
                  }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={isMobile ? 30 : 45}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#ffffff" }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: isMobile ? "11px" : "12px",
                    paddingTop: "10px",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="joined"
                  name="Joined"
                  stroke="#38bdf8"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ r: isMobile ? 2 : 4 }}
                  activeDot={{ r: 5 }}
                />

                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#22c55e"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ r: isMobile ? 2 : 4 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ==================================
          QUEUE PERFORMANCE
      ================================== */}

      <div className={chartCardClass}>
        <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
          Queue Performance
        </h3>

        <p className="mb-5 text-xs text-slate-400 sm:mb-6 sm:text-sm">
          Total tokens vs completed services.
        </p>

        {queuePerformance.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No queue performance data available.
          </div>
        ) : (
          <div className="h-64 min-w-0 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={queuePerformance}
                margin={{
                  top: 10,
                  right: isMobile ? 5 : 20,
                  left: isMobile ? -25 : 0,
                  bottom: 10,
                }}
                barCategoryGap={isMobile ? "30%" : "20%"}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />

                <XAxis
                  dataKey="queueName"
                  stroke="#94a3b8"
                  tick={{
                    fontSize: isMobile ? 9 : 12,
                  }}
                  tickFormatter={(value) =>
                    shortenName(
                      value,
                      isMobile ? 8 : 12
                    )
                  }
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  minTickGap={5}
                />

                <YAxis
                  stroke="#94a3b8"
                  tick={{
                    fontSize: isMobile ? 10 : 12,
                  }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 30 : 45}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#ffffff" }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: isMobile ? "11px" : "12px",
                    paddingTop: "10px",
                  }}
                />

                <Bar
                  dataKey="total"
                  name="Total Tokens"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />

                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#22c55e"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ==================================
          TOKEN STATUS DISTRIBUTION
      ================================== */}

      <div className={chartCardClass}>
        <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
          Token Status Distribution
        </h3>

        <p className="mb-5 text-xs text-slate-400 sm:mb-6 sm:text-sm">
          Current distribution of queue tokens.
        </p>

        {totalTokens === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            No token data available.
          </div>
        ) : (
          <div className="h-72 min-w-0 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy={isMobile ? "43%" : "45%"}
                  innerRadius={isMobile ? 45 : 75}
                  outerRadius={isMobile ? 75 : 110}
                  paddingAngle={4}
                  label={!isMobile}
                  labelLine={!isMobile}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#ffffff" }}
                />

                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{
                    fontSize: isMobile ? "11px" : "12px",
                    paddingTop: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsCharts;