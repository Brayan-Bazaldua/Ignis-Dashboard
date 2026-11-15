# Usar Neon como base de datos (PostgreSQL administrada)

Neon aloja la base de datos. El frontend y la API deben ejecutarse en otro lugar (VM con Docker, etc.).

## 1. Obtener la cadena de conexión

1. En Neon: **Project → Connection Details**.
2. Copia la cadena PostgreSQL.
3. Para este backend (SQLAlchemy + psycopg), usa formato:
   `postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require`

## 2. Habilitar pgvector

En el **SQL Editor** de Neon ejecuta:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 3. Configurar entorno

```bash
cp .env.neon.example .env.neon
# edita .env.neon y pega DATABASE_URL y dominios
```

## 4. Levantar API + Web (sin DB local)

```bash
docker compose -f docker-compose.neon.yml --env-file .env.neon up -d --build
```

## 5. Verificar

```bash
docker compose -f docker-compose.neon.yml --env-file .env.neon ps
curl -I http://localhost:8000/docs
curl -I http://localhost:3000
```

## Notas

- `seed.py` se ejecuta al iniciar la API y cargará datos en Neon (asegúrate de que la base esté accesible).
- Si usas `neon init` en la raíz, puede crear `neon.ts`/archivos de config; para este proyecto la conexión directa por `DATABASE_URL` es suficiente.
- No compartas `DATABASE_URL` ni credenciales.
