// Signed URLs for photos in the private gbp-media bucket (server only).

import { EditError } from "./profile_edit.ts";

/** A 1-hour signed URL Google can fetch the uploaded photo from. */
export async function signedMediaUrl(path: string): Promise<string> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/storage/v1/object/sign/gbp-media/${path}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) throw new EditError("That photo couldn't be found. Please add it again.");
  const { signedURL } = await res.json() as { signedURL: string };
  return `${url}/storage/v1${signedURL}`;
}
