import { useQuery } from "@tanstack/react-query";
import { useCredentialGetter } from "./useCredentialGetter";
import { getClient } from "@/api/AxiosClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface UserInfo {
  first_name: string;
  last_name: string;
  email: string;
}

export function useUserInfo() {
  const credentialGetter = useCredentialGetter();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useQuery<UserInfo>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const apiKey = localStorage.getItem("apiKey");
      if (!apiKey) {
        navigate("/login");
        throw new Error("No API key found");
      }

      try {
        const client = await getClient(credentialGetter);
        const response = await client.get("/auth/me");
        return {
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          email: response.data.email
        };
      } catch (error) {
        localStorage.removeItem("apiKey");
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        navigate("/login");
        throw error;
      }
    },
    enabled: !!localStorage.getItem("apiKey"),
  });
} 