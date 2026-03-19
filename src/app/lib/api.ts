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