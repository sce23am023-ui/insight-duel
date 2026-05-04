import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Legend, CartesianGrid } from "recharts";
import { Brain, Cpu, Scale, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Mind vs Machine" }] }),
  component: AnalyticsPage,
});

type Row = {
  created_at: string;
  human_correct: boolean;
  ai_correct: boolean | null;
  human_confidence: number;
  ai_confidence: number | null;
  time_taken_ms: number;
  agreement: boolean | null;
  human_answer: string;
  correct_answer: string;
  questions: { type: string } | null;
};

function AnalyticsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("decisions")
      .select("created_at,human_correct,ai_correct,human_confidence,ai_confidence,time_taken_ms,agreement,human_answer,correct_answer,questions(type)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [user]);

  const stats = useMemo(() => {
    const total = rows.length;
    if (!total) return null;
    const humanAcc = Math.round((rows.filter((r) => r.human_correct).length / total) * 100);
    const aiAcc = Math.round((rows.filter((r) => r.ai_correct).length / total) * 100);
    const avgTime = Math.round(rows.reduce((s, r) => s + r.time_taken_ms, 0) / total);
    const avgConf = Math.round(rows.reduce((s, r) => s + r.human_confidence, 0) / total);
    const agreement = Math.round((rows.filter((r) => r.agreement).length / total) * 100);

    // Rolling accuracy chart
    let hc = 0, ac = 0;
    const trend = rows.map((r, i) => {
      hc += r.human_correct ? 1 : 0;
      ac += r.ai_correct ? 1 : 0;
      return {
        n: i + 1,
        you: Math.round((hc / (i + 1)) * 100),
        ai: Math.round((ac / (i + 1)) * 100),
        confidence: r.human_confidence,
        time: Math.round(r.time_taken_ms / 1000),
      };
    });

    // By type
    const types = ["logical", "ethical", "scenario"];
    const byType = types.map((t) => {
      const subset = rows.filter((r) => r.questions?.type === t);
      const tot = subset.length || 1;
      return {
        type: t,
        you: Math.round((subset.filter((r) => r.human_correct).length / tot) * 100),
        ai: Math.round((subset.filter((r) => r.ai_correct).length / tot) * 100),
      };
    });

    // Bias: confidence calibration
    const overconfident = rows.filter((r) => r.human_confidence >= 80 && !r.human_correct).length;
    const underconfident = rows.filter((r) => r.human_confidence < 50 && r.human_correct).length;
    const calibration = Math.round(100 - Math.abs(humanAcc - avgConf));

    // Risk vs safe heuristic (first option as "safer", last as "riskier")
    return { total, humanAcc, aiAcc, avgTime, avgConf, agreement, trend, byType, overconfident, underconfident, calibration };
  }, [rows]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Patterns across your {rows.length} decision{rows.length === 1 ? "" : "s"}.</p>
        </div>

        {!stats ? (
          <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
            Play a few rounds to unlock analytics.
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="You accuracy" value={`${stats.humanAcc}%`} icon={Brain} accent="human" />
              <Stat label="AI accuracy" value={`${stats.aiAcc}%`} icon={Cpu} accent="ai" />
              <Stat label="Agreement" value={`${stats.agreement}%`} icon={Scale} />
              <Stat label="Calibration" value={`${stats.calibration}%`} icon={Sparkles} hint="how well confidence matches reality" />
            </div>

            <Card title="Accuracy over time">
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={stats.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="n" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                    <Legend />
                    <Line type="monotone" dataKey="you" stroke="var(--color-human)" strokeWidth={2.5} dot={false} name="You" />
                    <Line type="monotone" dataKey="ai" stroke="var(--color-ai)" strokeWidth={2.5} dot={false} name="AI" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Accuracy by question type">
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={stats.byType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="type" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                      <Legend />
                      <Bar dataKey="you" fill="var(--color-human)" radius={[8, 8, 0, 0]} name="You" />
                      <Bar dataKey="ai" fill="var(--color-ai)" radius={[8, 8, 0, 0]} name="AI" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Confidence trend">
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={stats.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="n" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                      <Line type="monotone" dataKey="confidence" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} name="Confidence %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card title="Bias & behavior insights">
              <div className="grid gap-4 sm:grid-cols-3">
                <Insight title="Overconfidence" value={stats.overconfident} caption="times you were 80%+ sure but wrong" />
                <Insight title="Underconfidence" value={stats.underconfident} caption="times you were <50% sure but right" />
                <Insight title="Avg decision time" value={`${(stats.avgTime / 1000).toFixed(1)}s`} caption={stats.avgTime < 8000 ? "Snap-judgment style" : stats.avgTime > 25000 ? "Deliberative style" : "Balanced pace"} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {stats.calibration >= 80
                  ? "✨ Your confidence is well calibrated — you know what you know."
                  : stats.avgConf > stats.humanAcc + 15
                  ? "⚠️ You tend to be overconfident. Consider sanity-checking quick gut answers."
                  : stats.avgConf < stats.humanAcc - 15
                  ? "💡 You're more accurate than you think — trust your reasoning more."
                  : "Keep playing to refine your decision profile."}
              </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent, hint }: { label: string; value: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent?: "human" | "ai"; hint?: string }) {
  const color = accent === "human" ? "var(--color-human)" : accent === "ai" ? "var(--color-ai)" : "var(--color-primary)";
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color }}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Insight({ title, value, caption }: { title: string; value: string | number; caption: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}
