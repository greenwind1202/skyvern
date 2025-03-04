import { Outlet } from "react-router-dom";
import { cn } from "@/util/utils";
import { useSidebarStore } from "@/store/SidebarStore";
import { Header } from "@/routes/root/Header";
import { Sidebar } from "@/routes/root/Sidebar";

export function RootLayout() {
  const collapsed = useSidebarStore((state) => state.collapsed);

  return (
    <>
      <div className="h-full w-full">
        <Sidebar />
        <Header />
        <main
          className={cn("lg:pb-4 lg:pl-64", {
            "lg:pl-28": collapsed,
          })}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}
