# Despliegue en plataforma (Vercel + Render) sin GitHub

Esta guia despliega el frontend en Vercel y la API en Render, usando Neon como base de datos.
No requiere GitHub: se despliega desde la carpeta local con CLI.

## 0. Requisitos
- Cuenta en Vercel (gratis): https://vercel.com/signup
- Cuenta en Render (gratis): https://render.com/register
- Base de datos Neon ya configurada (ver NEON_DEPLOY.md)
- Docker Desktop en ejecucion (para probar localmente)

## 1. Desplegar la API en Render (Docker)

### Opcion A: Desde el dashboard de Render
1. Ve a https://dashboard.render.com/new/web-service
2. Selecciona "Existing Image" o "Build from Dockerfile"
3. Si usas Dockerfile: conecta tu repo o sube la imagen.
   - Dockerfile path: `backend/Dockerfile`
   - Docker context: `backend/`
4. Configura variables de entorno:
   - `DATABASE_URL` = tu cadena de Neon (postgresql+psycopg://...)
   - `CORS_ORIGINS` = https://tu-frontend.vercel.app
   - `LLM_PROVIDER` = mock
   - `PORT` = 8000
5. Health check path: `/api/health`
6. Deploy. Anota la URL (ej: https://ignis-api.onrender.com)

### Opcion B: Desde CLI (render-cli)
```bash
npm i -g @render/cli
render login
render services create --type web --name ignis-api --dockerfile ./backend/Dockerfile --docker-context ./backend
```

## 2. Desplegar el frontend en Vercel

### Desde CLI:
```bash
cd frontend
npm i -g vercel
vercel login
vercel --prod
```

### Variables de entorno en Vercel:
- `NEXT_PUBLIC_API_URL` = https://ignis-api.onrender.com (URL de tu API en Render)
- `API_URL` = https://ignis-api.onrender.com

### Desde el dashboard:
1. Ve a https://vercel.com/new
2. Importa el proyecto (o usa "Deploy from CLI")
3. Root directory: `frontend`
4. Framework: Next.js
5. Agrega las variables de entorno anteriores.
6. Deploy.

## 3. Actualizar CORS en Render
Una vez que tengas la URL de Vercel (ej: https://ignis-dashboard.vercel.app):
- En Render, actualiza `CORS_ORIGINS` con esa URL.
- Redeploy la API.

## 4. Verificar
- Frontend: https://ignis-dashboard.vercel.app/es/metrics
- API: https://ignis-api.onrender.com/docs
- Metricas: https://ignis-dashboard.vercel.app/es/metrics

## Notas importantes
- Render free tier duerme la API despues de 15 min de inactividad. La primera peticion tardara ~30s en despertar.
- Vercel free tier tiene limites de build time y bandwidth, suficientes para demos.
- La base de datos Neon es gratuita y no duerme (en el free tier tiene limites de compute hours).
- Para AI Gateway (Neon), necesitas creditos en Neon Billing. Sin creditos, usa LLM_PROVIDER=mock.

## Archivos relevantes
- frontend/vercel.json - Configuracion de build para Vercel
- render.yaml - Configuracion de servicio para Render
- .env.neon.example - Variables de entorno para Neon
- docker-compose.neon.yml - Stack local con Neon (sin DB local)
