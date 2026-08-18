"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFavorite, upsertFavorite } from "@/lib/actions/user-data";
import { favoriteStatusQueryOptions } from "@/lib/queries/options";
import { queryKeys } from "@/lib/queries/keys";
import type { MangaProviderType } from "@/types";

interface FavoriteButtonProps {
  provider: MangaProviderType;
  externalMangaId: string;
  title: string;
  coverUrl: string | null;
  initialFavorited: boolean;
}

export function FavoriteButton({
  provider,
  externalMangaId,
  title,
  coverUrl,
  initialFavorited,
}: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  const statusKey = queryKeys.favoriteStatus(provider, externalMangaId);

  const { data: favorited = initialFavorited } = useQuery({
    ...favoriteStatusQueryOptions(provider, externalMangaId, true),
    initialData: initialFavorited,
  });

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) {
        await upsertFavorite({ provider, externalMangaId, title, coverUrl });
      } else {
        await removeFavorite(provider, externalMangaId);
      }
      return next;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      const previous = queryClient.getQueryData<boolean>(statusKey);
      queryClient.setQueryData(statusKey, next);
      return { previous };
    },
    onError: (_err, _next, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(statusKey, context.previous);
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(statusKey, next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites() });
    },
  });

  return (
    <Button
      variant={favorited ? "default" : "outline"}
      size="sm"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(!favorited)}
    >
      <Heart className={`mr-2 size-4 ${favorited ? "fill-current" : ""}`} />
      {favorited ? "Favorited" : "Favorite"}
    </Button>
  );
}
