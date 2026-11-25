import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | Digital Supply - Central DGS",
  description: "Política de Privacidade e Proteção de Dados da Plataforma Digital Supply e aplicativo Central DGS.",
};

export default function PrivacidadePage() {
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
          Política de Privacidade da Central DGS
        </h1>
        <p className="text-gray-400 text-base">
          A <strong>Digital Supply</strong> e o software <strong>Central DGS</strong> valorizam a privacidade de seus usuários e alunos. Esta Política descreve de forma clara e transparente como coletamos, utilizamos e protegemos seus dados ao utilizar nossas ferramentas e integrações oficiais com a Meta (Instagram e Facebook).
        </p>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">1. Informações Coletadas</h2>
          <p>Ao conectar sua conta oficial através da Meta OAuth ou utilizar a Central DGS, coletamos exclusivamente os dados necessários para o funcionamento das ferramentas de postagem:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identificação básica:</strong> Nome do perfil, nome de usuário (@handle) e foto de perfil do Instagram / Facebook.</li>
            <li><strong>Tokens de Acesso da Meta:</strong> Tokens seguros gerados diretamente pelo Facebook para permitir a publicação de Reels e leitura de métricas da sua própria conta.</li>
            <li><strong>Métricas de Desempenho:</strong> Visualizações, curtidas, comentários e alcance de publicações efetuadas pela ferramenta para exibição no painel de relatórios do aluno.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">2. Finalidade do Uso dos Dados</h2>
          <p>Os dados coletados são utilizados estritamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Permitir o agendamento e a publicação automática e oficial de vídeos (Reels) nos perfis autorizados pelo próprio usuário.</li>
            <li>Exibir o histórico de postagens agendadas e relatórios de desempenho na Central DGS.</li>
            <li>Garantir a segurança e proteção das contas contra acessos não autorizados.</li>
          </ul>
          <p className="text-lime-400 font-medium">Nenhum dado é vendido, alugado ou compartilhado com terceiros para fins publicitários.</p>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">3. Armazenamento e Segurança</h2>
          <p>Todos os tokens e credenciais são transmitidos via conexões criptografadas (HTTPS/TLS) e armazenados em infraestrutura segura com regras rigorosas de controle de acesso (Row Level Security). O usuário tem controle total sobre quais perfis permanecem conectados.</p>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">4. Exclusão de Dados e Revogação de Acesso</h2>
          <p>O usuário pode a qualquer momento revogar o acesso da Central DGS ou solicitar a exclusão definitiva de seus dados:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Na própria Central DGS:</strong> Clicando em "Desconectar" ao lado da conta vinculada na aba Contas.</li>
            <li><strong>Pelo painel do Facebook/Meta:</strong> Em <em>Configurações e Privacidade &rarr; Aplicativos e Sites</em>, removendo o aplicativo <strong>Central DGS</strong>.</li>
            <li><strong>Por e-mail:</strong> Enviando uma solicitação formal para <span className="text-white font-mono">dgsluizfelipe@gmail.com</span>, que será processada em até 48 horas úteis.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <h2 className="text-lg font-bold text-white">5. Contato e Encarregado de Dados (DPO)</h2>
          <p>Para dúvidas, esclarecimentos ou exercício dos seus direitos de privacidade, entre em contato com nosso responsável de proteção de dados:</p>
          <p className="font-mono text-xs text-lime-400">
            Digital Supply Oficial<br />
            E-mail de Contato: dgsluizfelipe@gmail.com<br />
            Suporte: https://digitalsupply.pro
          </p>
        </section>
      </article>
    </main>
  );
}
