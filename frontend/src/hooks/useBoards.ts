import { api, failure } from "../api/client";
import { useResource } from "./useResource";
import type { Leaderboard } from "../types";
export function useBoards(eventIds: number[], revision: number) {
  const key = [...new Set(eventIds)].sort((a, b) => a - b).join(",");
  return useResource(
    async () => {
      const ids = key ? key.split(",").map(Number) : [];
      const results = await Promise.allSettled(
        ids.map((id) => api.get<Leaderboard>(`/hackathons/${id}/leaderboard`)),
      );
      const boards: Record<number, Leaderboard> = {};
      const errors: Record<number, string> = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled")
          boards[ids[index]] = result.value.data;
        else errors[ids[index]] = failure(result.reason).message;
      });
      return { boards, errors };
    },
    [key],
    revision,
  );
}
