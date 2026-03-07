import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Share2, User, MapPin, Mountain, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import WallCanvas from "@/components/routes/WallCanvas";
import { toast } from "sonner";

const styleColors = {
  boulder: "bg-amber-500/20 text-amber-400",
  sport: "bg-violet-500/20 text-violet-400",
  trad: "bg-teal-500/20 text-teal-400",
};

export default function ViewRoute() {
  const urlParams = new URLSearchParams(window.location.search);
  const routeId = urlParams.get("id");

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => base44.entities.Route.filter({ id: routeId }),
    select: (data) => data?.[0],
    enabled: !!routeId,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: route.name, text: `Check out this climbing route: ${route.name}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4 px-4">
        <Mountain className="w-12 h-12 text-zinc-700" />
        <p className="text-zinc-500">Route not found</p>
        <Link to={createPageUrl("Home")} className="text-amber-500 text-sm font-medium">
          Back to routes
        </Link>
      </div>
    );
  }

  const holdCounts = {
    start: route.holds?.filter((h) => h.type === "start").length || 0,
    middle: route.holds?.filter((h) => h.type === "middle").length || 0,
    finish: route.holds?.filter((h) => h.type === "finish").length || 0,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={createPageUrl("Home")}
            className="text-zinc-400 hover:text-white p-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold">{route.name}</span>
          <button
            onClick={handleShare}
            className="text-zinc-400 hover:text-white p-1 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Wall Image with Holds */}
        <div className="mt-4">
          <WallCanvas imageUrl={route.wall_image_url} holds={route.holds || []} />
        </div>

        {/* Route Info */}
        <div className="mt-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{route.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {route.grade && (
                  <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {route.grade}
                  </span>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styleColors[route.style] || styleColors.boulder}`}>
                  {route.style || "boulder"}
                </span>
              </div>
            </div>
          </div>

          {/* Hold Legend */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-400">{holdCounts.start} Start</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <span className="text-xs text-zinc-400">{holdCounts.middle} Middle</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-zinc-400">{holdCounts.finish} Finish</span>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
            {route.setter_name && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">Set by <span className="text-white font-medium">{route.setter_name}</span></span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">{route.holds?.length || 0} holds total</span>
            </div>
            {route.created_date && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">{format(new Date(route.created_date), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {route.description && (
            <div className="bg-zinc-900 rounded-2xl p-4">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Beta</h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{route.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}