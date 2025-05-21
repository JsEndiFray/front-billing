
# Proyecto Facturas

Este es un sistema de facturación desarrollado con **Angular 19+** para el frontend. El backend está en desarrollado y haciendo modificaciones, y la arquitectura está preparada para consumir una API RESTful.

## Características principales

- Gestión de usuarios, clientes, propietarios, inmuebles y facturas.
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

## Pendientes

- Completar lógica y componentes para:
  - `owners`
  - `clients`
  - `users`
  - `estates-owners`

