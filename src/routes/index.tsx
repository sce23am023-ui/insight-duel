import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Brain, Sparkles, BarChart3, Zap, Scale, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mind vs Machine — AI vs Human Decision Analysis" },
      { name: "description", content: "Take the same questions as an AI. See who's faster, more accurate, more confident — and discover your decision-making biases." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-10" />
          <div className="mx-auto max-w-5xl px-4 pt-20 pb-24 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" />
              Powered by Lovable AI
            </div>
            <h1 className="text-balance bg-gradient-hero bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent sm:text-7xl">
              Mind vs Machine
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
              Answer the same logical, ethical, and scenario-based questions as an AI.
              Compare accuracy, speed, and confidence — and uncover your hidden decision biases.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button size="lg" className="shadow-glow" asChild>
                <Link to="/auth">Start the challenge</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Brain, title: "Decision Tests", text: "Logical, ethical, and scenario-based questions answered simultaneously by you and AI." },
              { icon: Zap, title: "Real-time Metrics", text: "Track time-to-answer, confidence calibration, and agreement rates." },
              { icon: BarChart3, title: "Bias Insights", text: "Discover whether you skew safe, risky, logical, or emotional in your choices." },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-glow">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border bg-gradient-vs p-px">
            <div className="rounded-3xl bg-card p-8 sm:p-12">
              <div className="grid items-center gap-8 sm:grid-cols-2">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" /> The benchmark
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight">You vs the model — same question, same options.</h2>
                  <p className="mt-3 text-muted-foreground">
                    After every round we compute accuracy, time taken, confidence delta, and whether you agreed with the machine. Over time you'll see the patterns.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-2xl bg-[var(--color-human)]/10 p-6">
                    <Brain className="mx-auto h-8 w-8 text-[var(--color-human)]" />
                    <div className="mt-2 text-sm font-medium">Human</div>
                  </div>
                  <div className="rounded-2xl bg-[var(--color-ai)]/10 p-6">
                    <Scale className="mx-auto h-8 w-8 text-[var(--color-ai)]" />
                    <div className="mt-2 text-sm font-medium">AI</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
