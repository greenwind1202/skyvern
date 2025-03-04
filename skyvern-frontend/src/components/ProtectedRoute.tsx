import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { getClient } from "@/api/AxiosClient";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { CredentialGetterContext } from "@/store/CredentialGetterContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const credentialGetter = useCredentialGetter();

  useEffect(() => {
    const checkAuth = async () => {
      const apiKey = localStorage.getItem("apiKey");

      if (!apiKey) {
        setIsLoading(false);
        return;
      }

      try {
        const client = await getClient(credentialGetter);
        await client.get("/organizations/");
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("apiKey");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [toast, credentialGetter]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <CredentialGetterContext.Provider value={credentialGetter}>
      {children}
    </CredentialGetterContext.Provider>
  );
}
