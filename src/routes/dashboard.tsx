import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Trophy, Target, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Mind vs Machine" }],
  }),
  component: Dashboard,
});

interface Stats {
  total: number;
  humanCorrect: number;
  aiCorrect: number;
  avgTime: number;
  avgConf: number;
  agreement: number;
}

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("decisions")
      .select("human_correct,ai_correct,time_taken_ms,human_confidence,agreement")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const total = data.length;
        if (total === 0) {
          setStats({ total: 0, humanCorrect: 0, aiCorrect: 0, avgTime: 0, avgConf: 0, agreement: 0 });
          return;
        }
        setStats({
          total,
          humanCorrect: data.filter((d) => d.human_correct).length,
          aiCorrect: data.filter((d) => d.ai_correct).length,
          avgTime: Math.round(data.reduce((s, d) => s + d.time_taken_ms, 0) / total),
          avgConf: Math.round(data.reduce((s, d) => s + d.human_confidence, 0) / total),
          agreement: Math.round((data.filter((d) => d.agreement).length / total) * 100),
        });
      });
  }, [user]);

  if (loading || !user) return null;

  const score = stats ? stats.humanCorrect * 10 : 0;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to challenge the AI?</h1>
          </div>
          <Button size="lg" className="shadow-glow" asChild>
            <Link to="/test">
              Start a round <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Trophy} label="Score" value={score} hint={`${stats?.humanCorrect ?? 0} correct`} />
          <StatCard
            icon={Target}
            label="Your accuracy"
            value={stats && stats.total ? `${Math.round((stats.humanCorrect / stats.total) * 100)}%` : "—"}
            hint={`AI: ${stats && stats.total ? `${Math.round((stats.aiCorrect / stats.total) * 100)}%` : "—"}`}
          />
          <StatCard icon={Zap} label="Avg time" value={stats?.total ? `${(stats.avgTime / 1000).toFixed(1)}s` : "—"} hint="per question" />
          <StatCard icon={Brain} label="Agreement" value={stats?.total ? `${stats.agreement}%` : "—"} hint="with AI" />
        </div>

        <div className="mt-10 rounded-3xl border bg-gradient-hero p-px">
          <div className="rounded-3xl bg-card p-8">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ol className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <li><b className="text-foreground">1. Read the question.</b> Logical, ethical, or scenario-based.</li>
              <li><b className="text-foreground">2. Choose & rate confidence.</b> A timer captures your speed.</li>
              <li><b className="text-foreground">3. Compare with AI.</b> See accuracy, reasoning, and bias insights.</li>
            </ol>
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/analytics" className="text-primary underline">View full analytics →</Link>
        </p>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
