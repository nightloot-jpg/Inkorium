with open("src/main.tsx", "r") as f:
    content = f.read()

import re
# Undo the force_bypass
content = re.sub(r'return <PhotosPage.*?/>;', r'if (!session) return <Login />;', content)

with open("src/main.tsx", "w") as f:
    f.write(content)
