import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

profile_post_regex = r'<article className="post panel" key=\{post\.id\}><div className="post-head"><div className="avatar">.*?</div>\n          <div>\n            <strong>.*?Usuario"\}</strong>\n            \{post\.target_profile_id && post\.target_profile_id !== post\.author_id \? \(\n              <span className="signature-meta" style=\{\{display: "block", fontSize: "0\.85em", color: "var\(--text-light\)"\}\}>\n                dejó un mensaje en el tablón de \{post\.targetName \|\| "alguien"\}\n              </span>\n            \) : null\}\n            <span>\{post\.time\} · ◉</span>\n          </div></div><p className="post-text">\{post\.text\}</p><div className="post-actions"><button onClick=\{\(\) => void toggleLike\(post\.id\)\} className=\{liked\.includes\(post\.id\) \? "is-liked" : ""\}><Heart size=\{16\} fill=\{liked\.includes\(post\.id\) \? "currentColor" : "none"\} /> Me gusta</button><button onClick=\{\(\) => setOpenComments\(post\.id === openComments \? null : post\.id\)\}><MessageCircle size=\{16\} /> Comentar</button><button onClick=\{\(\) => setShareMenu\(post\.id === shareMenu \? null : post\.id\)\}><Share2 size=\{16\} /> Compartir</button><span style=\{\{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0\.85em", color: "var\(--text-light\)"\}\}><Heart size=\{14\} style=\{\{display:"inline", verticalAlign:"middle", marginRight: 4\}\} /> \{post\.likes\}</span></div></article>'

profile_post_replacement = r'''<article className="post panel" key={post.id}><div className="post-head"><div className="avatar">{profile?.avatar_url ? <img src={profile.avatar_url} style={{width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover"}}/> : initials}</div>
          <div>
            <strong>{post.authorName || (post as any).name || "Usuario"}</strong>
            {post.target_profile_id && post.target_profile_id !== post.author_id ? (
              <span className="signature-meta" style={{display: "block", fontSize: "0.85em", color: "var(--text-light)"}}>
                dejó un mensaje en el tablón de {post.targetName || "alguien"}
              </span>
            ) : null}
            <span>{post.time} · ◉</span>
          </div></div>
          {post.shared_post_id && post.originalPost && (
             <div style={{fontSize: "0.85em", color: "var(--text-light)", marginBottom: 8, marginLeft: 16}}>
               Compartió una publicación de <strong>{post.originalPost.authorName}</strong>
             </div>
          )}
          {post.text && <p className="post-text">{post.text}</p>}
          {post.shared_post_id && post.originalPost && (
            <div className="shared-post-ref">
               <div className="post-head">
                 <strong>{post.originalPost.authorName}</strong>
                 <span style={{fontSize: "0.85em", color: "var(--text-light)"}}>{post.originalPost.time}</span>
               </div>
               <p className="post-text">{post.originalPost.text}</p>
            </div>
          )}
          <div className="post-actions" style={{position: "relative"}}><button onClick={() => void toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span style={{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85em", color: "var(--text-light)"}}><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4, opacity: 0.7}} /> {post.likes}</span>
          {shareMenu === post.id && <ShareMenu post={post} session={session} onClose={() => setShareMenu(null)} />}
          </div>
          {openComments === post.id && <CommentsSection postId={post.id} session={session} navigate={navigate} />}
          </article>'''

content = re.sub(profile_post_regex, profile_post_replacement, content, count=1, flags=re.DOTALL)


# Update Post Data Fetching in Feed to fetch shared posts and comments count
feed_fetch_regex = r'supabase\.from\("posts"\)\.select\("id, content, created_at, author_id, post_likes\(count\)"\)'
feed_fetch_replacement = r'supabase.from("posts").select("id, content, created_at, author_id, target_profile_id, shared_post_id, post_likes(count), post_comments(count), original_post:shared_post_id(content, created_at, author_id, profiles(username, full_name))")'
content = re.sub(feed_fetch_regex, feed_fetch_replacement, content)

profile_fetch_regex = r'supabase\.from\("posts"\)\.select\("id, content, created_at, target_profile_id, author_id, post_likes\(count\)"\)'
profile_fetch_replacement = r'supabase.from("posts").select("id, content, created_at, target_profile_id, author_id, shared_post_id, post_likes(count), post_comments(count), original_post:shared_post_id(content, created_at, author_id, profiles(username, full_name))")'
content = re.sub(profile_fetch_regex, profile_fetch_replacement, content)

