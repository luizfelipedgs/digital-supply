"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LineIcon } from "@/components/LineIcon";

export function MarkCompleteButton({
  lessonId,
  initiallyCompleted,
}: {
  lessonId: string;
  initiallyCompleted: boolean;
}) {
  const supabase = createClient();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (completed) {
      await supabase
        .from("lesson_progress")
        .delete()
        .eq("user_id", userData.user.id)
        .eq("lesson_id", lessonId);
      setCompleted(false);
    } else {
      await supabase.from("lesson_progress").insert({ user_id: userData.user.id, lesson_id: lessonId });
      setCompleted(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm rounded-lg px-4 py-2 border transition-colors flex items-center justify-center gap-1.5 ${
        completed
          ? "bg-brand/10 border-brand/30 text-brand"
          : "bg-white/[0.03] border-white/10 text-neutral-300"
      }`}
    >
      {completed ? (
        <>
          <LineIcon name="check" size={14} /> Aula concluída
        </>
      ) : (
        "Marcar como concluída"
      )}
    </button>
  );
}
