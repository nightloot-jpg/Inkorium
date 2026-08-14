import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Fix the import for Lucide React
content = re.sub(
    r'import \{ Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send \} from "lucide-react";',
    r'import { Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send } from "lucide-react";',
    content
)

# Fix ShareMenu not imported or added properly? It was added earlier by string replacement, let's make sure it's correctly used.
# The `Copy` and `Send` icons were added in the previous modify script successfully.

with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
