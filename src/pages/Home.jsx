import React, { useState } from "react";
import { base44 } from "@/api/base44client.js";
import { useSiteId } from "@/lib/SiteIdContext";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Mountain, Loader2, LogOut, Settings } from "lucide-react";
import RouteCard from "@/components/routes/RouteCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { siteId, clearSiteId } = useSiteId();

  const { data: routes = [], isLoading, error } = useQuery({
    queryKey: ["routes", siteId],
    queryFn: () => base44.entities.Route.filter({ published: true, site_id: siteId }, "-created_date", 50),
    enabled: !!siteId,
  });

  console.log("Home page - siteId:", siteId, "routes:", routes, "error:", error);

  const filtered = routes.filter((r) =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.grade?.toLowerCase().includes(search.toLowerCase()) ||
    r.setter_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangeSite = () => {
    clearSiteId();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="w-6 h-6 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">RouteSet</span>
              <span className="text-xs text-zinc-500">{siteId}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={createPageUrl("CreateRoute")}
              className="bg-amber-500 hover:bg-amber-400 text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
            </Link>
            <button
              onClick={handleChangeSite}
              className="text-zinc-400 hover:text-zinc-300 p-2.5 transition-colors"
              title="Change site"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes, grades, setters..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Routes */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {search ? (
              <>
                <Mountain className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">
                  No routes match your search
                </p>
              </>
            ) : (
              <>
                <Mountain className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-300 text-sm font-medium mb-2">
                  No routes yet for <span className="text-amber-500">{siteId}</span>
                </p>
                <p className="text-zinc-500 text-xs mb-6">
                  Create your first route or switch to a different site
                </p>
                
                <div className="flex flex-col gap-3">
                  <Link
                    to={createPageUrl("CreateRoute")}
                    className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                  >
                    <Plus className="w-5 h-5" />
                    Create your first route
                  </Link>
                  
                  <button
                    onClick={() => navigate("/Settings")}
                    className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Wrong site? Change it in Settings
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {filtered.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}