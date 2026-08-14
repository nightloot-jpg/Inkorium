import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

# Update feed fetch select
content = content.replace(
    'supabase.from("posts").select("id, content, created_at, author_id, target_profile_id, shared_post_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name))")',
    'supabase.from("posts").select("id, content, created_at, author_id, target_profile_id, shared_post_id, media_data, poll_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name))")'
)

# Update profile feed fetch select
content = content.replace(
    'supabase.from("posts").select("id, content, created_at, target_profile_id, author_id, shared_post_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name))")',
    'supabase.from("posts").select("id, content, created_at, target_profile_id, author_id, shared_post_id, media_data, poll_id, post_likes(count), comments(count), original_post:shared_post_id(content, created_at, author_id, profiles!posts_author_id_fkey(username, full_name))")'
)


# Add mapping for media_data and poll_id in rows.map() inside loadPosts
# Need to find the rows.map in loadPosts
content = re.sub(
    r'rows\.map\(\(row\)\s*=>\s*\(\{\s*(.*?)\s*\}\)\)',
    r'rows.map((row) => ({\1, media_data: row.media_data, poll_id: row.poll_id }))',
    content,
    flags=re.DOTALL
)

with open('src/main.tsx', 'w') as f:
    f.write(content)

print("Modified fetching to include media_data and poll_id")
