import { supabase } from "../supabaseClient";
import { toast } from "sonner";

export default function Login() {
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left — branding (always dark) */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-12 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-20">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-white text-[15px] font-semibold tracking-tight">EchoEval</span>
          </div>

          <h1 className="text-4xl font-semibold text-white leading-tight max-w-md mb-5">
            AI-powered voice<br />evaluation platform
          </h1>
          <p className="text-zinc-400 text-lg max-w-sm leading-relaxed">
            Practice professional conversations and get real-time AI feedback across leadership roles.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Real-time", sublabel: "AI Analysis" },
              { label: "Multiple", sublabel: "Roles" },
              { label: "Track", sublabel: "Progress" },
            ].map((item) => (
              <div key={item.label} className="border border-zinc-800 rounded-lg p-4">
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-zinc-500 text-xs">{item.sublabel}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-600 text-xs">&copy; 2025 EchoEval. All rights reserved.</p>
        </div>
      </div>

      {/* Right — login form (themed) */}
      <div className="flex-1 lg:max-w-lg flex items-center justify-center p-6 lg:p-12 bg-card lg:rounded-l-3xl">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-fg text-[15px] font-semibold tracking-tight">EchoEval</span>
          </div>

          <h2 className="text-2xl font-semibold text-fg mb-2">
            Welcome back
          </h2>
          <p className="text-fg-muted text-sm mb-8">
            Sign in to continue to your dashboard
          </p>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-card border border-edge rounded-lg py-3 px-4 text-sm font-medium text-fg hover:bg-card-hover hover:border-edge-hover transition-colors"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt=""
            />
            Continue with Google
          </button>

          <div className="mt-8 pt-6 border-t border-edge-subtle">
            <p className="text-xs text-fg-faint leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
