import React, { useState } from "react";
import { useSiteId } from "@/lib/SiteIdContext";
import { useNavigate } from "react-router-dom";
import { Mountain } from "lucide-react";

export default function SiteIdEntry() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const { setSiteId } = useSiteId();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError("Site ID is required");
      return;
    }

    if (trimmed.length < 3) {
      setError("Site ID must be at least 3 characters");
      return;
    }

    setSiteId(trimmed);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mountain className="w-8 h-8 text-amber-500" />
          <span className="text-2xl font-bold tracking-tight">RouteSet</span>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
          <h1 className="text-xl font-bold mb-2">Welcome to the Crag</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Enter your climbing site ID to access and manage routes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="site-id" className="block text-sm font-medium text-zinc-300 mb-2">
                Site ID
              </label>
              <input
                id="site-id"
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g., my-climbing-gym"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
            >
              Enter Site
            </button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-6">
            You'll be able to set and manage climbing routes for this site
          </p>
        </div>
      </div>
    </div>
  );
}
