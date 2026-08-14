import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Make sure commentsCount is passed to Posts array
content = re.sub(
    r'author_id: row\.author_id \}\)\)\);',
    r'author_id: row.author_id, commentsCount: (row as any).post_comments?.[0]?.count || 0 })));',
    content
)

# And ProfileViewLegacy
content = re.sub(
    r'targetName: name \}\)\)\);',
    r'targetName: name, commentsCount: (post as any).post_comments?.[0]?.count || 0 })));',
    content
)


with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
