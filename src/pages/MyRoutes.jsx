import React from "react";
import { base44 } from "@/api/base44client";
import { useSiteId } from "@/lib/SiteIdContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Mountain, Loader2, Globe, Lock } from "lucide-react";
import RouteCard from "@/components/routes/RouteCard";

export default function MyRoutes() {
  const { siteId } = useSiteId();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["my-routes", user?.email, siteId],
    queryFn: () => base44.entities.Route.filter({ created_by: user.email, site_id: siteId }, "-created_date", 50),
    enabled: !!user?.email && !!siteId,
  });

  const drafts = routes.filter((r) => !r.published);
  const published = routes.filter((r) => r.published);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="text-zinc-400 hover:text-white p-1 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold">My Routes</span>
          <Link
            to={createPageUrl("CreateRoute")}
            className="bg-amber-500 hover:bg-amber-400 text-white p-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-20">
            <Mountain className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">You haven't set any routes yet</p>
            <Link
              to={createPageUrl("CreateRoute")}
              className="inline-flex items-center gap-2 mt-4 text-amber-500 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Create your first route
            </Link>
          </div>
        ) : (
          <>
            {drafts.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <h2 className="text-sm font-medium text-zinc-400">Drafts ({drafts.length})</h2>
                </div>
                <div className="space-y-4">
                  {drafts.map((route) => (
                    <RouteCard key={route.id} route={route} />
                  ))}
                </div>
              </div>
            )}
            {published.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  <h2 className="text-sm font-medium text-zinc-400">Published ({published.length})</h2>
                </div>
                <div className="space-y-4">
                  {published.map((route) => (
                    <RouteCard key={route.id} route={route} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}