# Traffic-Simulator-Frontend

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Frontend&metric=coverage)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Frontend)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Frontend&metric=alert_status)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Frontend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Frontend&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ARSW2026-JDC_Traffic-Simulator-Frontend&metric=security_rating)](https://sonarcloud.io/dashboard?id=ARSW2026-JDC_Traffic-Simulator-Frontend)

Interfaz de usuario para la aplicación de simulación de tráfico CUTS. Permite visualizar y controlar simulaciones en tiempo real mediante un mapa interactivo.

## Tecnologías

- **[React](https://react.dev/)** v18.2.0 - Biblioteca UI
- **[Vite](https://vitejs.dev/)** v5.0.8 - Build tool
- **[TypeScript](https://www.typescriptlang.org/)** v5.3.3 - Tipado
- **[TailwindCSS](https://tailwindcss.com/)** v3.4.0 - Estilos
- **[Leaflet](https://leafletjs.com/)** + **[react-leaflet](https://react-leaflet.js.org/)** - Mapas
- **[Zustand](https://zustand-demo.pmnd.rs/)** v4.4.7 - Estado global
- **[Socket.io Client](https://socket.io/)** v4.6.1 - WebSocket
- **[Firebase](https://firebase.google.com/)** v10.14.1 - Autenticación
- **[Axios](https://axios-http.com/)** v1.6.2 - HTTP client

## Prerrequisitos

- Node.js >= 18.x
- npm >= 9.x

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo (Puerto 5173)
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

## Tests

```bash
npm test           # Unit tests
npm run test:ui   # UI visual
npm run test:coverage  # Coverage
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_GATEWAY_URL` | URL del Gateway | `http://localhost:3000` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | - |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | - |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | - |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | - |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | - |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | - |

## Estructura

```
src/
├── components/     # Componentes React
├── hooks/         # Custom hooks
├── services/       # API calls
├── stores/         # Zustand stores
├── types/         # Tipos TypeScript
└── App.tsx        # Entry point
```