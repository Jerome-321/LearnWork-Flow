const getRuntimeApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.toString().trim();
  const defaultUrl = "/api";

  if (typeof window === "undefined") {
    return envUrl || defaultUrl;
  }

  const isBrowserLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const envUrlIsLocalhost = !!envUrl?.match(/localhost|127\.0\.0\.1/);

  if (!isBrowserLocalhost && envUrlIsLocalhost) {
    return defaultUrl;
  }

  return envUrl || defaultUrl;
};

export const API_URL = getRuntimeApiUrl();

export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  setLoading: (v: boolean) => void
) => {
  setLoading(true);

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "API Error");

    return data;
  } catch (error) {
    console.error("API ERROR:", error);
    throw error;
  } finally {
    setLoading(false);
  }
};