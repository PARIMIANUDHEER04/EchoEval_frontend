import { LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col">
      <div className="flex items-center gap-3 mb-10 text-blue-600">
        <Sparkles />
        <span className="font-black text-xl text-slate-900">COACH.AI</span>
      </div>

      <nav className="flex-1 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold">
          <LayoutDashboard size={20} />
          Dashboard
        </div>
      </nav>

      <button
        onClick={() => supabase.auth.signOut()}
        className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-medium"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}
