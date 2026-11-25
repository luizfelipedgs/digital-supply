# =============================================================================
# DIGITAL SUPPLY — INSTALADOR AUTOMATIZADO DO CLOUD WORKER 24H (VPS)
# =============================================================================
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   DIGITAL SUPPLY — INSTALADOR DO CLOUD DISPATCHER 24H (VPS)     " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Verificar ou Instalar Python 3.12 64-bit
$pythonExe = $null

$possiblePaths = @(
    "C:\Program Files\Python312\python.exe",
    "C:\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
)

foreach ($p in $possiblePaths) {
    if (Test-Path $p) {
        $pythonExe = $p
        break
    }
}

if (-not $pythonExe) {
    try {
        $wherePy = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        if ($wherePy) { $pythonExe = $wherePy }
    } catch {}
}

if (-not $pythonExe) {
    Write-Host "[1/4] Baixando Python 3.12 Oficial (python.org)..." -ForegroundColor Cyan
    $pyInstaller = "$env:TEMP\python-3.12.8-amd64.exe"
    $pyUrl = "https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe"
    
    (New-Object System.Net.WebClient).DownloadFile($pyUrl, $pyInstaller)
    
    Write-Host "[1/4] Instalando Python 3.12 silenciosamente no Windows Server..." -ForegroundColor Cyan
    $installProc = Start-Process -FilePath $pyInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1 Include_pip=1" -Wait -PassThru
    
    # Atualiza PATH da sessão
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    foreach ($p in $possiblePaths) {
        if (Test-Path $p) {
            $pythonExe = $p
            break
        }
    }
    if (-not $pythonExe) {
        $pythonExe = "C:\Program Files\Python312\python.exe"
    }
}

Write-Host "[+] Python detectado: $pythonExe" -ForegroundColor Green

# 2. Instalar dependências necessárias (httpx)
Write-Host "[2/4] Instalando bibliotecas HTTP do Cloud Worker..." -ForegroundColor Cyan
& $pythonExe -m pip install --upgrade pip httpx

# 3. Criar pasta e arquivo do Cloud Worker
$workDir = "C:\DGS_Cloud_Worker"
if (-not (Test-Path $workDir)) {
    New-Item -ItemType Directory -Path $workDir -Force | Out-Null
}

$workerCode = @'
"""
DIGITAL SUPPLY — CLOUD DISPATCHER WORKER 24H (VPS)
Executa de forma autonoma 24/7 na VPS Kamatera.
"""
import os
import sys
import time
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
import httpx

SUPABASE_URL = "https://oipbnfcahgmqiwpqhnvt.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcGJuZmNhaGdtcWl3cHFobnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjcxODMsImV4cCI6MjEwMzU0MzE4M30.bU2yDCbWICGcoxDucNOzjBi8H1iOUNPdCxeD-5BEWQs"
WORKER_SECRET = "dgs_cloud_worker_24h_secret_key_2026"

BASE_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache_videos")
os.makedirs(BASE_CACHE_DIR, exist_ok=True)

