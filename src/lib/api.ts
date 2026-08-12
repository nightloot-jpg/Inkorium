import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  mood: string;
  favorite_quote: string;
  avatar_url: string | null;
  cover_url: string | null;
  accent_color: string;
  bg_color: string;
  is_private: boolean;
  view_count: number;
  created_at: string;
};

export const PROFILE_FIELDS =
  "id, username, display_name, bio, mood, favorite_quote, avatar_url, cover_url, accent_color, bg_color, is_private, view_count, created_at";

const MINI = "id, username, display_name, avatar_url, accent_color";
export type MiniProfile = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "accent_color"
>;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------------- profiles ---------------- */

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .ilike("username", username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function searchProfiles(term: string) {
  const clean = term.trim();
  let query = supabase.from("profiles").select(MINI).limit(30);
  if (clean) query = query.or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`);
  return unwrap(await query.order("created_at", { ascending: false })) as MiniProfile[];
}

export async function registerProfileView(profileId: string) {
  await supabase.rpc("increment_profile_view", { _profile_id: profileId });
}

/* ---------------- friendships ---------------- */

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
};

export async function getFriendshipsFor(userId: string) {
  return unwrap(
    await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order("created_at", { ascending: false }),
  ) as Friendship[];
}

export async function getFriendIds(userId: string) {
  const rows = await getFriendshipsFor(userId);
  return rows
    .filter((r) => r.status === "accepted")
    .map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
}

export async function getProfilesByIds(ids: string[]) {
  if (ids.length === 0) return [] as MiniProfile[];
  return unwrap(await supabase.from("profiles").select(MINI).in("id", ids)) as MiniProfile[];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, addressee_id: addresseeId });
  if (error) throw new Error(error.message);
}

export async function respondFriendRequest(id: string, accept: boolean) {
  if (accept) {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export async function removeFriendship(id: string) {
  const { error } = await supabase.from("friendships").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- photos ---------------- */

export type Photo = {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  description: string;
  is_private: boolean;
  created_at: string;
  album_id?: string | null;
};

const PHOTO_FIELDS =
  "id, user_id, image_url, title, description, is_private, created_at, album_id";

/* ---------------- albums ---------------- */

export type Album = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_private: boolean;
  cover_url: string | null;
  created_at: string;
};

const ALBUM_FIELDS = "id, user_id, title, description, is_private, cover_url, created_at";

export async function getAlbumsByUser(userId: string) {
  return unwrap(
    await supabase
      .from("albums")
      .select(ALBUM_FIELDS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as Album[];
}

export async function createAlbum(input: {
  user_id: string;
  title: string;
  description: string;
  is_private: boolean;
}) {
  const { data, error } = await supabase.from("albums").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function deleteAlbum(id: string) {
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAlbumPhotos(userId: string) {
  return unwrap(
    await supabase
      .from("photos")
      .select("id, album_id, image_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as { id: string; album_id: string | null; image_url: string; created_at: string }[];
}

export async function getPhotosByUser(userId: string) {
  return unwrap(
    await supabase
      .from("photos")
      .select(PHOTO_FIELDS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ) as Photo[];
}

export async function getPhoto(id: string) {
  const { data, error } = await supabase.from("photos").select(PHOTO_FIELDS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Photo | null;
}

export async function createPhoto(input: {
  user_id: string;
  image_url: string;
  title: string;
  description: string;
  is_private: boolean;
  album_id?: string | null;
}) {
  const { data, error } = await supabase.from("photos").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function getPhotosByAlbum(albumId: string) {
  return unwrap(
    await supabase
      .from("photos")
      .select(PHOTO_FIELDS)
      .eq("album_id", albumId)
      .order("created_at", { ascending: false }),
  ) as Photo[];
}

export async function getAlbum(id: string) {
  const { data, error } = await supabase
    .from("albums")
    .select(ALBUM_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Album | null;
}

export async function updatePhoto(
  id: string,
  patch: Partial<Pick<Photo, "title" | "description" | "is_private" | "album_id">>,
) {
  const { error } = await supabase.from("photos").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateAlbum(id: string, patch: Partial<Album>) {
  const { error } = await supabase.from("albums").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPhotosByIds(ids: string[]) {
  if (ids.length === 0) return [] as Photo[];
  return unwrap(
    await supabase
      .from("photos")
      .select(PHOTO_FIELDS)
      .in("id", ids)
      .order("created_at", { ascending: false }),
  ) as Photo[];
}

export async function deletePhoto(id: string) {
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPhotoComments(photoId: string) {
  return unwrap(
    await supabase
      .from("photo_comments")
      .select("id, photo_id, author_id, body, created_at")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true }),
  ) as { id: string; photo_id: string; author_id: string; body: string; created_at: string }[];
}

export async function addPhotoComment(photoId: string, authorId: string, body: string) {
  const { error } = await supabase
    .from("photo_comments")
    .insert({ photo_id: photoId, author_id: authorId, body });
  if (error) throw new Error(error.message);
}

export async function deletePhotoComment(id: string) {
  const { error } = await supabase.from("photo_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPhotoLikes(photoId: string) {
  return unwrap(
    await supabase.from("photo_likes").select("user_id").eq("photo_id", photoId),
  ) as { user_id: string }[];
}

export async function togglePhotoLike(photoId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase
      .from("photo_likes")
      .delete()
      .eq("photo_id", photoId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("photo_likes")
      .insert({ photo_id: photoId, user_id: userId });
    if (error) throw new Error(error.message);
  }
}

/* ---------------- statuses & wall ---------------- */

export type StatusUpdate = { id: string; user_id: string; body: string; created_at: string };

export async function getStatuses(userIds: string[], limit = 30) {
  if (userIds.length === 0) return [] as StatusUpdate[];
  return unwrap(
    await supabase
      .from("status_updates")
      .select("id, user_id, body, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(limit),
  ) as StatusUpdate[];
}

export async function postStatus(userId: string, body: string) {
  const { error } = await supabase.from("status_updates").insert({ user_id: userId, body });
  if (error) throw new Error(error.message);
}

export type WallPost = {
  id: string;
  profile_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export async function getWallPosts(profileId: string) {
  return unwrap(
    await supabase
      .from("wall_posts")
      .select("id, profile_id, author_id, body, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50),
  ) as WallPost[];
}

export async function postWall(profileId: string, authorId: string, body: string) {
  const { error } = await supabase
    .from("wall_posts")
    .insert({ profile_id: profileId, author_id: authorId, body });
  if (error) throw new Error(error.message);
}

export async function deleteWallPost(id: string) {
  const { error } = await supabase.from("wall_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- messages ---------------- */

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

const MESSAGE_FIELDS = "id, sender_id, recipient_id, body, read_at, created_at";

export async function getAllMessages(userId: string) {
  return unwrap(
    await supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(400),
  ) as Message[];
}

export async function getConversation(userId: string, otherId: string) {
  return unwrap(
    await supabase
      .from("messages")
      .select(MESSAGE_FIELDS)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true })
      .limit(300),
  ) as Message[];
}

export async function sendMessage(senderId: string, recipientId: string, body: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, recipient_id: recipientId, body });
  if (error) throw new Error(error.message);
}

export async function markConversationRead(userId: string, otherId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("sender_id", otherId)
    .is("read_at", null);
}

/* ---------------- notifications ---------------- */

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  read: boolean;
  created_at: string;
};

export async function getNotifications(userId: string) {
  return unwrap(
    await supabase
      .from("notifications")
      .select("id, user_id, actor_id, type, entity_id, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60),
  ) as Notification[];
}

export async function markNotificationsRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

/* ---------------- top friends / blocks / reports ---------------- */

export async function getTopFriends(profileId: string) {
  return unwrap(
    await supabase
      .from("top_friends")
      .select("friend_id, position")
      .eq("profile_id", profileId)
      .order("position", { ascending: true }),
  ) as { friend_id: string; position: number }[];
}

export async function setTopFriends(profileId: string, friendIds: string[]) {
  const { error: delError } = await supabase
    .from("top_friends")
    .delete()
    .eq("profile_id", profileId);
  if (delError) throw new Error(delError.message);
  if (friendIds.length === 0) return;
  const { error } = await supabase
    .from("top_friends")
    .insert(friendIds.slice(0, 8).map((id, i) => ({ profile_id: profileId, friend_id: id, position: i })));
  if (error) throw new Error(error.message);
}

export async function getBlocks(userId: string) {
  return unwrap(
    await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
  ) as { blocked_id: string }[];
}

export async function toggleBlock(blockerId: string, blockedId: string, blocked: boolean) {
  if (blocked) {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error) throw new Error(error.message);
  }
}

export async function reportContent(
  reporterId: string,
  targetType: string,
  targetId: string,
  reason: string,
) {
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: reporterId, target_type: targetType, target_id: targetId, reason });
  if (error) throw new Error(error.message);
}
/* ---------------- photo tags ---------------- */

export type PhotoTag = {
  photo_id: string;
  tagged_id: string;
  tagger_id: string;
  created_at: string;
};

export async function getPhotoTags(photoId: string) {
  return unwrap(
    await supabase
      .from("photo_tags")
      .select("photo_id, tagged_id, tagger_id, created_at")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true }),
  ) as PhotoTag[];
}

export async function addPhotoTag(photoId: string, taggedId: string, taggerId: string) {
  const { error } = await supabase
    .from("photo_tags")
    .insert({ photo_id: photoId, tagged_id: taggedId, tagger_id: taggerId });
  if (error) throw new Error(error.message);
}

export async function removePhotoTag(photoId: string, taggedId: string) {
  const { error } = await supabase
    .from("photo_tags")
    .delete()
    .eq("photo_id", photoId)
    .eq("tagged_id", taggedId);
  if (error) throw new Error(error.message);
}

/** Fotos en las que sale el usuario (le han etiquetado). */
export async function getTagsWhereTagged(userId: string) {
  return unwrap(
    await supabase
      .from("photo_tags")
      .select("photo_id, tagged_id, tagger_id, created_at")
      .eq("tagged_id", userId)
      .order("created_at", { ascending: false }),
  ) as PhotoTag[];
}

/** Etiquetas que ha puesto el usuario a otras personas. */
export async function getTagsByTagger(userId: string) {
  return unwrap(
    await supabase
      .from("photo_tags")
      .select("photo_id, tagged_id, tagger_id, created_at")
      .eq("tagger_id", userId)
      .order("created_at", { ascending: false }),
  ) as PhotoTag[];
}

export async function getPublicAlbumsByUsers(userIds: string[]) {
  if (userIds.length === 0) return [] as Album[];
  return unwrap(
    await supabase
      .from("albums")
      .select(ALBUM_FIELDS)
      .in("user_id", userIds)
      .eq("is_private", false)
      .order("created_at", { ascending: false }),
  ) as Album[];
}
