import { Link, useNavigate } from "@tanstack/react-router";
import { Brain, LogOut, BarChart3, Sparkles, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">Mind vs Machine</span>
        </Link>
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard"><Sparkles className="mr-1 h-4 w-4" />Play</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/analytics"><BarChart3 className="mr-1 h-4 w-4" />Analytics</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
