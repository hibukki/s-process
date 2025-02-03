import { useState, useEffect } from "react";
import "./App.css";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { SessionContext } from "./context/SessionContext";
import { ThemeContext } from "./context/ThemeContext";
import FundableOrgsList from "./components/FundableOrgsList";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FundableOrgDetails from "./components/FundableOrgDetails";
import Simulation from "./components/Simulation";
import NavBar from "./components/NavBar";
import Login from "./components/Login";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    setIsDarkMode(darkModeMediaQuery.matches);

    // Listen for changes in system preference
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    darkModeMediaQuery.addEventListener("change", handleChange);

    // Set initial class
    if (darkModeMediaQuery.matches) {
      document.documentElement.classList.add("dark");
    }

    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <SessionContext.Provider value={{ session, setSession }}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {session ? (
              <>
                <NavBar />
                <div className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<FundableOrgsList />} />
                    <Route
                      path="/fundableorgs/:orgId"
                      element={<FundableOrgDetails />}
                    />
                    <Route path="/simulation" element={<Simulation />} />
                  </Routes>
                </div>
              </>
            ) : (
              <Login />
            )}
            <div className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-4">What is this?</h2>

              <p className="mb-4">
                A draft of the "s-process", as presented in this{" "}
                <a
                  href="https://www.youtube.com/watch?v=jWivz6KidkI"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  YouTube video
                </a>
                .
              </p>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">
                  Currently includes:
                </h3>
                <ul className="list-disc pl-6">
                  <li>
                    Estimators can log in and add orgs (visible to all
                    estimators)
                  </li>
                  <li>
                    "Draw" a graph of marginal utility by placing points that
                    will be connected with a line
                  </li>
                  <li>
                    Run a simulation to aggregate preferences with configurable
                    parameters like "available budget"
                  </li>
                  <li>(some tests for the simulation logic)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Doesn't include:</h3>
                <ul className="list-disc pl-6">
                  <li>
                    DB Authorization (if you enter data, it will be visible to
                    all users)
                  </li>
                  <li>Multiple funders</li>
                  <li>
                    Funders setting a marginal utility graph for an estimator
                  </li>
                  <li>Everything else...</li>
                </ul>
              </div>

              <p className="mb-4 italic">
                Disclaimer: I don't pretend to understand the s-process
                perfectly, I saw one YouTube video once, this is a side project.
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                P.S. Used Supabase for the first time, it's nice.
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <a
                  href="https://github.com/hibukki/s-process"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  GitHub Repository
                </a>
              </p>
            </div>
          </div>
        </BrowserRouter>
      </SessionContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
