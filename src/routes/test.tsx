import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getAiDecision } from "@/server/ai.functions";

export const Route = createFileRoute("/test")({
  head: () => ({ meta: [{ title: "Decision Test — Mind vs Machine" }] }),
  component: TestPage,
});

interface Question {
  id: string;
  question_text: string;
  type: string;
  options: string[];
  correct_answer: string;
}

function TestPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(70);
  const [reasoning, setReasoning] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const loadQuestion = async () => {
    setPicked(null);
    setReasoning("");
    setConfidence(70);
    const { data, error } = await supabase.from("questions").select("*").limit(50);
    if (error || !data?.length) {
      toast.error("Failed to load questions");
      return;
    }
    const q = data[Math.floor(Math.random() * data.length)];
    setQuestion({ ...q, options: q.options as string[] });
    startRef.current = Date.now();
    setElapsed(0);
  };

  useEffect(() => {
    if (user) loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const i = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    return () => clearInterval(i);
  }, [question?.id]);

  const submit = async () => {
    if (!question || !picked || !user) return;
    setSubmitting(true);
    const timeTaken = Date.now() - startRef.current;
    try {
      const ai = await getAiDecision({
        data: {
          question: question.question_text,
          options: question.options,
          type: question.type,
        },
      });
      const humanCorrect = picked === question.correct_answer;
      const aiCorrect = ai.answer ? ai.answer === question.correct_answer : null;
      const agreement = ai.answer ? ai.answer === picked : null;
      let result: string;
      if (aiCorrect === null) result = "human";
      else if (humanCorrect && !aiCorrect) result = "human";
      else if (!humanCorrect && aiCorrect) result = "ai";
      else if (humanCorrect && aiCorrect) result = (ai.confidence ?? 0) > confidence ? "ai" : "human";
      else result = "tie";

      const { data: row, error } = await supabase
        .from("decisions")
        .insert({
          user_id: user.id,
          question_id: question.id,
          human_answer: picked,
          human_confidence: confidence,
          human_reasoning: reasoning || null,
          ai_answer: ai.answer,
          ai_confidence: ai.confidence,
          ai_reasoning: ai.reasoning,
          correct_answer: question.correct_answer,
          human_correct: humanCorrect,
          ai_correct: aiCorrect,
          time_taken_ms: timeTaken,
          agreement,
          result,
        })
        .select("id")
        .single();
      if (error || !row) {
        toast.error("Failed to save");
        setSubmitting(false);
        return;
      }
      navigate({ to: "/results/$id", params: { id: row.id } });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  };

  const seconds = useMemo(() => (elapsed / 1000).toFixed(1), [elapsed]);

  if (loading || !user || !question) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-foreground">
            {question.type}
          </span>
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-mono tabular-nums">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {seconds}s
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-glow">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-[var(--color-human)]" /> Your turn
          </div>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{question.question_text}</h1>

          <div className="mt-6 grid gap-3">
            {question.options.map((opt) => {
              const active = picked === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setPicked(opt)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/40 hover:bg-accent/30"
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your confidence</span>
              <span className="font-mono font-semibold">{confidence}%</span>
            </div>
            <Slider value={[confidence]} onValueChange={(v) => setConfidence(v[0])} min={0} max={100} step={1} />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm text-muted-foreground">Your reasoning (optional)</label>
            <Textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} maxLength={500} placeholder="Why this choice?" />
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={submit} disabled={!picked || submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Asking the AI…</> : "Submit & compare"}
          </Button>
        </div>
      </main>
    </div>
  );
}
