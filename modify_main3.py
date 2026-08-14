import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Update Post type
content = re.sub(
    r'type Post = \{ id: string; text: string; time: string; likes: number; authorName\?: string; author_id: string; target_profile_id\?: string \| null; targetName\?: string \};',
    r'type Post = { id: string; text: string; time: string; likes: number; authorName?: string; author_id: string; target_profile_id?: string | null; targetName?: string; shared_post_id?: string | null; originalPost?: { text: string; authorName: string; time: string; author_id: string; }; commentsCount?: number; };',
    content
)

# Update post creation (publishing)
content = re.sub(
    r'target_profile_id: targetProfileId \|\| null',
    r'target_profile_id: targetProfileId || null, shared_post_id: null',
    content
)

# Fix double target_profile_id
content = re.sub(
    r'target_profile_id: targetProfileId \|\| null, shared_post_id: null\n\s*\}\)',
    r'target_profile_id: targetProfileId || null\n    })',
    content
)


with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
