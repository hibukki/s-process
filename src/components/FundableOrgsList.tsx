import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Tables } from "../../database.types";
import { Link } from "react-router-dom";
import MarginalUtilityEditor from "./MarginalUtilityEditor";
import type { UsdUtilonPoint } from "./MarginalUtilityEditor";

interface OrgWithEstimate extends Tables<"fundable_orgs"> {
  utilityPoints?: UsdUtilonPoint[];
}

export default function FundableOrgsList() {
  const [orgs, setOrgs] = useState<OrgWithEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("Not authenticated");

        const { data, error } = await supabase
          .from("fundable_orgs")
          .select("*")
          .order("name");

        if (error) {
          throw error;
        }

        // Fetch utility points for each org
        const orgsWithEstimates = await Promise.all(
          data.map(async (org) => {
            const { data: estimateData } = await supabase
              .from("marginal_utility_estimates")
              .select(
                `
                id,
                utility_graph_points (
                  id,
                  usd_amount,
                  marginal_utility
                )
              `
              )
              .eq("org_id", org.id)
              .eq("estimator_id", user.user!.id)
              .single();

            return {
              ...org,
              utilityPoints: estimateData?.utility_graph_points || [],
            };
          })
        );

        setOrgs(orgsWithEstimates);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "An error occurred while fetching organizations"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrgs();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("fundable_orgs")
        .insert([{ name: newOrgName.trim() }]);

      if (error) throw error;

      // Refresh the list
      const { data, error: fetchError } = await supabase
        .from("fundable_orgs")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;

      setOrgs(data);
      setNewOrgName(""); // Clear the input
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "An error occurred while adding the organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
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
                className="block p-3 border rounded hover:bg-gray-50 flex items-center"
              >
                <div className="flex-grow">
                  <p className="font-medium">{org.name}</p>
                </div>
                <div className="ml-4">
                  <MarginalUtilityEditor
                    initialPoints={org.utilityPoints || []}
                    mini={true}
                  />
                </div>
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
              {isSubmitting ? "Adding..." : "Add Organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
