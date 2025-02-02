import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../../database.types'
import { Link } from 'react-router-dom'

export default function FundableOrgsList() {
  const [orgs, setOrgs] = useState<Tables<'fundable_orgs'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const { data, error } = await supabase
          .from('fundable_orgs')
          .select('*')
          .order('name')

        if (error) {
          throw error
        }

        setOrgs(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred while fetching organizations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrgs()
  }, [])

  if (isLoading) {
    return <div>Loading organizations...</div>
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fundable Organizations</h1>
      {orgs.length === 0 ? (
        <p>No organizations found.</p>
      ) : (
        <ul className="space-y-2">
          {orgs.map((org) => (
            <li key={org.id}>
              <Link
                to={`/fundableorgs/${org.id}`}
                className="block p-3 border rounded hover:bg-gray-50"
              >
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-gray-500">
                  Added: {new Date(org.created_at!).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}