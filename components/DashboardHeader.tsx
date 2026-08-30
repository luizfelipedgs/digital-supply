"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

type Announcement = { id: string; title: string; body: string | null; created_at: string };

export function DashboardHeader({
  backHref,
  backLabel = "Voltar",
  left,
  extraRight,
}: {
  backHref?: string;
  backLabel?: string;
  left?: React.ReactNode;
  extraRight?: React.ReactNode;
}) {
  const supabase = createClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, full_name, avatar_path")
        .eq("id", userData.user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname || profile.full_name || null);
        if (profile.avatar_path) {
          const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_path);
          setAvatarUrl(data.publicUrl);
        }
      }

      const { data: ann } = await supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnnouncements(ann ?? []);

      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", userData.user.id);
      setReadIds(new Set((reads ?? []).map((r) => r.announcement_id)));
    }
    load();
  }, [supabase]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function openPanel() {
    setOpen((v) => !v);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user || announcements.length === 0) return;
    const unread = announcements.filter((a) => !readIds.has(a.id));
    if (unread.length === 0) return;
    await supabase
      .from("announcement_reads")
      .upsert(unread.map((a) => ({ user_id: userData.user!.id, announcement_id: a.id })));
    setReadIds(new Set(announcements.map((a) => a.id)));
  }

  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length;

  function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diffMs / 86400000);
    if (days === 0) return "hoje";
    if (days === 1) return "ontem";
    return `há ${days} dias`;
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {left ? (
        left
      ) : backHref ? (
        <Link href={backHref} className="text-neutral-500 text-sm no-underline hover:text-neutral-300 transition-colors">
          ← {backLabel}
        </Link>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        {extraRight}
        <div className="relative" ref={popRef}>
          <button
            onClick={openPanel}
            className="relative w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            aria-label="Notificações"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/70">
              <path
                d="M12 3a6 6 0 00-6 6v3.5c0 .6-.2 1.2-.6 1.6L4 15.5c-.6.7-.1 1.8.8 1.8h14.4c.9 0 1.4-1.1.8-1.8l-1.4-1.4c-.4-.4-.6-1-.6-1.6V9a6 6 0 00-6-6z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand text-[9px] text-ink-950 font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-ink-800 shadow-2xl z-50">
              <div className="px-4 py-3 border-b border-white/10 text-neutral-100 text-sm font-medium">Avisos</div>
              {announcements.length === 0 ? (
                <div className="px-4 py-6 text-neutral-600 text-xs text-center">Nenhum aviso por enquanto.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                    <div className="text-neutral-200 text-sm mb-1">{a.title}</div>
                    {a.body && <div className="text-neutral-500 text-xs leading-relaxed mb-1">{a.body}</div>}
                    <div className="text-neutral-600 text-[10px]">{timeAgo(a.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Link href="/dashboard/perfil" className="block no-underline">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/10 border border-white/10 flex items-center justify-center text-brand text-xs font-medium">
              {(nickname ?? "A").charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
