import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, User, ArrowRight } from "lucide-react";

const styleColors = {
  boulder: "bg-amber-500/20 text-amber-400",
  sport: "bg-violet-500/20 text-violet-400",
  trad: "bg-teal-500/20 text-teal-400",
};

export default function RouteCard({ route }) {
  return (
    <Link
      to={createPageUrl("ViewRoute") + `?id=${route.id}`}
      className="block group"
    >
      <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 transition-all duration-200 group-hover:border-zinc-600 group-hover:shadow-xl group-hover:shadow-black/20">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={route.wall_image_url}
            alt={route.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg leading-tight">{route.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {route.grade && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {route.grade}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styleColors[route.style] || styleColors.boulder}`}>
                  {route.style || "boulder"}
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2 text-zinc-500 text-xs">
          <User className="w-3 h-3" />
          <span>{route.setter_name || "Unknown setter"}</span>
          <span className="ml-auto flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {route.holds?.length || 0} holds
          </span>
        </div>
      </div>
    </Link>
  );
}