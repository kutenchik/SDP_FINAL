import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});
export interface ApiFailure {
  message: string;
  errors: Record<string, string>;
}
export function failure(error: unknown): ApiFailure {
  if (axios.isAxiosError(error))
    return {
      message:
        error.response?.data?.message ||
        (error.response
          ? "This request couldn’t be completed. Please try again."
          : error.code === "ECONNABORTED"
            ? "This is taking longer than expected. Please try again."
            : "We couldn’t connect to the server. Check your connection and try again."),
      errors: error.response?.data?.errors || {},
    };
  return {
    message:
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
    errors: {},
  };
}
export async function downloadReport(id: number, format: "json" | "pdf") {
  const response = await api.get(`/hackathons/${id}/export/${format}`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hackathon-${id}-results.${format}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
