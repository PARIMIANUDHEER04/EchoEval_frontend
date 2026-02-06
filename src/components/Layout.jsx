import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "./Sidebar";

export default function Layout({ children, onRefresh }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  return (
    <div className="min-h-screen bg-page flex">
      <Sidebar user={user} onRefresh={onRefresh} />
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
