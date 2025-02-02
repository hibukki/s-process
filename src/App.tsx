import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { SessionContext } from './context/SessionContext'
import FundableOrgsList from './components/FundableOrgsList'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FundableOrgDetails from './components/FundableOrgDetails'

function App() {
  const [session, setSession] = useState<Session | null>(null)

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
  )
}

export default App
