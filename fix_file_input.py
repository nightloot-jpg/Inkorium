import re
with open('src/main.tsx', 'r') as f:
    content = f.read()

# Make sure the input element has correct imports and doesn't break rendering
if 'import React, ' not in content:
    content = content.replace('import { StrictMode', 'import React, { StrictMode')

with open('src/main.tsx', 'w') as f:
    f.write(content)
