import '../index.css'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useSession } from '../context/SessionContext'

export default function Login() {
  const { session } = useSession()

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)
  }
  else {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span>Logged in!</span>
          <button onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </div>
    )
  }
}