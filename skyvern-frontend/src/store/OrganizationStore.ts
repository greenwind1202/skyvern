import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Organization = {
  organization_id: string;
  organization_name: string;
};

type OrganizationStore = {
  organizations: Organization[];
  selectedOrganizationId: string | null;
  setOrganizations: (organizations: Organization[]) => void;
  setSelectedOrganizationId: (organizationId: string) => void;
};

const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      organizations: [],
      selectedOrganizationId: null,
      setOrganizations: (organizations) => set({ organizations }),
      setSelectedOrganizationId: (organizationId) =>
        set({ selectedOrganizationId: organizationId }),
    }),
    {
      name: "organization-store",
    },
  ),
);

export { useOrganizationStore };
