import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { YoutubePlaylist } from "../../YoutubePlaylist";
import { SingleSongPlayer } from "../../components/SingleSongPlayer";

const BG_GRADIENTS: Record<string, string> = {
  note: "linear-gradient(135deg,#fef9c3,#fde68a)",
  ocean: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
  sunset: "linear-gradient(135deg,#fb923c,#ef4444)",
  purple: "linear-gradient(135deg,#a78bfa,#7c3aed)",
  forest: "linear-gradient(135deg,#34d399,#059669)",
  slate: "linear-gradient(135deg,#64748b,#1e293b)",
};

function formatEventDate(date?: string, time?: string) {
  if (!date) return "";
  try {
    const value = new Date(time ? `${date}T${time}` : `${date}T00:00`);
    let output = value.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    if (time) output += ` · ${time}`;
    return output;
  } catch {
    return date;
  }
}

type Props = {
  media?: any;
  pollId?: string;
  session: Session;
  text?: string;
};

export function PostMedia({ media, pollId, session, text }: Props) {
  if (!media && !pollId) return null;

  if (media?.type === "photo") {
    return <div style={{ width: "100%", marginTop: 10, maxHeight: 460, overflow: "hidden", background: "#eef2f6" }}><img src={media.url} alt="Post media" style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block" }} /></div>;
  }

  if (media?.type === "video") {
    return <div style={{ width: "100%", borderRadius: 8, marginTop: 12, maxHeight: 500, overflow: "hidden", background: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}><video src={media.url} controls style={{ maxWidth: "100%", maxHeight: 500 }} /></div>;
  }

  if (media?.type === "youtube_video" || media?.type === "youtube_song") {
    return <SingleSongPlayer media={{ ...media, youtube_id: media.youtube_id || media.video_id }} />;
  }

  if (media?.type === "youtube_playlist") {
    return <YoutubePlaylist media={media} />;
  }

  if (media?.type === "news") {
    return <a href={media.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginTop: 12 }}><div style={{ padding: 16, background: "var(--panel-bg)" }}><strong style={{ display: "block", fontSize: "1.1em", marginBottom: 4 }}>{media.title || media.url}</strong><span style={{ color: "var(--primary)", fontSize: "0.9em" }}>{new URL(media.url).hostname}</span></div></a>;
  }

  if (media?.type === "event") {
    return <div style={{ border: "1px solid var(--border)", borderRadius: 8, marginTop: 12, overflow: "hidden" }}><div style={{ background: "var(--primary)", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}><Calendar size={16} /><strong>Evento</strong></div><div style={{ padding: 16 }}>{text && <div style={{ fontWeight: 600, marginBottom: 6 }}>{text}</div>}<div style={{ fontSize: "0.9em", color: "var(--text)" }}>{formatEventDate(media.date, media.time)}</div>{media.location && <div style={{ fontSize: "0.85em", marginTop: 4, opacity: 0.8 }}>📍 {media.location}</div>}</div></div>;
  }

  if (media?.type === "location") {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(media.name)}`;
    return <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none", color: "inherit" }}><MapPin size={18} style={{ color: "var(--primary)" }} /><span>{media.name}</span></a>;
  }

  if (media?.type === "background") {
    return <div style={{ minHeight: 160, borderRadius: 10, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, color: "#fff", fontSize: "1.4em", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.25)", background: BG_GRADIENTS[media.style] || BG_GRADIENTS.note, wordBreak: "break-word" }}>{text}</div>;
  }

  if (pollId) return <PollView pollId={pollId} session={session} />;
  return null;
}

function PollView({ pollId, session }: { pollId: string; session: Session }) {
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: opts } = await supabase.from("poll_options").select("*").eq("poll_id", pollId).order("order_index");
      if (cancelled || !opts) return;
      setOptions(opts);
      const { data: voteRows } = await supabase.from("poll_votes").select("*, poll_options!inner(poll_id)").eq("poll_options.poll_id", pollId);
      if (!cancelled && voteRows) {
        setVotes(voteRows);
        setHasVoted(voteRows.some((vote) => vote.user_id === session.user.id));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [pollId, session.user.id]);

  async function handleVote(optionId: string) {
    if (hasVoted) return;
    const { error } = await supabase.from("poll_votes").insert({ poll_option_id: optionId, user_id: session.user.id });
    if (!error) {
      setVotes((current) => [...current, { poll_option_id: optionId, user_id: session.user.id }]);
      setHasVoted(true);
    }
  }

  if (options.length === 0) return null;
  const totalVotes = votes.length;

  return <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, marginTop: 12 }}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{options.map((option) => { const optionVotes = votes.filter((vote) => vote.poll_option_id === option.id).length; const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0; return <div key={option.id} style={{ position: "relative", overflow: "hidden", borderRadius: 6, border: "1px solid var(--border)", cursor: hasVoted ? "default" : "pointer" }} onClick={() => void handleVote(option.id)}>{hasVoted && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${percent}%`, background: "var(--primary)", opacity: 0.2 }} />}<div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", position: "relative", zIndex: 1 }}><span>{option.text}</span>{hasVoted && <span style={{ fontWeight: "bold" }}>{percent}%</span>}</div></div>; })}</div><div style={{ marginTop: 12, fontSize: "0.85em", color: "var(--text)", opacity: 0.7 }}>{totalVotes} voto{totalVotes !== 1 ? "s" : ""}</div></div>;
}
