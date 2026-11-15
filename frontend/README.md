# IGNIS · Frontend

Interfaz bilingüe (ES/EN) de IGNIS, construida con Next.js 16, React 19, Tailwind CSS 4 y next-intl.

## Desarrollo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. El locale por defecto es `es`; las rutas son `/es/...` y `/en/...`.

Crea `.env.local` para apuntar al backend:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
API_URL=http://127.0.0.1:8000
```

## Verificación

```bash
npm run lint
npm run build
```

La documentación completa del proyecto, la arquitectura y las instrucciones de datos están en el [`README.md`](../README.md) de la raíz.
