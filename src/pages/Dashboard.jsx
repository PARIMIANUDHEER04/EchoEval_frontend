import { Mic, BarChart3, Clock, Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    /* flex-1 ensures it takes up the remaining space next to your existing sidebar */
    <div className="flex-1 min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Welcome back, Champ 🚀
          </h1>
          <p className="text-slate-500 text-lg">
            Ready for your daily communication workout?
          </p>
        </header>

        {/* Hero Coaching Card - High Contrast Version */}
        <div className="relative group overflow-hidden bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-blue-100/40 p-10 md:p-16 mb-10 transition-all hover:shadow-2xl hover:border-blue-200">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black mb-8 uppercase tracking-[0.2em] border border-blue-100">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              AI Session Ready
            </div>

            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Master Your <span className="text-blue-600">Conversations</span>
            </h2>
            <p className="text-slate-500 mb-10 max-w-lg text-lg leading-relaxed">
              Get real-time feedback on your confidence, filler words, and tone of voice using our advanced AI coach.
            </p>

            <button
              onClick={() => navigate("/session")}
              className="group bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-blue-600 active:scale-95 transition-all shadow-lg flex items-center gap-3"
            >
              <Mic size={24} className="group-hover:animate-bounce" />
              Start Voice Session
              <ArrowRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Subtle decoration to break the "white-on-white" look */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Clock className="text-blue-600" size={24} />} 
            label="Practice Time" 
            value="4.2 hrs" 
            color="bg-blue-50"
          />
          <StatCard 
            icon={<Trophy className="text-amber-500" size={24} />} 
            label="Current Streak" 
            value="12 Days" 
            color="bg-amber-50"
          />
          <StatCard 
            icon={<BarChart3 className="text-emerald-500" size={24} />} 
            label="Avg Score" 
            value="92/100" 
            color="bg-emerald-50"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}