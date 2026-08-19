import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";
/** Signed URLs are short-lived by design; one hour covers a session. */
const TTL_SECONDS = 60 * 60;

async function sign(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL_SECONDS);
  return data?.signedUrl ?? null;
}

/** Resolves a stored avatar path (or absolute URL) into a displayable URL. */
export function useAvatarUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    sign(path).then((next) => {
      if (mounted) setUrl(next);
    });
    return () => {
      mounted = false;
    };
  }, [path]);
  return url;
}

/** Resolves many avatar paths at once, keyed by the original path. */
export function useAvatarUrls(paths: Array<string | null | undefined>) {
  const key = paths.filter(Boolean).sort().join("|");
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    (async () => {
      const unique = Array.from(new Set(key ? key.split("|") : []));
      const entries = await Promise.all(unique.map(async (p) => [p, await sign(p)] as const));
      if (!mounted) return;
      const next: Record<string, string> = {};
      for (const [p, signed] of entries) if (signed) next[p] = signed;
      setMap(next);
    })();
    return () => {
      mounted = false;
    };
  }, [key]);
  return map;
}

export type AvatarUploadResult = { path: string; url: string };

/** Uploads a profile picture into the caller's own folder and records the path. */
export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File): Promise<AvatarUploadResult> => {
    if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");

    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("You need to be signed in.");
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${u.user.id}/avatar-${Date.now()}.${ext || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", u.user.id);
      if (profileError) throw profileError;

      const url = await sign(path);
      return { path, url: url ?? "" };
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", u.user.id);
  }, []);

  return { upload, remove, uploading };
}