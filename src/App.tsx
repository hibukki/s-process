import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { SessionContext } from './context/SessionContext'
import { ThemeContext } from './context/ThemeContext'
import FundableOrgsList from './components/FundableOrgsList'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FundableOrgDetails from './components/FundableOrgDetails'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);

    // Listen for changes in system preference
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    darkModeMediaQuery.addEventListener('change', handleChange);

    // Set initial class
    if (darkModeMediaQuery.matches) {
      document.documentElement.classList.add('dark');
    }

    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <SessionContext.Provider value={{ session, setSession }}>
        <BrowserRouter>
          <Login />
          {session && (
            <Routes>
              <Route path="/" element={<FundableOrgsList />} />
              <Route path="/fundableorgs/:orgId" element={<FundableOrgDetails />} />
            </Routes>
          )}
        </BrowserRouter>
      </SessionContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
