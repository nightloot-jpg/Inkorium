import re

with open('src/styles.css', 'r') as f:
    content = f.read()

# I will fix the duplicate order rules and dangling braces
target = """  .music-sidebar-left { order: -1; }
  .music-main-content { order: 0; }
  .music-sidebar-right { order: 1; }
}
  .music-sidebar-left { order: -1; }
  .music-main-content { order: 0; }
  .music-sidebar-right { order: 1; }
}"""

replace = """  .music-sidebar-left { order: -1; }
  .music-main-content { order: 0; }
  .music-sidebar-right { order: 1; }
}"""

content = content.replace(target, replace)

with open('src/styles.css', 'w') as f:
    f.write(content)
