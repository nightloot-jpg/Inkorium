import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getDisplayName, formatPostTime } from "../../utils";
import type { Session } from "@supabase/supabase-js";
import type { FeedPostCardData } from "./FeedPostCard";

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type UseFeedPostsResult = {
  posts: FeedPostCardData[];
  liked: string[];
  loading: boolean;
  error: string;
  setPosts: React.Dispatch<React.SetStateAction<FeedPostCardData[]>>;
  toggleLike: (postId: string) => Promise<void>;
};

export function useFeedPosts(session: Session, profile: Profile | null, username: string): UseFeedPostsResult {
  const [posts, setPosts] = useState<FeedPostCardData[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setLoading(true);
      setError("");

      const [{ data: postsData, error: postsError }, { data: likesData }] = await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, content, created_at, author_id, target_profile_id, shared_post_id, media_data, poll_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name, avatar_url))"
          )
          .eq("visibility", "public")
          .is("group_id", null)
          .is("target_profile_id", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("post_likes").select("post_id").eq("user_id", session.user.id),
      ]);

      if (cancelled) return;
      if (postsError) {
        setError(postsError.message);
        setLoading(false);
        return;
      }

      const rows = postsData ?? [];
      const authorIds = [...new Set(rows.map((row: any) => row.author_id).filter(Boolean))];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", authorIds)
        : { data: [] as Profile[] };

      if (cancelled) return;

      const profileMap = new Map((profiles ?? []).map((item: Profile) => [item.id, item]));
      const nextPosts = rows.map((row: any): FeedPostCardData => ({
        id: row.id,
        text: row.content ?? "",
        time: formatPostTime(row.created_at),
        likes: row.post_likes?.[0]?.count ?? 0,
        authorName: profileMap.has(row.author_id)
          ? getDisplayName(profileMap.get(row.author_id) || null, undefined)
          : row.author_id === session.user.id
            ? username
            : "usuario",
        authorAvatarUrl:
          profileMap.get(row.author_id)?.avatar_url ||
          (row.author_id === session.user.id ? profile?.avatar_url : null),
        media_data: row.media_data,
        author_id: row.author_id,
        target_profile_id: row.target_profile_id,
        shared_post_id: row.shared_post_id,
        originalPost: row.original_post
          ? {
              text: row.original_post.content || "",
              authorName:
                row.original_post.profiles?.username ||
                row.original_post.profiles?.full_name ||
                "Usuario",
              authorAvatarUrl: row.original_post.profiles?.avatar_url || null,
              time: formatPostTime(row.original_post.created_at),
              author_id: row.original_post.author_id,
            }
          : undefined,
        commentsCount: row.comments?.[0]?.count || 0,
        poll_id: row.poll_id,
      }));

      setPosts(nextPosts);
      setLiked((likesData ?? []).map((like: any) => like.post_id));
      setLoading(false);
    }

    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_url, session.user.id, username]);

  async function toggleLike(postId: string) {
    const active = liked.includes(postId);

    setLiked((current) =>
      active ? current.filter((id) => id !== postId) : [...current, postId]
    );
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, likes: post.likes + (active ? -1 : 1) }
          : post
      )
    );

    if (active) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", session.user.id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: session.user.id });
    }
  }

  return { posts, liked, loading, error, setPosts, toggleLike };
}
