import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

# We need to insert a component `PostMedia` that renders the media_data and poll_id
post_media_component = """
function PostMedia({ media, pollId, session }: { media?: any, pollId?: string, session: Session }) {
    if (!media && !pollId) return null;

    if (media?.type === "photo") {
        return <img src={media.url} alt="Post media" style={{width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 500, objectFit: 'contain', background: '#000'}} />;
    }
    
    if (media?.type === "video") {
        return <video src={media.url} controls style={{width: '100%', borderRadius: 8, marginTop: 12, maxHeight: 500, background: '#000'}} />;
    }
    
    if (media?.type === "news") {
        return (
            <a href={media.url} target="_blank" rel="noopener noreferrer" style={{display: 'block', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 12}}>
                <div style={{padding: 16, background: 'var(--panel-bg)'}}>
                    <strong style={{display: 'block', fontSize: '1.1em', marginBottom: 4}}>{media.title || media.url}</strong>
                    <span style={{color: 'var(--primary)', fontSize: '0.9em'}}>{new URL(media.url).hostname}</span>
                </div>
            </a>
        );
    }
    
    if (media?.type === "youtube_video") {
        return (
            <div style={{marginTop: 12, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8}}>
                <iframe src={`https://www.youtube.com/embed/${media.youtube_id}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}></iframe>
            </div>
        );
    }
    
    if (media?.type === "youtube_playlist") {
        return (
            <div style={{marginTop: 12, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8}}>
                <iframe src={`https://www.youtube.com/embed/videoseries?list=${media.youtube_id}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}></iframe>
            </div>
        );
    }
    
    if (pollId) {
        return <PollView pollId={pollId} session={session} />;
    }

    return null;
}

function PollView({ pollId, session }: { pollId: string, session: Session }) {
    const [options, setOptions] = useState<any[]>([]);
    const [votes, setVotes] = useState<any[]>([]);
    const [hasVoted, setHasVoted] = useState(false);
    
    useEffect(() => {
        let cancelled = false;
        async function load() {
            const { data: opts } = await supabase.from("poll_options").select("*").eq("poll_id", pollId).order("order_index");
            if (cancelled || !opts) return;
            setOptions(opts);
            
            const { data: vts } = await supabase.from("poll_votes").select("*, poll_options!inner(poll_id)").eq("poll_options.poll_id", pollId);
            if (!cancelled && vts) {
                setVotes(vts);
                setHasVoted(vts.some(v => v.user_id === session.user.id));
            }
        }
        load();
        return () => { cancelled = true; };
    }, [pollId, session.user.id]);
    
    const handleVote = async (optionId: string) => {
        if (hasVoted) return;
        const { error } = await supabase.from("poll_votes").insert({ poll_option_id: optionId, user_id: session.user.id });
        if (!error) {
            setVotes([...votes, { poll_option_id: optionId, user_id: session.user.id }]);
            setHasVoted(true);
        }
    };
    
    if (options.length === 0) return null;
    
    const totalVotes = votes.length;
    
    return (
        <div style={{border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {options.map(opt => {
                    const optVotes = votes.filter(v => v.poll_option_id === opt.id).length;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                    
                    return (
                        <div key={opt.id} style={{position: 'relative', overflow: 'hidden', borderRadius: 6, border: '1px solid var(--border)', cursor: hasVoted ? 'default' : 'pointer'}} onClick={() => handleVote(opt.id)}>
                            {hasVoted && (
                                <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, width: `${percent}%`, background: 'var(--primary)', opacity: 0.2}} />
                            )}
                            <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px 12px', position: 'relative', zIndex: 1}}>
                                <span>{opt.text}</span>
                                {hasVoted && <span style={{fontWeight: 'bold'}}>{percent}%</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div style={{marginTop: 12, fontSize: '0.85em', color: 'var(--text)', opacity: 0.7}}>
                {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
            </div>
        </div>
    );
}

"""

# Insert components before Feed
feed_idx = content.find("function Feed(")
content = content[:feed_idx] + post_media_component + content[feed_idx:]

# Now replace post content rendering in Feed and ProfileView
# In Feed: 
# <p className="post-content">{post.text}</p>
# In ProfileView:
# <p className="post-content">{post.text}</p>

content = content.replace(
    '<p className="post-content">{post.text}</p>',
    '<p className="post-content">{post.text}</p><PostMedia media={post.media_data} pollId={post.poll_id} session={session} />'
)


with open('src/main.tsx', 'w') as f:
    f.write(content)

print("Feed updated")
