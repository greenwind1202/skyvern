import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrganizationStore } from "@/store/OrganizationStore";
import { removeApiKeyHeader } from "@/api/AxiosClient";

export function Header() {
  const navigate = useNavigate();
  const { setOrganizations, setSelectedOrganizationId } = useOrganizationStore();

  const handleLogout = () => {
    // Remove API key from localStorage
    localStorage.removeItem("apiKey");
    
    // Remove API key header
    removeApiKeyHeader();

    // Clear organization state
    setOrganizations([]);
    setSelectedOrganizationId(null);

    // Redirect to login page
    navigate("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <Link to="/workflows" className="flex items-center gap-2">
        <img className="h-8 w-auto" src="/logo.svg" alt="Bubobot" />
      </Link>
      <Button
        variant="outline"
        className="border-gray-700 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
        onClick={handleLogout}
      >
        Sign out
      </Button>
    </header>
  );
} 