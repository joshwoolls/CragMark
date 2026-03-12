import React, { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const SiteIdContext = createContext();

export const SiteIdProvider = ({ children }) => {
  const { user, isLoadingAuth } = useAuth();

  // Site ID comes from the authenticated user's JWT (via AuthContext)
  const siteId = user?.site_id || null;
  const isLoaded = !isLoadingAuth;

  return (
    <SiteIdContext.Provider value={{ siteId, isLoaded }}>
      {children}
    </SiteIdContext.Provider>
  );
};

export const useSiteId = () => {
  const context = useContext(SiteIdContext);
  if (!context) {
    throw new Error("useSiteId must be used within SiteIdProvider");
  }
  return context;
};
