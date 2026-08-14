import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

# Modify post actions in Feed
content = re.sub(
    r'<button onClick=\{\(\) => toggleLike\(post.id\)\} className=\{liked\.includes\(post\.id\) \? "is-liked" : ""\}>♡ Me gusta <small>\{post\.likes \|\| ""\}</small></button><button>◯ Comentar</button><button>♧ Compartir</button><span>♡ \{post\.likes\}</span>',
    r'<button onClick={() => toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4}} /> {post.likes}</span>',
    content
)

# Modify post actions in ProfileViewLegacy
content = re.sub(
    r'<button onClick=\{\(\) => void toggleLike\(post.id\)\} className=\{liked\.includes\(post\.id\) \? "is-liked" : ""\}>♡ Me gusta <small>\{post\.likes \|\| ""\}</small></button><button>◯ Comentar</button><button>♧ Compartir</button>',
    r'<button onClick={() => void toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span style={{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85em", color: "var(--text-light)"}}><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4}} /> {post.likes}</span>',
    content
)

# Remove More button (⌄) in Feed
content = re.sub(
    r'<span>\{post\.time\} · ◉</span>\n          </div><button className="more">⌄</button></div>',
    r'<span>{post.time} · ◉</span>\n          </div></div>',
    content
)

# Remove More button (⌄) in ProfileViewLegacy
content = re.sub(
    r'<span>\{post\.time\} · ◉</span>\n          </div><button className="more">⌄</button></div>',
    r'<span>{post.time} · ◉</span>\n          </div></div>',
    content
)


with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
