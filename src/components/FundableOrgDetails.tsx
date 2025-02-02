import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../../database.types'

export default function FundableOrgDetails() {
  const { orgId } = useParams()
  const [org, setOrg] = useState<Tables<'fundable_orgs'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      try {
        const { data, error } = await supabase
          .from('fundable_orgs')
          .select('*')
          .eq('id', orgId)
          .single()

        if (error) {
          throw error
        }

        setOrg(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred while fetching the organization')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrg()
  }, [orgId])

  if (isLoading) {
    return <div>Loading organization details...</div>
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  if (!org) {
    return <div>Organization not found</div>
  }

  return (
    <div className="p-4">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to Organizations
      </Link>
      <h1 className="text-2xl font-bold mb-4">{org.name}</h1>
      <div className="space-y-4">
        <p className="text-gray-600">
          Added: {new Date(org.created_at!).toLocaleDateString()}
        </p>
        {/* Add more organization details here as needed */}
      </div>
    </div>
  )
} 