class DGSCloudWorker:
    def __init__(self):
        self.client = httpx.Client(timeout=60.0)

    def log(self, msg: str, level: str = "INFO"):
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now_str}] [{level}] {msg}", flush=True)

    def get_pending_posts(self):
        url = f"{SUPABASE_URL}/rest/v1/rpc/get_pending_cloud_posts"
        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {"p_secret": WORKER_SECRET}
        try:
            resp = self.client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                posts = resp.json()
                return posts if isinstance(posts, list) else []
            else:
                self.log(f"Erro ao consultar fila: {resp.status_code} - {resp.text}", "WARNING")
                return []
        except Exception as e:
            self.log(f"Erro de rede ao consultar fila: {str(e)}", "ERROR")
            return []

    def update_post_status(self, post_id: str, status: str, detail: str, published_url: str = None, media_id: str = None, error_msg: str = None):
        url = f"{SUPABASE_URL}/rest/v1/rpc/update_cloud_post_status"
        headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        payload = {
            "p_secret": WORKER_SECRET,
            "p_post_id": post_id,
            "p_status": status,
            "p_detail": detail,
            "p_published_url": published_url,
            "p_media_id": media_id,
            "p_error_message": error_msg
        }
        try:
            self.client.post(url, json=payload, headers=headers)
        except Exception as e:
            self.log(f"Erro ao atualizar status: {e}", "ERROR")

    def download_video_to_cache(self, storage_path: str, local_filename: str) -> str:
        local_path = os.path.join(BASE_CACHE_DIR, local_filename)
        if storage_path.startswith("http://") or storage_path.startswith("https://"):
            url = storage_path
        else:
            url = f"{SUPABASE_URL}/storage/v1/object/public/cloud-videos/{storage_path}"

        headers = {"apikey": SUPABASE_ANON_KEY}
        with httpx.stream("GET", url, headers=headers, timeout=180.0) as r:
            if r.status_code != 200:
                raise Exception(f"Erro ao baixar video do storage ({r.status_code}): {url}")
            with open(local_path, "wb") as f:
                for chunk in r.iter_bytes(chunk_size=65536):
                    f.write(chunk)
        return local_path

    def publish_instagram(self, post: dict, account: dict) -> dict:
        token = account.get("meta_access_token")
        ig_user_id = account.get("meta_account_id")
        if not token or not ig_user_id:
            return {"success": False, "error": "Credenciais Meta ausentes na conta"}

        storage_path = post.get("video_storage_path")
        local_name = f"{post['id']}_{post.get('video_filename', 'video.mp4')}"
        video_path = self.download_video_to_cache(storage_path, local_name)
        file_size = os.path.getsize(video_path)

        caption = post.get("caption") or ""
        hashtags = post.get("hashtags") or ""
        full_caption = f"{caption}\n\n{hashtags}".strip()

        # Step 1: Init resumable
        init_url = f"https://graph.facebook.com/v21.0/{ig_user_id}/media"
        init_payload = {
            "media_type": "REELS",
            "upload_type": "resumable",
            "caption": full_caption,
            "share_to_feed": True,
            "access_token": token
        }
        init_resp = self.client.post(init_url, data=init_payload)
        init_data = init_resp.json()
        if "error" in init_data:
            return {"success": False, "error": init_data["error"].get("message", "Erro container Meta")}

        container_id = init_data.get("id")
        upload_uri = init_data.get("uri")

        # Step 2: Upload bytes
        with open(video_path, "rb") as f:
            v_bytes = f.read()

        up_headers = {
            "Authorization": f"OAuth {token}",
            "offset": "0",
            "file_size": str(file_size),
            "Content-Type": "application/octet-stream"
        }
        up_resp = self.client.post(upload_uri, headers=up_headers, content=v_bytes, timeout=180.0)
        if up_resp.status_code not in (200, 201):
            return {"success": False, "error": f"Erro upload binario Meta: {up_resp.status_code}"}

        # Step 3: Polling
        for _ in range(40):
            time.sleep(3)
            chk_resp = self.client.get(f"https://graph.facebook.com/v21.0/{container_id}", params={"fields": "status_code", "access_token": token})
            code = chk_resp.json().get("status_code")
            if code == "FINISHED":
                break
            elif code in ("ERROR", "EXPIRED"):
                return {"success": False, "error": "Meta rejeitou o processamento do video"}

        # Step 4: Publish
        pub_resp = self.client.post(f"https://graph.facebook.com/v21.0/{ig_user_id}/media_publish", data={"creation_id": container_id, "access_token": token})
        pub_data = pub_resp.json()
        if "error" in pub_data:
            return {"success": False, "error": pub_data["error"].get("message", "Erro publish Meta")}

        media_id = pub_data.get("id")
        permalink = f"https://www.instagram.com/reel/{media_id}/"
        try:
            link_resp = self.client.get(f"https://graph.facebook.com/v21.0/{media_id}", params={"fields": "permalink", "access_token": token})
            permalink = link_resp.json().get("permalink", permalink)
        except Exception:
            pass

        try:
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass

        return {"success": True, "media_id": str(media_id), "url": permalink, "detail": "Publicado oficialmente via Nuvem DGS"}

    def publish_tiktok(self, post: dict, account: dict) -> dict:
        token = account.get("tiktok_access_token")
        if not token:
            return {"success": False, "error": "Token TikTok ausente na conta"}

        storage_path = post.get("video_storage_path")
        local_name = f"{post['id']}_{post.get('video_filename', 'video.mp4')}"
        video_path = self.download_video_to_cache(storage_path, local_name)
        file_size = os.path.getsize(video_path)

        caption = f"{post.get('caption', '')} {post.get('hashtags', '')}".strip()
        init_url = "https://open.tiktokapis.com/v2/post/publish/video/init/"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json; charset=UTF-8"}
        payload = {
            "post_info": {"title": caption[:2200], "privacy_level": "PUBLIC_TO_EVERYONE"},
            "source_info": {"source": "FILE_UPLOAD", "video_size": file_size, "chunk_size": file_size, "total_chunk_count": 1}
        }
        resp = self.client.post(init_url, json=payload, headers=headers)
        data = resp.json()
        if data.get("error", {}).get("code") != "ok":
            return {"success": False, "error": data.get("error", {}).get("message", "Erro init TikTok")}

        upload_url = data.get("data", {}).get("upload_url")
        publish_id = data.get("data", {}).get("publish_id")

        with open(video_path, "rb") as f:
            v_bytes = f.read()

        put_headers = {"Content-Type": "video/mp4", "Content-Range": f"bytes 0-{file_size - 1}/{file_size}"}
        put_resp = self.client.put(upload_url, headers=put_headers, content=v_bytes, timeout=180.0)
        if put_resp.status_code not in (200, 201):
            return {"success": False, "error": f"Erro upload PUT TikTok: {put_resp.status_code}"}

        try:
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass

        return {"success": True, "media_id": str(publish_id), "url": "https://www.tiktok.com", "detail": "Enviado ao TikTok via Nuvem DGS"}

    def run_loop(self):
        self.log("=================================================================", "INFO")
        self.log("   DIGITAL SUPPLY — CLOUD DISPATCHER WORKER 24H INICIADO         ", "INFO")
        self.log("=================================================================", "INFO")
        self.log("Conectado a nuvem Supabase com RPC autenticado 24/7.", "SUCCESS")

        while True:
            try:
                pending_posts = self.get_pending_posts()
                if pending_posts:
                    self.log(f"Encontrado(s) {len(pending_posts)} post(s) para disparo agora!", "INFO")
                    for post in pending_posts:
                        post_id = post["id"]
                        platform = post["platform"].lower()
                        account = post.get("cloud_social_accounts") or {}

                        self.log(f"Processando post #{post_id} ({platform})...", "INFO")
                        self.update_post_status(post_id, "uploading", "Processando envio pela Nuvem DGS...")

                        if platform == "instagram":
                            res = self.publish_instagram(post, account)
                        elif platform == "tiktok":
                            res = self.publish_tiktok(post, account)
                        else:
                            res = {"success": False, "error": f"Plataforma '{platform}' nao suportada"}

                        if res.get("success"):
                            self.update_post_status(
                                post_id=post_id,
                                status="published",
                                detail=res.get("detail", "Publicado com sucesso"),
                                published_url=res.get("url"),
                                media_id=res.get("media_id")
                            )
                            self.log(f"Post #{post_id} publicado com sucesso! Link: {res.get('url')}", "SUCCESS")
                        else:
                            err_msg = res.get("error", "Falha no envio")
                            self.update_post_status(
                                post_id=post_id,
                                status="failed",
                                detail=f"Erro de envio: {err_msg}",
                                error_msg=err_msg
                            )
                            self.log(f"Falha ao enviar post #{post_id}: {err_msg}", "ERROR")

            except Exception as e:
                self.log(f"Excecao no ciclo do Cloud Worker: {str(e)}", "ERROR")

            time.sleep(20)

