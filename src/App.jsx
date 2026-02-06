import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VoiceSession from "./pages/VoiceSession";
import { useAuth } from "./hooks/useAuth";
import { ThemeProvider, useTheme } from "./hooks/useTheme";

function AppShell() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  return (
    <>
      <Toaster position="top-right" theme={theme} toastOptions={{ style: { fontSize: "13px" } }} />
      {loading ? (
        <div className="min-h-screen bg-page flex items-center justify-center">
          <div className="flex items-center gap-3 text-fg-faint">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      ) : !user ? (
        <Routes><Route path="*" element={<Login />} /></Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session" element={<VoiceSession />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  );
}
