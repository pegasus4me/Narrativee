import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-config";
import type { Channel } from "@/app/types/api";

export const CHANNELS_KEY = ["channels"] as const;

async function fetchChannels(): Promise<Channel[]> {
  const res = await fetch(`${API_URL}/channels`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch channels");
  const data = (await res.json()) as { channels?: Channel[] };
  return data.channels ?? [];
}

export function useChannels(enabled = true) {
  return useQuery({
    queryKey: CHANNELS_KEY,
    queryFn: fetchChannels,
    enabled,
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: string) => {
      await fetch(`${API_URL}/channels/${channelId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });
    },
  });
}

export function useConnectBluesky() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { identifier: string; appPassword: string }) => {
      const res = await fetch(`${API_URL}/channels/connect/bluesky`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = (await res.json()) as { error?: string; details?: string };
      if (!res.ok) throw new Error(data.error || data.details || "Failed to connect Bluesky");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });
    },
  });
}
