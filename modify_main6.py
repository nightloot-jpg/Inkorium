import re

with open('/app/src/main.tsx', 'r') as f:
    content = f.read()

feed_post_regex = r'<article className="post panel" key=\{post\.id\}>(.*?)</article>'
feed_post_replacement = r'''<article className="post panel" key={post.id}><div className="post-head"><UserLink userId={post.author_id} name={post.authorName || username} avatarUrl={undefined} navigate={navigate} />
          <div>
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
          <div className="post-actions" style={{position: "relative"}}><button onClick={() => toggleLike(post.id)} className={liked.includes(post.id) ? "is-liked" : ""}><Heart size={16} fill={liked.includes(post.id) ? "currentColor" : "none"} /> Me gusta</button><button onClick={() => setOpenComments(post.id === openComments ? null : post.id)}><MessageCircle size={16} /> Comentar {post.commentsCount ? `(${post.commentsCount})` : ''}</button><button onClick={() => setShareMenu(post.id === shareMenu ? null : post.id)}><Share2 size={16} /> Compartir</button><span style={{marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85em", color: "var(--text-light)"}}><Heart size={14} style={{display:"inline", verticalAlign:"middle", marginRight: 4, opacity: 0.7}} /> {post.likes}</span>
          {shareMenu === post.id && <ShareMenu post={post} session={session} onClose={() => setShareMenu(null)} />}
          </div>
          {openComments === post.id && <CommentsSection postId={post.id} session={session} navigate={navigate} />}
          </article>'''

# Replace in Feed
content = re.sub(feed_post_regex, feed_post_replacement, content, count=1, flags=re.DOTALL)

with open('/app/src/main.tsx', 'w') as f:
    f.write(content)
