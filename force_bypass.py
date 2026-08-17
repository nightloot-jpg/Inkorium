with open("src/main.tsx", "r") as f:
    content = f.read()

# Force bypassing Auth and Route manually to bypass UI auth problems for visual check

mock_app = """
  return <PhotosPage session={{ user: { id: 'test', user_metadata: { username: 'testuser' } } } as any} navigate={() => {}} />;
"""

# Replace the inner App return
import re
content = re.sub(r'if \(!session\) return <Login />;', mock_app, content)

with open("src/main.tsx", "w") as f:
    f.write(content)
