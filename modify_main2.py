import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Add openComments and shareMenu state to Feed
content = re.sub(
    r'const \[feedError, setFeedError\] = useState\(""\);',
    r'const [feedError, setFeedError] = useState(""); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null);',
    content
)

# Add openComments and shareMenu state to ProfileViewLegacy
content = re.sub(
    r'const \[profileNotFound, setProfileNotFound\] = useState\(false\);',
    r'const [profileNotFound, setProfileNotFound] = useState(false); const [openComments, setOpenComments] = useState<string | null>(null); const [shareMenu, setShareMenu] = useState<string | null>(null);',
    content
)

with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
