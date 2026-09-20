"use client";

import { useEffect, useState } from "react";
import { LineIcon } from "@/components/LineIcon";

// Chave usada no localStorage do navegador pra guardar quais aulas do
// treinamento gratuito a pessoa já concluiu. Como a trilha é pública (sem
// login), não dá pra usar uma tabela como "lesson_progress" — o progresso
// fica salvo só no aparelho de quem está assistindo.
const STORAGE_KEY = "dgs_treinamento_progresso";

function readCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // localStorage bloqueado (aba anônima, config do navegador, etc.) — segue sem salvar
    return new Set();
  }
}

function writeCompleted(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // idem — se não der pra salvar, a pessoa só não vê o "concluída" na próxima visita
  }
}

// Selinho de "concluída" ao lado de cada aula na grade do /treinamento.
export function LessonCompletedBadge({ lessonId }: { lessonId: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(readCompleted().has(lessonId));
  }, [lessonId]);

  if (!done) return null;
  return (
    <span className="text-brand text-[11px] flex items-center gap-1 shrink-0">
      <LineIcon name="check" size={12} /> concluída
    </span>
  );
}

// Contador "X de Y aulas concluídas" no topo da grade.
export function TreinamentoProgressSummary({ total }: { total: number }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(readCompleted().size);
  }, []);

  if (count === null || total === 0) return null;
  return (
    <div className="text-neutral-500 text-xs mb-6">
      {count} de {total} aulas concluídas
    </div>
  );
}

// Botão de marcar/desmarcar aula concluída, na página de cada aula.
export function MarkTreinamentoComplete({ lessonId }: { lessonId: string }) {
  const [completed, setCompleted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCompleted(readCompleted().has(lessonId));
    setReady(true);
  }, [lessonId]);

  function toggle() {
    const ids = readCompleted();
    if (completed) {
      ids.delete(lessonId);
    } else {
      ids.add(lessonId);
    }
    writeCompleted(ids);
    setCompleted(!completed);
  }

  if (!ready) {
    // evita "flash" trocando de estado antes do localStorage ser lido
    return <div className="h-[38px]" />;
  }

  return (
    <button
      onClick={toggle}
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
