import { useOrganizationStore } from "@/store/OrganizationStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrganizationSelector() {
  const { organizations, selectedOrganizationId, setSelectedOrganizationId } =
    useOrganizationStore();

  if (organizations.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Organization:</span>
      <Select
        value={selectedOrganizationId || undefined}
        onValueChange={setSelectedOrganizationId}
      >
        <SelectTrigger className="h-8 w-[180px] text-sm">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.organization_id} value={org.organization_id}>
              {org.organization_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
