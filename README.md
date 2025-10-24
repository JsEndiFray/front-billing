
# Proyecto Facturas

Este es un sistema de facturación desarrollado con **Angular 19+** para el frontend. El backend está en desarrollado y haciendo modificaciones, y la arquitectura está preparada para consumir una API RESTful.

## Características principales

- Gestión de empleados, usuarios, clientes, propietarios, inmuebles y facturas.
- Seguridad con interceptor de tokens.
- Manejo de errores centralizado con interceptor.
- Interfaces claras para cada entidad.
- Navegación protegida con guardas (guards).

## Estructura del proyecto

```
src/
│
├── app/
│   ├── core/                  # Interceptores y guards
│   ├── interface/             # Definiciones de tipos e interfaces (clients, owners, users, etc.)
│   ├── pages/                 # Componentes de vistas (por entidad)
│   ├──shared/                 # Componentes header y footer
│   ├── services/              # Comunicación con la API
│   ├── app.routes.ts          # Rutas protegidas por authGuard
│   ├── app.component.ts       # Componente principal
│   └── app.config.ts          # Configuración global
│
├── assets/                    # Recursos estáticos
├── environments/              # Configuraciones por entorno
└── main.ts                    # Punto de entrada de la app
```

---

## 🚀 Despliegue con Docker (Global - Fullstack)

Este frontend Angular forma parte de un sistema **dockerizado completo** que incluye:

- 🎨 Frontend: Angular (v19+)
- 🚀 Backend: Node.js + Express
- 📂 Base de datos: MySQL
- 📄 phpMyAdmin

### ✅ Para lanzar todo con un solo comando:
```bash
docker-compose => docker-compose up -d
```

Esto levantará:

- Frontend en: `http://localhost:4200`
- Backend en: `http://localhost:3600`
- phpMyAdmin en: `http://localhost:8080`
- Base de datos MySQL en: `localhost:3306`

---

## 🧩 Integración con el Backend

El frontend se comunica con el backend a través del archivo de entorno Angular.

### 🔧 `src/environments/environmentProduction.ts`
```ts
export const environmentProduction = {
  production: false,
  apiUrl: 'http://localhost:3600/api'
};
```

### 🔧 `src/environments/environmentProduction.prod.ts`
```ts
export const environmentProduction = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com/api'
};
```

Asegúrate de usar `environmentProduction.apiUrl` en tus servicios Angular para hacer peticiones a la API.

## Instalación

```bash
npm install
```

## Servidor de desarrollo

```bash
ng serve
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si modificas los archivos fuente.

## Scripts útiles

- **Construir app**: `ng build`
- **Tests unitarios**: `ng test`
- **Generar componentes**: `ng generate component nombre`


