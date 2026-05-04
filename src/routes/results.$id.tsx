import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Cpu, Check, X, Trophy, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/results/$id")({
  head: () => ({ meta: [{ title: "Result — Mind vs Machine" }] }),
  component: ResultPage,
});

type Decision = {
  id: string;
  human_answer: string;
  human_confidence: number;
  human_reasoning: string | null;
  ai_answer: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  correct_answer: string;
  human_correct: boolean;
  ai_correct: boolean | null;
  time_taken_ms: number;
  agreement: boolean | null;
  result: string | null;
  questions: { question_text: string; type: string } | null;
};

function ResultPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [d, setD] = useState<Decision | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("decisions")
      .select("*, questions(question_text, type)")
      .eq("id", id)
      .single()
      .then(({ data }) => setD(data as Decision | null));
  }, [user, id]);

  if (!d) return <div className="min-h-screen"><AppHeader /></div>;

  const winner = d.result === "human" ? "You won" : d.result === "ai" ? "AI won" : "Tie";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 rounded-3xl border bg-gradient-hero p-px shadow-glow">
          <div className="rounded-3xl bg-card p-8 text-center">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-3 text-3xl font-bold">{winner}</h1>
            <p className="mt-2 text-muted-foreground">Correct answer: <b className="text-foreground">{d.correct_answer}</b></p>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {(d.time_taken_ms / 1000).toFixed(1)}s</span>
              <span>Agreement: <b className={d.agreement ? "text-success" : "text-destructive"}>{d.agreement ? "Yes" : "No"}</b></span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{d.questions?.type}</div>
          <h2 className="mt-1 text-xl font-semibold">{d.questions?.question_text}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AnswerCard
            who="You"
            color="human"
            icon={Brain}
            answer={d.human_answer}
            confidence={d.human_confidence}
            reasoning={d.human_reasoning}
            correct={d.human_correct}
          />
          <AnswerCard
            who="AI"
            color="ai"
            icon={Cpu}
            answer={d.ai_answer ?? "—"}
            confidence={d.ai_confidence ?? 0}
            reasoning={d.ai_reasoning}
            correct={d.ai_correct}
          />
        </div>

        <div className="mt-6 rounded-2xl border bg-card p-6">
          <h3 className="font-semibold">Confidence comparison</h3>
          <div className="mt-4 space-y-3">
            <Bar label="You" value={d.human_confidence} color="var(--color-human)" />
            <Bar label="AI" value={d.ai_confidence ?? 0} color="var(--color-ai)" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild variant="outline"><Link to="/dashboard">Dashboard</Link></Button>
          <Button asChild className="shadow-glow"><Link to="/test">Next round <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </main>
    </div>
  );
}

function AnswerCard({
  who, color, icon: Icon, answer, confidence, reasoning, correct,
}: { who: string; color: "human" | "ai"; icon: React.ComponentType<{ className?: string }>; answer: string; confidence: number; reasoning: string | null; correct: boolean | null }) {
  const colorVar = color === "human" ? "var(--color-human)" : "var(--color-ai)";
  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: `color-mix(in oklab, ${colorVar} 30%, var(--color-border))` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold" style={{ color: colorVar }}>
          <Icon className="h-4 w-4" /> {who}
        </div>
        {correct === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : correct ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"><Check className="h-3 w-3" /> Correct</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive"><X className="h-3 w-3" /> Wrong</span>
        )}
      </div>
      <div className="mt-3 text-lg font-medium">{answer}</div>
      <div className="mt-1 text-sm text-muted-foreground">Confidence: {confidence}%</div>
      {reasoning && <p className="mt-3 text-sm text-muted-foreground">{reasoning}</p>}
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="font-mono">{value}%</span></div>
      <div className="h-2.5 rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
