-- Add covering indexes for active foreign keys identified by the Supabase advisor.
-- These indexes are intentionally limited to frequently queried application relations.

create index if not exists idx_chat_messages_sender_id on public.chat_messages(sender_id);
create index if not exists idx_chat_messages_reply_to_id on public.chat_messages(reply_to_id);
create index if not exists idx_friendships_friend_id on public.friendships(friend_id);
create index if not exists idx_posts_poll_id on public.posts(poll_id);
create index if not exists idx_photos_user_id on public.photos(user_id);
create index if not exists idx_photos_album_id on public.photos(album_id);
create index if not exists idx_photo_comments_photo_id on public.photo_comments(photo_id);
create index if not exists idx_photo_comments_author_id on public.photo_comments(author_id);
create index if not exists idx_photo_likes_user_id on public.photo_likes(user_id);
create index if not exists idx_music_activity_track_id on public.music_activity(track_id);
