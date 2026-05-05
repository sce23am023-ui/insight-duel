import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Mind vs Machine" },
      { name: "description", content: "Benchmark your decision-making against AI on logical, ethical, and scenario-based questions. Track accuracy, speed, confidence, and bias." },
      { property: "og:title", content: "Mind vs Machine" },
      { property: "og:description", content: "Benchmark your decision-making against AI on logical, ethical, and scenario-based questions. Track accuracy, speed, confidence, and bias." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Mind vs Machine" },
      { name: "twitter:description", content: "Benchmark your decision-making against AI on logical, ethical, and scenario-based questions. Track accuracy, speed, confidence, and bias." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/499af945-ca12-40b1-a658-08222d3ac4f8/id-preview-d424c24e--d2baa6e0-ab88-4ce4-960c-27a501be06b2.lovable.app-1777956999973.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/499af945-ca12-40b1-a658-08222d3ac4f8/id-preview-d424c24e--d2baa6e0-ab88-4ce4-960c-27a501be06b2.lovable.app-1777956999973.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <a href="/" className="mt-6 inline-block text-primary underline">Go home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
