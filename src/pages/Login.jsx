import { Sparkles, Mic, TrendingUp, Award, Zap } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) {
      console.error("Login error:", error);
      alert("Failed to login. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="text-white text-center lg:text-left">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <Zap className="text-yellow-400" size={20} />
            <span className="text-sm font-bold">Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Master Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Communication Skills
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Get real-time AI feedback on your voice evaluations across multiple professional roles
          </p>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mic className="text-blue-300" size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">AI-Powered Voice Analysis</p>
                <p className="text-sm text-blue-200">Real-time evaluation and scoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-purple-300" size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Track Your Progress</p>
                <p className="text-sm text-purple-200">Monitor improvement over time</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award className="text-emerald-300" size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Multiple Role Scenarios</p>
                <p className="text-sm text-emerald-200">Practice different leadership situations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[32px] shadow-2xl border border-white/20">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[24px] shadow-xl shadow-blue-500/50">
                <Sparkles className="text-white" size={40} />
              </div>
            </div>
            
            <h2 className="text-3xl font-black text-center text-slate-900 mb-3 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-center text-slate-600 mb-8 leading-relaxed">
              Sign in to continue your journey to
              <span className="font-bold text-slate-900"> communication excellence</span>
            </p>

            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 rounded-2xl py-4 font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-6 group-hover:scale-110 transition-transform"
                alt="Google"
              />
              Continue with Google
            </button>
            
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-xs text-slate-500 leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Your data is encrypted and secure.
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-6 text-white/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}