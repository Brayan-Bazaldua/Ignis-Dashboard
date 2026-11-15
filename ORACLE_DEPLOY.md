# Despliegue de IGNIS en Oracle Cloud Always Free (ARM64)

Esta guia despliega el stack completo (frontend, API, base de datos) en una VM ARM64 gratuita de Oracle Cloud, sin usar GitHub.

## 1. Crear la VM

1. Crea una cuenta en Oracle Cloud (Always Free).
2. Crea una instancia:
   - Shape: `VM.Standard.A1.Flex` (ARM)
   - OCPU: 2
   - Memoria: 12 GB
   - Imagen: Ubuntu 24.04 (aarch64)
   - Red: asigna IP publica
3. En Security List, abre los puertos:
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)

## 2. Preparar la VM

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin git curl
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3. Subir el proyecto

Desde tu maquina local (Windows PowerShell):

```powershell
scp -r C:\Users\dalej\Desktop\SpaceApps-Combustion ubuntu@IP_PUBLICA:/opt/ignis
```

O usa rsync si lo tienes disponible.

## 4. Configurar variables de entorno

En la VM:

```bash
cd /opt/ignis
cp .env.prod.example .env.prod
nano .env.prod
```

Completa al menos:

- `DOMAIN`
- `API_DOMAIN`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`

## 5. Construir imagenes ARM64

Las imagenes base (node, python, pgvector) soportan ARM64. Construye en la VM:

```bash
cd /opt/ignis
docker compose -f docker-compose.prod.yml --env-file .env.prod build
```

Si `cantera` falla en ARM64, usa la alternativa AMD64 de Google Cloud e2-micro.

## 6. Levantar el stack

```bash
chmod +x deploy.sh
./deploy.sh
```

Verifica:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
curl -I http://localhost:3000
curl -I http://localhost:8000/docs
```

## 7. HTTPS con Caddy

Instala Caddy (binario ARM64):

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Copia el `Caddyfile` del proyecto a `/etc/caddy/Caddyfile`, ajusta los dominios y recarga:

```bash
sudo systemctl reload caddy
```

## 8. Verificacion final

- https://ignis.tudominio.com/es/metrics
- https://ignis.tudominio.com/en/metrics
- https://ignis.tudominio.com/es/ummia
- https://api.tudominio.com/docs

## Notas

- Los datos persisten en el volumen Docker `ignis_pgdata_prod`.
- Para actualizar: sube los cambios y ejecuta `./deploy.sh`.
- Para backups de PostgreSQL:

```bash
docker exec ignis-db pg_dump -U ignis ignis > backup.sql
```

- Si Cantera no compila en ARM64, cambia a una VM AMD64 (Google Cloud e2-micro) o usa imagenes preconstruidas AMD64.
