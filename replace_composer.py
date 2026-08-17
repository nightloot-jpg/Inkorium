import re

with open("src/main.tsx", "r") as f:
    content = f.read()

# We need to remove the existing function Composer and add the import
# Let's find the boundaries
start_idx = content.find("function Composer({")
if start_idx != -1:
    end_idx = content.find("function CommentsSection({", start_idx)
    if end_idx != -1:
        new_content = content[:start_idx] + content[end_idx:]

        # Add import
        import_str = "import { Composer } from './components/Composer';\n"
        # Find first function
        first_func_idx = new_content.find("function Brand()")
        if first_func_idx != -1:
            new_content = new_content[:first_func_idx] + import_str + new_content[first_func_idx:]

            with open("src/main.tsx", "w") as f:
                f.write(new_content)
            print("Composer removed from main.tsx and imported.")
        else:
            print("Could not find first function")
    else:
        print("Could not find end of Composer")
else:
    print("Could not find start of Composer")
