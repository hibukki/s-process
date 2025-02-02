import '../index.css'
import { useState, useEffect } from 'react'
import { createClient, Session } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient('https://mhhndkyzhftujcsrhffm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG5ka3l6aGZ0dWpjc3JoZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MzIxMzUsImV4cCI6MjA1NDEwODEzNX0.sC8JPVlLEQyp5Gk1pI2YXSAsStDY8a-BylA4IjyPnxE')

export default function Login() {
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

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)
  }
  else {
    return (<div>Logged in!</div>)
  }
}