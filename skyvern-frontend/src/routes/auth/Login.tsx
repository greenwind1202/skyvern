import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getClient, setApiKeyHeader } from "@/api/AxiosClient";
import { useOrganizationStore } from "@/store/OrganizationStore";
import { apiBaseUrl } from "@/util/env";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Define a User type based on the backend schema
interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  modified_at: string;
  organizations: string[];
}

// Define an Organization type
interface OrganizationResponse {
  organization_id: string;
  organization_name: string;
  created_at: string;
  modified_at: string;
  max_retries_per_step: number | null;
  max_steps_per_run: number | null;
  webhook_callback_url: string | null;
}

// Define an API Key type
interface ApiKeyApiResponse {
  token: string;
}

// Define the LoginResponse interface
interface LoginResponse {
  api_key: string;
  token_type: string;
}

export function Login() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { setOrganizations, setSelectedOrganizationId } = useOrganizationStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post<LoginResponse>(
        `${apiBaseUrl}/auth/login`,
        {
          email: data.email,
          password: data.password,
        },
      );

      // Store the API key and set header
      localStorage.setItem("apiKey", response.data.api_key);
      setApiKeyHeader(response.data.api_key);

      // Fetch organizations using React Query's cache
      const organizations = await queryClient.fetchQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
          const client = await getClient(null);
          const response = await client.get<{ organizations: OrganizationResponse[] }>("/organizations/");
          return response.data.organizations;
        },
      });
      
      // Set organizations in store
      setOrganizations(organizations);
      if (organizations.length > 0) {
        setSelectedOrganizationId(organizations[0].organization_id);
      }
      
      // Navigate to workflows page
      navigate("/workflows");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* Background gradient */}
      <div className="absolute inset-0 h-full w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]"></div>
        <div className="absolute inset-0 opacity-30">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 2560 1920"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <g>
              <path
                d="M-119.809 -1055.99L859.027 -684.98C915.435 -663.6 955.626 -624.994 968.519 -579.807L1129.49 -15.6245L1860.47 -241.727C1919.02 -259.836 1985.68 -257.939 2042.09 -236.559L3020.93 134.453C3124.79 173.822 3164.97 266.777 3110.66 342.073L2850.06 703.385C2827.36 734.857 2790.34 759.666 2745.28 773.604L1467.45 1168.86L1748.58 2154.16C1758.67 2189.52 1751.28 2226.32 1727.72 2258.12L1361.75 2752.01L203.258 2312.91C146.85 2291.53 106.659 2252.92 93.7664 2207.73L-67.2076 1643.55L-798.184 1869.65C-856.73 1887.76 -923.398 1885.87 -979.806 1864.48L-2138.3 1425.38L-1787.63 925.687C-1765.05 893.507 -1727.57 868.111 -1681.77 853.942L-405.167 459.07L-686.568 -527.183C-696.491 -561.961 -689.511 -598.157 -666.811 -629.629L-406.21 -990.941C-351.902 -1066.24 -223.676 -1095.36 -119.809 -1055.99Z"
                fill="url(#paint0_radial)"
              />
              <path
                d="M885.9 -99.2158L1864.74 271.796C1921.14 293.177 1961.34 331.783 1974.23 376.97L2135.2 941.152L2866.18 715.049C2924.72 696.94 2991.39 698.837 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 747.087 1929.46 319.141 429.593C309.218 394.815 316.198 358.619 338.898 327.147L599.499 -34.1647C653.807 -109.461 782.033 -138.585 885.9 -99.2158Z"
                fill="url(#paint1_radial)"
              />
            </g>
            <defs>
              <radialGradient
                id="paint0_radial"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(-804.109 -2036.8) rotate(64.9401) scale(6436.87 6304.81)"
              >
                <stop stopColor="#0f172a" />
                <stop offset="0.0833333" stopColor="#1e293b" />
                <stop offset="0.364583" stopColor="#334155" />
                <stop offset="0.658041" stopColor="#1e293b" />
                <stop offset="0.798521" stopColor="#475569" />
                <stop offset="0.942708" stopColor="#0f172a" />
                <stop offset="1" stopColor="#020617" />
              </radialGradient>
              <radialGradient
                id="paint1_radial"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(201.6 -1080.02) rotate(64.9401) scale(6436.87 6304.81)"
              >
                <stop stopColor="#0f172a" />
                <stop offset="0.0833333" stopColor="#3b82f6" opacity="0.2" />
                <stop offset="0.333803" stopColor="#1e40af" opacity="0.1" />
                <stop offset="0.658041" stopColor="#1e293b" />
                <stop offset="0.798521" stopColor="#60a5fa" opacity="0.2" />
                <stop offset="0.942708" stopColor="#0f172a" />
                <stop offset="1" stopColor="#020617" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Logo and Title */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <img className="h-16 w-auto" src="/logo.svg" alt="Bubobot" />
      </div>

      {/* Card container */}
      <div className="z-10 w-[400px] rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <h3 className="mb-5 text-2xl font-bold text-white">Sign in</h3>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-5">
            <Label className="mb-1 block text-sm font-medium text-gray-300">
              Email
            </Label>
            <Input
              className="w-full rounded border-gray-700 bg-gray-800 p-2 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your email address"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="relative mb-5">
            <div className="mb-1 flex items-baseline justify-between">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-300"
              >
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              className="w-full rounded border-gray-700 bg-gray-800 p-2 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {/* <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/register")}
              className="border-gray-700 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Create an account
            </Button> */}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-sm text-white hover:bg-blue-700"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
