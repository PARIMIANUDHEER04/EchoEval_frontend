import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTheme } from "../hooks/useTheme";
import { Home, Mic, LogOut, RefreshCw, Sun, Moon } from "lucide-react";

export default function Sidebar({ user, onRefresh }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || "User";

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Mic, label: "Session", path: "/session" },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[var(--sidebar-width)] fixed h-screen bg-card border-r border-edge z-40">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-edge-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-[15px] font-semibold text-fg tracking-tight">EchoEval</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-card-hover text-fg"
                      : "text-fg-muted hover:text-fg hover:bg-card-hover"
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-card-hover transition-colors mb-1">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-7 h-7 bg-card-hover rounded-full flex items-center justify-center text-xs font-medium text-fg-muted">
                {userName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-fg truncate leading-tight">{userName}</p>
              <p className="text-[11px] text-fg-faint truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-1 px-1">
            <button onClick={toggleTheme} className="flex-1 p-1.5 rounded-md hover:bg-card-hover transition-colors flex items-center justify-center" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
              {theme === 'dark' ? <Sun size={14} className="text-fg-faint" /> : <Moon size={14} className="text-fg-faint" />}
            </button>
            {onRefresh && (
              <button onClick={onRefresh} className="flex-1 p-1.5 rounded-md hover:bg-card-hover transition-colors flex items-center justify-center" title="Refresh">
                <RefreshCw size={14} className="text-fg-faint" />
              </button>
            )}
            <button onClick={handleLogout} className="flex-1 p-1.5 rounded-md hover:bg-card-hover transition-colors flex items-center justify-center" title="Sign out">
              <LogOut size={14} className="text-fg-faint" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-edge">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  active ? "text-fg" : "text-fg-faint"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <button onClick={toggleTheme} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-fg-faint">
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
            <span className="text-[10px] font-medium">Theme</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-fg-faint">
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Sign out</span>
          </button>
        </div>
      </nav>

      {/* Width spacer */}
      <div className="hidden md:block flex-shrink-0 w-[var(--sidebar-width)]" />
    </>
  );
}
