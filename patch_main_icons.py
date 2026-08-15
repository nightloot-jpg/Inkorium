import sys

def patch_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Add Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreVertical
    target = 'import { Play, Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send } from "lucide-react";'
    new_target = 'import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MoreVertical, Minus, Plus, Upload, Move, X, Bell, Search, Image, Video, Music, BarChart3, Newspaper, List, ChevronDown, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Copy, Send } from "lucide-react";'

    content = content.replace(target, new_target)

    with open(file_path, 'w') as f:
        f.write(content)

patch_file('src/main.tsx')
