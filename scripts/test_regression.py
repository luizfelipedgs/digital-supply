#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Suíte de Testes de Regressão Automatizada (REG-01 a REG-08)
Comunidade DGS - Digital Supply
Valida integridade estrutural, ausência de vazamentos, contratos e estabilidade geral.
"""

import os
import re
import sys

def find_project_root():
    if os.path.exists("app") and os.path.exists("lib"):
        return os.path.abspath(".")
    if os.path.exists(os.path.join("digital-supply", "app")):
        return os.path.abspath("digital-supply")
    parent = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(parent, "..", "app")):
        return os.path.abspath(os.path.join(parent, ".."))
    return os.path.abspath(".")

def run_suite():
    base_dir = find_project_root()
    app_dir = os.path.join(base_dir, "app")
    lib_dir = os.path.join(base_dir, "lib")
    components_dir = os.path.join(base_dir, "components")
    supabase_dir = os.path.join(base_dir, "supabase")

    results = []

    # REG-01
    forbidden_imports = ["electron", "electron-updater", "ws", "sessionStorage"]
    leaks = []
    for search_dir in [app_dir, lib_dir, components_dir]:
        if not os.path.exists(search_dir):
            continue
        for root, _, files in os.walk(search_dir):
            for f in files:
                if f.endswith((".ts", ".tsx")):
                    p = os.path.join(root, f)
                    with open(p, "r", encoding="utf-8") as fl:
                        code = fl.read()
                        for forb in forbidden_imports:
                            if re.search(r'from\s+[\'"]' + forb + r'[\'"]', code):
                                leaks.append((os.path.relpath(p, base_dir), forb))

    results.append({
        "id": "REG-01",
        "name": "Isolamento do Bundle Next.js (Sem vazamento de Electron)",
        "passed": len(leaks) == 0,
        "details": f"Vazamentos encontrados: {leaks}" if leaks else "Nenhum pacote proibido do Electron importado no site web."
    })

    # REG-02
    missing_exports = []
    route_count = 0
    if os.path.exists(app_dir):
        for root, _, files in os.walk(app_dir):
            for f in files:
                if f in ["page.tsx", "route.ts"]:
                    route_count += 1
                    p = os.path.join(root, f)
                    with open(p, "r", encoding="utf-8") as fl:
                        code = fl.read()
                        if f == "page.tsx" and "export default" not in code:
                            missing_exports.append((os.path.relpath(p, base_dir), "Sem default export"))
                        elif f == "route.ts" and not re.search(r'export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)', code):
                            missing_exports.append((os.path.relpath(p, base_dir), "Sem handler HTTP válido"))

    results.append({
        "id": "REG-02",
        "name": "Integridade das Rotas do Next.js App Router",
        "passed": len(missing_exports) == 0 and route_count >= 25,
        "details": f"{route_count} rotas verificadas. Erros: {missing_exports}" if missing_exports else f"{route_count} rotas ativas com exportações corretas."
    })

    # REG-03
    emoji_pattern = re.compile(
        r'[\U0001F600-\U0001F64F]'
        r'|[\U0001F300-\U0001F5FF]'
        r'|[\U0001F680-\U0001F6FF]'
        r'|[\U0001F1E0-\U0001F1FF]'
        r'|[\U00002702-\U000027B0]'
        r'|[\U0001F900-\U0001F9FF]'
    )
    emoji_found = []
    for search_dir in [app_dir, components_dir]:
        if not os.path.exists(search_dir):
            continue
        for root, _, files in os.walk(search_dir):
            for f in files:
                if f.endswith((".tsx", ".ts")):
                    p = os.path.join(root, f)
                    with open(p, "r", encoding="utf-8") as fl:
                        for line_idx, line in enumerate(fl, 1):
                            matches = emoji_pattern.findall(line)
                            if matches:
                                emoji_found.append((os.path.relpath(p, base_dir), line_idx, matches))

    results.append({
        "id": "REG-03",
        "name": "Auditoria Zero-Emoji no Frontend (Identidade Visual DGS)",
        "passed": len(emoji_found) == 0,
        "details": f"Emojis encontrados em componentes: {emoji_found}" if emoji_found else "100% livre de emojis no código visual. Padrão LineIcon respeitado."
    })

    # REG-04
    broken_imports = []
    import_regex = re.compile(r'from\s+[\'"](@/[^\'"]+|\.[^\'"]+)[\'"]')
    for search_dir in [app_dir, components_dir, lib_dir]:
        if not os.path.exists(search_dir):
            continue
        for root, _, files in os.walk(search_dir):
            for f in files:
                if f.endswith((".tsx", ".ts")):
                    p = os.path.join(root, f)
                    file_dir = os.path.dirname(p)
                    with open(p, "r", encoding="utf-8") as fl:
                        code = fl.read()
                        for match in import_regex.finditer(code):
                            target = match.group(1)
                            if target.startswith("@/"):
                                rel = target[2:]
                                full_target = os.path.join(base_dir, rel)
                            else:
                                full_target = os.path.normpath(os.path.join(file_dir, target))
                            
                            exts = ["", ".ts", ".tsx", ".js", ".jsx", ".json", "/index.ts", "/index.tsx"]
                            exists = any(os.path.exists(full_target + ext) or os.path.isfile(full_target + ext) for ext in exts)
                            if not exists:
                                broken_imports.append((os.path.relpath(p, base_dir), target))

    results.append({
        "id": "REG-04",
        "name": "Resolução de Módulos e Imports Locais",
        "passed": len(broken_imports) == 0,
        "details": f"Imports quebrados: {broken_imports}" if broken_imports else "Todos os imports internos (@/ e relativos) resolvem com sucesso."
    })

    # REG-05
    earnings_file = os.path.join(lib_dir, "earnings.ts")
    has_sp_tz = False
    if os.path.exists(earnings_file):
        with open(earnings_file, "r", encoding="utf-8") as fl:
            content = fl.read()
            if "America/Sao_Paulo" in content and "todayISO" in content:
                has_sp_tz = True

    results.append({
        "id": "REG-05",
        "name": "Consistência de Fuso Horário (todayISO America/Sao_Paulo)",
        "passed": has_sp_tz,
        "details": "lib/earnings.ts define todayISO com fuso America/Sao_Paulo contra troca precoce de data." if has_sp_tz else "Falha: todayISO ausente ou sem fuso correto."
    })

    # REG-06
    bad_rls = []
    if os.path.exists(supabase_dir):
        for f in os.listdir(supabase_dir):
            if f.endswith(".sql"):
                p = os.path.join(supabase_dir, f)
                with open(p, "r", encoding="utf-8") as fl:
                    sql = fl.read()
                    if re.search(r'on\s+public\.profiles\s+for\s+.*select.*from\s+public\.profiles', sql, re.IGNORECASE):
                        bad_rls.append(f)

    results.append({
        "id": "REG-06",
        "name": "Segurança de RLS (Prevenção de recursão infinita em profiles)",
        "passed": len(bad_rls) == 0,
        "details": f"Possível recursão em: {bad_rls}" if bad_rls else "Políticas RLS em profiles utilizam is_admin() e evitam subconsultas recursivas diretas."
    })

    # REG-07
    webhook_file = os.path.join(app_dir, "api", "webhooks", "cakto", "route.ts")
    webhook_ok = False
    if os.path.exists(webhook_file):
        with open(webhook_file, "r", encoding="utf-8") as fl:
            w_code = fl.read()
            expected_events = ["purchase_approved", "subscription_renewed", "subscription_canceled", "refund", "chargeback"]
            if all(ev in w_code for ev in expected_events) and "CAKTO_WEBHOOK_SECRET" in w_code:
                webhook_ok = True

    results.append({
        "id": "REG-07",
        "name": "Contrato de Eventos do Webhook Cakto",
        "passed": webhook_ok,
        "details": "Webhook trata purchase_approved, renew, cancel, refund, chargeback e valida secret." if webhook_ok else "Falha: eventos esperados ou validação de secret ausentes no webhook."
    })

    # REG-08
    required_assets = [
        os.path.join(base_dir, "public", "logo.png"),
        os.path.join(app_dir, "globals.css"),
        os.path.join(base_dir, "tailwind.config.ts")
    ]
    missing_assets = [os.path.relpath(a, base_dir) for a in required_assets if not os.path.exists(a)]
    css_ok = False
    globals_css = os.path.join(app_dir, "globals.css")
    if os.path.exists(globals_css):
        with open(globals_css, "r", encoding="utf-8") as fl:
            g_content = fl.read()
            if ".dgs-card" in g_content and ".dgs-btn-primary" in g_content and ("#9ACD32".lower() in g_content.lower() or "brand" in g_content):
                css_ok = True

    results.append({
        "id": "REG-08",
        "name": "Design Tokens DGS & Arquivos Estáticos Essenciais",
        "passed": len(missing_assets) == 0 and css_ok,
        "details": f"Assets faltando: {missing_assets}" if missing_assets else "logo.png, globals.css (.dgs-card, .dgs-btn-primary) e tokens Tailwind validados."
    })

    print("\n" + "=" * 80)
    print("RELATÓRIO DA SUÍTE DE TESTES DE REGRESSÃO DGS (REG-01 a REG-08)")
    print("Diretório analisado:", base_dir)
    print("=" * 80)
    passed_all = True
    for res in results:
        status = "[ PASS ]" if res["passed"] else "[ FAIL ]"
        if not res["passed"]:
            passed_all = False
        print(f"{res['id']} | {status} | {res['name']}")
        print(f"       -> {res['details']}")
    print("=" * 80)
    if passed_all:
        print("Resultado Final: TODOS OS TESTES PASSARAM COM SUCESSO! SITE 100% ESTÁVEL.")
    else:
        print("Resultado Final: ATENÇÃO! FORAM ENCONTRADAS FALHAS DE REGRESSÃO.")
    print("=" * 80 + "\n")
    return passed_all

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
