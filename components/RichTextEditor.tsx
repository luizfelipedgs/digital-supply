"use client";

import { useEffect, useRef } from "react";

// Editor de texto rico simples, baseado em contentEditable.
// Guarda o conteúdo como HTML (lido via ref no momento de salvar, não a cada
// tecla — isso evita o cursor "pular" durante a digitação, um problema clássico
// de contentEditable controlado).

const FONT_SIZES = [
  { execValue: "2", label: "Pequeno" },
  { execValue: "3", label: "Normal" },
  { execValue: "5", label: "Grande" },
  { execValue: "7", label: "Título" },
];

// execCommand('fontSize') gera <font size="N">, que é uma tag antiga.
// Convertendo pra <span style="font-size:..."> na hora de salvar, fica mais
// portável e consistente com o resto do CSS do site.
const SIZE_PX: Record<string, string> = { "1": "12px", "2": "13px", "3": "15px", "4": "17px", "5": "20px", "6": "26px", "7": "32px" };

function sanitizeAndNormalize(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  container.querySelectorAll("font[size]").forEach((el) => {
    const size = el.getAttribute("size") ?? "3";
    const span = document.createElement("span");
    span.style.fontSize = SIZE_PX[size] ?? "15px";
    span.innerHTML = el.innerHTML;
    el.replaceWith(span);
  });

  // Remove atributos de evento (onclick etc.) e hrefs perigosos — sanitização básica,
  // suficiente aqui porque só admins escrevem esse conteúdo.
  container.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
      if (attr.name === "href" && attr.value.trim().toLowerCase().startsWith("javascript:")) {
        el.removeAttribute("href");
      }
    });
  });

  return container.innerHTML;
}

export function RichTextEditor({
  initialValue,
  onSave,
}: {
  initialValue: string;
  onSave: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = initialValue || "";
      initialized.current = true;
    }
  }, [initialValue]);

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    flush();
  }

  function applyFontSize(execValue: string) {
    editorRef.current?.focus();
    document.execCommand("fontSize", false, execValue);
    flush();
  }

  function applyLink() {
    const url = window.prompt("Cole a URL do link:");
    if (!url) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, url);
    flush();
  }

  function flush() {
    if (editorRef.current) {
      onSave(sanitizeAndNormalize(editorRef.current.innerHTML));
    }
  }

  const btnClass =
    "px-2.5 py-1.5 text-xs rounded border border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10 transition-colors";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        <select
          className={btnClass}
          onChange={(e) => e.target.value && applyFontSize(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Tamanho
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.execValue} value={s.execValue}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className={btnClass} style={{ fontWeight: 700 }} onClick={() => exec("bold")}>
          N
        </button>
        <button type="button" className={btnClass} style={{ fontStyle: "italic" }} onClick={() => exec("italic")}>
          I
        </button>
        <button type="button" className={btnClass} style={{ textDecoration: "underline" }} onClick={() => exec("underline")}>
          S
        </button>
        <button type="button" className={btnClass} onClick={() => exec("formatBlock", "blockquote")}>
          " Citação
        </button>
        <button type="button" className={btnClass} onClick={applyLink}>
          🔗 Link
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onBlur={flush}
        className="dgs-input min-h-[180px] leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-brand/50 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-400 [&_blockquote]:italic [&_a]:text-brand [&_a]:underline"
        style={{ whiteSpace: "pre-wrap" }}
      />
      <p className="text-neutral-600 text-xs">
        Selecione um trecho de texto pra aplicar formatação. O conteúdo é salvo automaticamente ao sair do campo.
      </p>
    </div>
  );
}
