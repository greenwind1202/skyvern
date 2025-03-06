import { useState, useEffect } from "react";

function useApiCredential() {
  const [apiKey, setApiKey] = useState<string | null>(
    localStorage.getItem("apiKey"),
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setApiKey(localStorage.getItem("apiKey"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return apiKey;
}

export { useApiCredential };
