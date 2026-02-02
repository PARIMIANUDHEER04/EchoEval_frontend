import { Sparkles } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-200 via-slate-100 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg p-12 rounded-[40px] shadow-2xl border border-white/50">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <Sparkles className="text-white" size={32} />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-center text-slate-900 mb-3 tracking-tight">
          AI Voice Coach
        </h1>
        <p className="text-center text-slate-500 mb-10 leading-relaxed">
          Master communication with <br /> 
          <span className="font-semibold text-slate-700">real-time AI feedback</span>
        </p>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-2xl py-4 font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all duration-200"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-6"
            alt="Google"
          />
          Continue with Google
        </button>
        
        <p className="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest font-medium">
          Secure Personal Coaching
        </p>
      </div>
    </div>
  );
}