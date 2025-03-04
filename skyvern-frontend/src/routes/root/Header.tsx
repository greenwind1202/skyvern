import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrganizationStore } from "@/store/OrganizationStore";
import { removeApiKeyHeader } from "@/api/AxiosClient";
import { NavigationHamburgerMenu } from "./NavigationHamburgerMenu";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { ExitIcon } from "@radix-ui/react-icons";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const navigate = useNavigate();
  const { setOrganizations, setSelectedOrganizationId } = useOrganizationStore();
  const { data: userInfo, isLoading } = useUserInfo();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    // Remove API key from localStorage
    localStorage.removeItem("apiKey");
    
    // Remove API key header
    removeApiKeyHeader();

    // Clear organization state
    setOrganizations([]);
    setSelectedOrganizationId(null);

    // Clear all React Query cache
    queryClient.clear();

    // Redirect to login page
    navigate("/login");
  };
  return (
    <header className="relative z-10">
      <div className="flex h-24 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="lg:invisible">
            <NavigationHamburgerMenu />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* <OrganizationSelector /> */}
          {!isLoading && userInfo && (
            <span className=" text-slate-300">
              Hi, {userInfo.first_name} {userInfo.last_name}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <ExitIcon className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
