import { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

type SessionContextType = {
  session: Session | null
  setSession: (session: Session | null) => void
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
} 