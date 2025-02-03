import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../../database.types'
import MarginalUtilityEditor from './MarginalUtilityEditor'
import type { UsdUtilonPoint } from './MarginalUtilityEditor'

export default function FundableOrgDetails() {
  const { orgId } = useParams()
  const [org, setOrg] = useState<Tables<'fundable_orgs'> | null>(null)
  const [estimateId, setEstimateId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [points, setPoints] = useState<UsdUtilonPoint[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch org details
        const { data: orgData, error: orgError } = await supabase
          .from('fundable_orgs')
          .select('*')
          .eq('id', orgId)
          .single()

        if (orgError) throw orgError
        setOrg(orgData)

        // Fetch estimate and its points for current user and org
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: estimateData, error: estimateError } = await supabase
          .from('marginal_utility_estimates')
          .select(`
            id,
            utility_graph_points (
              id,
              usd_amount,
              utilons
            )
          `)
          .eq('org_id', orgId)
          .eq('estimator_id', user.user.id)
          .single()

        if (estimateError) {
          throw estimateError
        }

        setEstimateId(estimateData?.id ?? null)
        if (estimateData?.utility_graph_points) {
          setPoints(estimateData.utility_graph_points)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for points
    const channel = supabase
      .channel('utility_graph_points_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utility_graph_points',
          filter: `marginal_utility_estimate_id=eq.${estimateId}`,
        },
        async (payload) => {
          // Refetch all points when any change occurs
          if (!estimateId) return
          
          const { data, error } = await supabase
            .from('utility_graph_points')
            .select('id, usd_amount, utilons')
            .eq('marginal_utility_estimate_id', estimateId)
          
          if (!error && data) {
            setPoints(data)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, estimateId])

  const handleCreateEstimate = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('marginal_utility_estimates')
        .insert({
          org_id: Number(orgId),
          estimator_id: user.user.id,
        })
        .select('id')
        .single()

      if (error) throw error
      setEstimateId(data.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create estimate')
    }
  }

  const handleSavePoints = async (newPoints: UsdUtilonPoint[]) => {
    if (!estimateId) return

    try {
      // Start a transaction using RPC if available, or just sequential operations
      const { error: deleteError } = await supabase
        .from('utility_graph_points')
        .delete()
        .eq('marginal_utility_estimate_id', estimateId)

      if (deleteError) throw deleteError

      const { error: insertError } = await supabase
        .from('utility_graph_points')
        .insert(
          newPoints.map(point => ({
            marginal_utility_estimate_id: estimateId,
            usd_amount: point.usd_amount,
            utilons: point.utilons
          }))
        )

      if (insertError) throw insertError
      // No need to setPoints here as the subscription will handle it
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save points')
    }
  }

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
        {estimateId ? (
          <MarginalUtilityEditor 
            initialPoints={points}
            onSave={handleSavePoints}
          />
        ) : (
          <button
            onClick={handleCreateEstimate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Estimate
          </button>
        )}
      </div>
    </div>
  )
} 