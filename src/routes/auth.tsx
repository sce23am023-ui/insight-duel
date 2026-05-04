import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Mind vs Machine" },
      { name: "description", content: "Sign in or create your account to start the AI vs Human decision benchmark." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().email().max(255);
const pwSchema = z.string().min(6).max(72);
const nameSchema = z.string().trim().min(1).max(80);

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const signUp = async () => {
    try {
      nameSchema.parse(name);
      emailSchema.parse(email);
      pwSchema.parse(password);
    } catch {
      toast.error("Please enter a valid name, email, and 6+ char password.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created!");
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero/5 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-hero shadow-glow">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Mind vs Machine</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to start benchmarking</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-glow">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-3 pt-4">
              <div><Label htmlFor="e1">Email</Label><Input id="e1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="p1">Password</Label><Input id="p1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={signIn} disabled={busy}>Sign in</Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-3 pt-4">
              <div><Label htmlFor="n2">Name</Label><Input id="n2" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label htmlFor="e2">Email</Label><Input id="e2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="p2">Password</Label><Input id="p2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button className="w-full" onClick={signUp} disabled={busy}>Create account</Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
