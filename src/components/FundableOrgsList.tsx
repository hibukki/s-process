import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../../database.types'
import { Link } from 'react-router-dom'

export default function FundableOrgsList() {
  const [orgs, setOrgs] = useState<Tables<'fundable_orgs'>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newOrgName, setNewOrgName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('fundable_orgs')
        .insert([{ name: newOrgName.trim() }])

      if (error) throw error

      // Refresh the list
      const { data, error: fetchError } = await supabase
        .from('fundable_orgs')
        .select('*')
        .order('name')
      
      if (fetchError) throw fetchError
      
      setOrgs(data)
      setNewOrgName('') // Clear the input
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred while adding the organization')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <ul className="space-y-2 mb-8">
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

      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Add New Organization</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="text"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newOrgName.trim()}
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors duration-200"
            >
              {isSubmitting ? 'Adding...' : 'Add Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}