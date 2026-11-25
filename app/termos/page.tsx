import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Termos de Uso | Digital Supply - Central DGS",
  description: "Termos de Uso e Condições Gerais do software Central DGS e da Comunidade Digital Supply.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#070709] text-gray-200 py-16 px-6 sm:px-12 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-white/10 pb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-lime-400 hover:underline flex items-center gap-1 font-medium">
          &larr; Voltar para Digital Supply
        </Link>
        <span className="text-xs text-gray-400 font-mono">Última atualização: 25 de Novembro de 2026</span>
      </div>

      <article className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-gray-300">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Termos de Serviço da Central DGS
        </h1>
        <p className="text-gray-400 text-base">
          Bem-vindo à <strong>Central DGS</strong>, ferramenta de automação e agendamento da <strong>Comunidade Digital Supply</strong>. Ao acessar nossa plataforma ou utilizar a Central DGS, você concorda expressamente com os seguintes termos e condições.
        </p>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">1. Objeto e Serviços</h2>
          <p>A Central DGS é uma plataforma tecnológica projetada para auxiliar criadores de conteúdo, afiliados e membros da comunidade a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Agendar e publicar vídeos originais em suas contas profissionais no Instagram e redes associadas.</li>
            <li>Consultar métricas de audiência oficiais fornecidas pelas plataformas via API oficial.</li>
            <li>Gerenciar bibliotecas de vídeos e fluxos de trabalho de clipagem de forma eficiente.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">2. Responsabilidade sobre Conteúdo e Diretrizes das Redes</h2>
          <p>O usuário é integralmente responsável pelos vídeos, textos, legendas e hashtags que escolhe publicar. O usuário compromete-se a respeitar rigorosamente os Termos de Serviço e as Diretrizes da Comunidade da Meta (Instagram/Facebook), abstendo-se de publicar conteúdos ilegais, difamatórios, fraudulentos ou que violem direitos autorais de terceiros.</p>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">3. Conexão Oficial e Acesso às APIs</h2>
          <p>A integração é realizada por meio das APIs Oficiais da Meta (Graph API v21.0). A Central DGS não solicita, não armazena e não tem acesso às senhas pessoais dos usuários do Facebook ou Instagram. O acesso é autenticado exclusivamente mediante tokens seguros concedidos pelo usuário durante o fluxo oficial de login.</p>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">4. Cancelamento e Encerramento</h2>
          <p>O usuário pode encerrar a utilização da ferramenta a qualquer instante, bastando desconectar suas contas através da Central DGS ou revogar as permissões diretamente na sua conta da Meta.</p>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">5. Contato e Suporte</h2>
          <p>Para dúvidas sobre estes Termos de Uso ou suporte técnico, entre em contato:</p>
          <p className="font-mono text-xs text-lime-400">
            Digital Supply<br />
            E-mail: dgsluizfelipe@gmail.com<br />
            Website: https://digitalsupply.pro
          </p>
        </section>
      </article>
    </main>
  );
}
