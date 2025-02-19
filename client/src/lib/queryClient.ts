import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl } from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      const errorData = await res.json();
      errorText = errorData.message || res.statusText;
    } catch {
      errorText = await res.text() || res.statusText;
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = getApiUrl(path);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      mode: "cors",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API Request Failed: ${error.message}`);
    }
    throw new Error('API Request Failed');
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [path] = queryKey;
    const url = getApiUrl(path as string);
    try {
      const res = await fetch(url, {
        credentials: "include",
        mode: "cors",
        headers: {
          "Accept": "application/json",
        },
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Query Failed: ${error.message}`);
      }
      throw new Error('Query Failed');
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});