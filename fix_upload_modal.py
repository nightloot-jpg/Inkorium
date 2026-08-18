import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

# I see the problem - the "+ Subir video" button calls open-composer-modal
# but Composer component isn't listening for it correctly or there's a typo in the button

if "open-composer-modal" in content:
    print("Found open-composer-modal events.")