# Feed mapping
feed_map_regex = r'setPosts\(rows\.map\(\(row\) => \(\{ id: row\.id, text: row\.content \?\? "", time: formatPostTime\(row\.created_at\), likes: row\.post_likes\?\.\[0\]\?\.count \?\? 0, authorName: profileNames\.get\(row\.author_id\) \?\? \(row\.author_id === session\.user\.id \? username : "usuario"\), author_id: row\.author_id, commentsCount: \(row as any\)\.post_comments\?\.\[0\]\?\.count \|\| 0 \}\)\)\);'
feed_map_replacement = r'''setPosts(rows.map((row: any) => ({
      id: row.id,
      text: row.content ?? "",
      time: formatPostTime(row.created_at),
      likes: row.post_likes?.[0]?.count ?? 0,
      authorName: profileNames.get(row.author_id) ?? (row.author_id === session.user.id ? username : "usuario"),
      author_id: row.author_id,
      target_profile_id: row.target_profile_id,
      shared_post_id: row.shared_post_id,
      originalPost: row.original_post ? {
        text: row.original_post.content || "",
        authorName: row.original_post.profiles?.username || row.original_post.profiles?.full_name || "Usuario",
        time: formatPostTime(row.original_post.created_at),
        author_id: row.original_post.author_id
      } : undefined,
      commentsCount: row.post_comments?.[0]?.count || 0
    })));'''
content = re.sub(feed_map_regex, feed_map_replacement, content)


# Profile mapping
profile_map_regex = r'setPosts\(rows\.map\(\(post\) => \(\{ id: post\.id, text: post\.content \?\? "", time: formatPostTime\(post\.created_at\), likes: post\.post_likes\?\.\[0\]\?\.count \?\? 0, authorName: authorMap\.get\(post\.author_id\) \|\| "Usuario", author_id: post\.author_id, target_profile_id: post\.target_profile_id, targetName: name, commentsCount: \(post as any\)\.post_comments\?\.\[0\]\?\.count \|\| 0 \}\)\)\);'
profile_map_replacement = r'''setPosts(rows.map((post: any) => ({
      id: post.id,
      text: post.content ?? "",
      time: formatPostTime(post.created_at),
      likes: post.post_likes?.[0]?.count ?? 0,
      authorName: authorMap.get(post.author_id) || "Usuario",
      author_id: post.author_id,
      target_profile_id: post.target_profile_id,
      targetName: name,
      shared_post_id: post.shared_post_id,
      originalPost: post.original_post ? {
        text: post.original_post.content || "",
        authorName: post.original_post.profiles?.username || post.original_post.profiles?.full_name || "Usuario",
        time: formatPostTime(post.original_post.created_at),
        author_id: post.original_post.author_id
      } : undefined,
      commentsCount: post.post_comments?.[0]?.count || 0
    })));'''
content = re.sub(profile_map_regex, profile_map_replacement, content)


# Fix navigate in ProfileViewLegacy (need to pass navigate to it if missing, or use a dummy for now since we are in ProfileViewLegacy anyway)
# Actually ProfileViewLegacy does not have `navigate` prop. Let's add it.
legacy_def_regex = r'function ProfileViewLegacy\(\{ session, visitedUserId, goBack \}: \{ session: Session; visitedUserId\?: string; goBack\?: \(\) => void \}\) \{'
legacy_def_replacement = r'function ProfileViewLegacy({ session, visitedUserId, goBack, navigate }: { session: Session; visitedUserId?: string; goBack?: () => void; navigate: any }) {'
content = re.sub(legacy_def_regex, legacy_def_replacement, content)

profile_view_def_regex = r'function ProfileView\(\{ session, visitedUserId, goBack \}: \{ session: Session; visitedUserId\?: string; goBack\?: \(\) => void \}\) \{'
profile_view_def_replacement = r'function ProfileView({ session, visitedUserId, goBack, navigate }: { session: Session; visitedUserId?: string; goBack?: () => void; navigate: any }) {'
content = re.sub(profile_view_def_regex, profile_view_def_replacement, content)

profile_view_render_regex = r'<ProfileViewLegacy session=\{session\} visitedUserId=\{visitedUserId\} goBack=\{goBack\} />'
profile_view_render_replacement = r'<ProfileViewLegacy session={session} visitedUserId={visitedUserId} goBack={goBack} navigate={navigate} />'
content = re.sub(profile_view_render_regex, profile_view_render_replacement, content)

# And in Feed where ProfileView is called
feed_render_regex = r'<ProfileView session=\{session\} visitedUserId=\{currentRoute\.params\?\.userId\} goBack=\{history\.length > 1 \? goBack : undefined\} />'
feed_render_replacement = r'<ProfileView session={session} visitedUserId={currentRoute.params?.userId} goBack={history.length > 1 ? goBack : undefined} navigate={navigate} />'
content = re.sub(feed_render_regex, feed_render_replacement, content)

with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
