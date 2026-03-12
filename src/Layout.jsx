import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Plus, User, Settings } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';

const NAV_ITEMS = [
  { name: "Home", icon: Mountain, label: "Explore" },
  { name: "CreateRoute", icon: Plus, label: "Set Route", accent: true },
  { name: "MyRoutes", icon: User, label: "My Routes" },
  { name: "Settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const hideNav = currentPageName === "CreateRoute" || currentPageName === "ViewRoute";
  const { logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950">
      <style>{`
        :root {
          --background: 0 0% 4%;
          --foreground: 0 0% 98%;
        }
        body {
          background-color: #09090b;
          overscroll-behavior: none;
        }
      `}</style>

      {children}

      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pb-safe">
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center justify-around">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPageName === item.name;
                const Icon = item.icon;

                if (item.accent) {
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.name)}
                      className="bg-amber-500 hover:bg-amber-400 text-white p-3 rounded-2xl -mt-5 shadow-lg shadow-amber-500/30 transition-colors"
                    >
                      <Icon className="w-6 h-6" />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}