if __name__ == "__main__":
    worker = DGSCloudWorker()
    worker.run_loop()
'@

$workerPath = "$workDir\cloud_worker.py"
[System.IO.File]::WriteAllText($workerPath, $workerCode, [System.Text.Encoding]::UTF8)
Write-Host "[3/4] Arquivo do Cloud Worker gravado em: $workerPath" -ForegroundColor Green

# 4. Criar inicializador em lote (.bat)
$batPath = "$workDir\iniciar_worker.bat"
$batContent = @"
@echo off
title DGS Cloud Worker 24H - Digital Supply
cd /d "$workDir"
"$pythonExe" cloud_worker.py
pause
"@
[System.IO.File]::WriteAllText($batPath, $batContent, [System.Text.Encoding]::ASCII)

# 5. Criar Tarefa Agendada no Windows para reiniciar automaticamente no boot 24/7
try {
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName "DGS_Cloud_Worker_24H" -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
    Write-Host "[4/4] Tarefa Agendada 24/7 configurada com sucesso para inicializar com o Windows!" -ForegroundColor Green
} catch {
    Write-Host "[!] Aviso ao registrar tarefa agendada: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   INSTALACAO CONCLUIDA COM SUCESSO! INICIANDO WORKER AGORA...   " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Iniciar o worker agora mesmo em uma janela visivel
Start-Process -FilePath "cmd.exe" -ArgumentList "/k `"$batPath`""
