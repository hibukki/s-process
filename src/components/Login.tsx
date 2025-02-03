import "../index.css";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";
import { useState } from "react";

export default function Login() {
  const { session } = useSession();
  const [showAuth, setShowAuth] = useState(false);

  if (!session) {
    return (
      <div className="relative">
        {!showAuth ? (
          <button
            onClick={() => setShowAuth(true)}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Sign In
          </button>
        ) : (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-300">
        Logged in as {session.user.email}
      </span>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
      >
        Sign Out
      </button>
    </div>
  );
}
