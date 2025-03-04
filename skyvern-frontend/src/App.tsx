import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { router } from "./router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./api/QueryClient";
import { Toaster } from "@/components/ui/toaster";

import { PostHogProvider } from "posthog-js/react";

const postHogOptions = {
  api_host: "https://us.i.posthog.com",
};

function App() {
  return (
    <PostHogProvider
      apiKey="phc_KzvrVhGB3AQz6Hk7h0bpwvSZsnmZSr7s2ORjnUHCEeA"
      options={postHogOptions}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </PostHogProvider>
  );
}

export default App;
