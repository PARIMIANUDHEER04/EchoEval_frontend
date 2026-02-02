import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VoiceSession from "./pages/VoiceSession";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/session" element={<VoiceSession />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
