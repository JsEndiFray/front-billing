# 🎨 Frontend — Aplicación Angular

## 📖 Descripción

SPA Angular 19 para gestión de facturación y administración inmobiliaria. Consume la API REST del backend y ofrece una interfaz para gestionar clientes, propietarios, inmuebles, facturas emitidas, facturas recibidas, gastos internos, proveedores, empleados y libro de IVA.

---

## 🧱 Arquitectura

El proyecto usa **componentes standalone** de Angular 19 sin NgModules. El estado reactivo se gestiona con **Signals** nativos de Angular y `toSignal()` para el puente RxJS → Signal.

| Capa | Descripción |
|------|-------------|
| **pages/** | Componentes de UI organizados por módulo (list, register, edit) |
| **core/services/** | Servicios HTTP e infraestructura: `ApiService` como wrapper central de `HttpClient` |
| **core/interceptors/** | `tokenInterceptor` (JWT automático + refresh) y `httpErrorInterceptor` (errores globales) |
| **core/guards/** | `authGuard` (rutas protegidas) y `publicGuard` (redirige si ya autenticado) |
| **core/mappers/** | `notification-route.mapper.ts` — mapea tipos de notificación a rutas Angular y severidad visual |
| **core/helpers/** | Utilidades puras: validación, transformación, formateo de fechas, cálculo de IVA |
| **interfaces/** | Tipos TypeScript para todas las entidades y respuestas de la API |
| **shared/** | Clase base `ExportableListBase<T>`, pipe de formato de fecha, enums |

---

## 📂 Estructura del proyecto

```
src/
├── app/
│   ├── app.routes.ts               # Definición de todas las rutas
│   ├── app.config.ts               # Configuración global: router, HttpClient, interceptors, locale ES
│   ├── app.component.ts            # Componente raíz (<router-outlet>)
│   │
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts       # Redirige a /login si no autenticado
│   │   │   └── public.guard.ts     # Redirige a /dashboards si ya autenticado
│   │   ├── interceptors/
│   │   │   ├── token/              # Inyecta Bearer token; refresca automáticamente en 401
│   │   │   └── http-error/         # Captura errores HTTP y muestra SweetAlert2
│   │   ├── mappers/
│   │   │   └── notification-route.mapper.ts  # Ruta y severidad por tipo de notificación
│   │   ├── helpers/                # 7 helpers: document-validation, form-validation,
│   │   │                           #             invoice-utils, expense-utils, vat-book-utils,
│   │   │                           #             vat-rates, data-transform, entity-validation
│   │   └── services/
│   │       ├── api-service/        # ApiService — wrapper HTTP con baseUrl de environment
│   │       ├── auth-services/      # AuthService, UserActivityService (inactividad 15min)
│   │       ├── entity-services/    # Un servicio por entidad (13 servicios)
│   │       ├── shared-services/    # PaginationService, SearchService, ExportService,
│   │       │                       # FileUploadService, StatsService
│   │       ├── vat-services/       # VatBookService (signal-based)
│   │       ├── estate-owners-services/  # EstateOwnersUtilService
│   │       └── validator-services/ # ValidatorService
│   │
│   ├── interfaces/                 # 17 archivos de interfaces TypeScript
│   │
│   ├── pages/
│   │   ├── dashboards/
│   │   │   ├── dashboard/          # Layout: sidebar, navbar, notificaciones, router-outlet
│   │   │   └── dashboard-home/     # Tarjetas de estadísticas del dashboard principal
│   │   ├── users/                  # login, user-list, users-register, user-edit
│   │   ├── clients/                # clients-list, clients-register, clients-edit
│   │   ├── owners/                 # owners-list, owners-register, owners-edit
│   │   ├── estates/                # estates-list, estates-register, estates-edit
│   │   ├── estate-owners/          # estate-owners-list, estate-owners-edit
│   │   ├── invoices/
│   │   │   ├── invoices-issued/    # list, register, edit (facturación proporcional incluida)
│   │   │   ├── invoices-received/  # list, register, edit
│   │   │   ├── invoices-expenses/  # list, register, edit (gastos internos)
│   │   │   └── suppliers/          # list, register, edit
│   │   ├── employee/               # employee-list, employee-register, employee-edit
│   │   ├── vat-book/               # Libro de IVA con filtros y exportación
│   │   └── settings/               # Configuración del usuario/empresa
│   │
│   └── shared/
│       ├── Base/
│       │   └── exportable-list.base.ts   # Clase abstracta para listas con exportación
│       ├── Collection-Enum/        # Enum de estados de cobro
│       └── pipe/
│           └── data-format.pipe.ts # Pipe de formato de fechas
│
└── environments/
    ├── environment.ts              # Producción
    └── environment.development.ts  # Desarrollo
```

---

## 🚀 Ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo (ng serve en http://localhost:4200)
npm start

# Build de producción
npm run build

# Tests unitarios (Karma + Jasmine)
npm test
```

**Requisitos**: Node.js compatible con Angular 19 (≥ 18.19).

### Variables de entorno

La URL del backend se configura en los archivos de environment:

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3600/api'   // ajustar según entorno local
};

// src/environments/environment.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'http://<servidor>:3600/api'
};
```

> **Nota**: Ambos archivos actualmente apuntan a la misma IP privada. Ajustar antes de desplegar en producción.

---

## 🔗 Integración con backend

### ApiService

Todos los servicios HTTP pasan por `ApiService`, que actúa como wrapper central de `HttpClient`:

- URL base desde `environment.apiUrl`
- Métodos genéricos: `get<T>`, `post<T,R>`, `put<T,R>`, `patch<T,R>`, `delete<T>`
- Extrae automáticamente `response.data` de la envoltura `{ success, data, message }` del backend

### Interceptores

| Interceptor | Función |
|-------------|---------|
| `tokenInterceptor` | Añade `Authorization: Bearer <token>` a cada request. En errores 401 intenta renovar el token automáticamente. Garantiza un único refresh real simultáneo mediante `BehaviorSubject` (sin race conditions). Si el refresh falla, ejecuta logout. |
| `httpErrorInterceptor` | Captura todos los errores HTTP (400–500) y muestra un modal SweetAlert2 con el mensaje del backend. Re-lanza el error para que los componentes puedan reaccionar si lo necesitan. |

### Locale

La app está configurada con `LOCALE_ID = 'es'` para formato español en pipes (`CurrencyPipe`, `DatePipe`, etc.).

---

## 🔐 Autenticación

**Almacenamiento**: `localStorage` (`token`, `refreshToken`, `userData`)

**Flujo completo**:
1. Login → `POST /api/auth/login` → guarda ambos tokens y datos del usuario
2. Token interceptor añade Bearer en cada petición
3. Timer automático refresca el access token cada **5 minutos** (sin esperar a que expire)
4. Si una petición recibe 401, el interceptor intenta un refresh antes de reintentar
5. Si el refresh falla → `AuthService.logout()` → redirige a `/login`
6. `UserActivityService` detecta inactividad (click, mousemove, keypress, scroll, touch) y cierra sesión automáticamente tras **15 minutos sin actividad**

**Guards**:
- `authGuard`: redirige a `/login` si no hay token válido
- `publicGuard`: redirige a `/dashboards` si ya está autenticado

**Roles**: `AuthService.isAdmin()` comprueba el rol almacenado en `userData`. Las vistas pueden usar `isAdmin()` para mostrar/ocultar controles.

---

## 🗺️ Rutas

Todas las rutas protegidas están bajo `/dashboards` con `authGuard`.

| Ruta | Componente | Notas |
|------|-----------|-------|
| `/login` | `LoginComponent` | publicGuard — redirige si ya autenticado |
| `/dashboards` | `DashboardHomeComponent` | Tarjetas de estadísticas |
| `/dashboards/users/register` | `UsersRegisterComponent` | |
| `/dashboards/users/list` | `UserListComponent` | |
| `/dashboards/users/edit/:id` | `UserEditComponent` | |
| `/dashboards/clients/register` | `ClientsRegisterComponent` | |
| `/dashboards/clients/list` | `ClientsListComponent` | |
| `/dashboards/clients/edit/:id` | `ClientsEditComponent` | |
| `/dashboards/owners/register` | `OwnersRegisterComponent` | |
| `/dashboards/owners/list` | `OwnersListComponent` | |
| `/dashboards/owners/edit/:id` | `OwnersEditComponent` | |
| `/dashboards/estates/register` | `EstatesRegisterComponent` | |
| `/dashboards/estates/list` | `EstatesListComponent` | |
| `/dashboards/estates/edit/:id` | `EstatesEditComponent` | |
| `/dashboards/estates-owners/list` | `EstateOwnersListComponent` | Sin ruta /register |
| `/dashboards/estates-owners/edit/:id` | `EstateOwnersEditComponent` | |
| `/dashboards/invoices-issued/register` | `InvoicesIssuedRegisterComponent` | |
| `/dashboards/invoices-issued/list` | `InvoicesIssuedListComponent` | |
| `/dashboards/invoices-issued/edit/:id` | `InvoicesIssuedEditComponent` | |
| `/dashboards/invoices-received/register` | `InvoicesRegisterReceivedComponent` | |
| `/dashboards/invoices-received/list` | `InvoicesReceivedListComponent` | |
| `/dashboards/invoices-received/edit/:id` | `InvoicesReceivedEditComponent` | |
| `/dashboards/internal-expenses/register` | `InvoicesExpensesRegisterComponent` | |
| `/dashboards/internal-expenses/list` | `InvoicesExpensesListComponent` | |
| `/dashboards/internal-expenses/edit/:id` | `InvoicesExpensesEditComponent` | |
| `/dashboards/suppliers/register` | `SuppliersRegisterComponent` | |
| `/dashboards/suppliers/list` | `SuppliersListComponent` | |
| `/dashboards/suppliers/edit/:id` | `SuppliersEditComponent` | |
| `/dashboards/books-vat/vat-book` | `VatBookComponent` | |
| `/dashboards/employee/register` | `EmployeeRegisterComponent` | |
| `/dashboards/employee/list` | `EmployeeListComponent` | |
| `/dashboards/employee/edit/:id` | `EmployeeEditComponent` | |
| `/dashboards/settings` | `SettingsComponent` | |
| `**` | — | Redirige a `/login` |

---

## 📊 Dashboard

El componente `DashboardHomeComponent` obtiene estadísticas del backend mediante `DashboardStatsService`:

```
GET /api/dashboard/stats
```

Muestra las siguientes tarjetas en tiempo real usando `toSignal()`:

| Campo | Descripción |
|-------|-------------|
| `todayIncome` | Ingresos del día (CurrencyPipe ES) |
| `activeClients` | Clientes activos |
| `newClients` | Nuevos clientes recientes |
| `totalSales` | Total de ventas |
| `pendingInvoices` | Facturas pendientes de cobro |
| `activeProperties` | Inmuebles activos |
| `activeEmployees` | Empleados activos |

---

## 🔔 Sistema de notificaciones

Las notificaciones se cargan en `DashboardComponent` (el layout principal) al inicializar la aplicación.

**Flujo**:
1. `NotificationsService.getNotifications()` se suscribe al `BehaviorSubject` interno y llama a `GET /api/notifications`
2. El resultado se guarda en un `signal<AppNotification[]>`
3. El contador de no leídas es un `computed()` que filtra `!n.read`
4. Al hacer click en una notificación: llama a `PATCH /api/notifications/:id/read`, llama a `refresh()` para recargar y navega a la ruta mapeada
5. El dropdown se cierra con `@HostListener('document:click')`

**Mapper** (`notification-route.mapper.ts`):

El mapper desacopla la lógica de presentación del servicio. El backend envía solo tipo y mensaje; el frontend decide la ruta y la severidad visual:

| Tipo | Ruta Angular | Severidad |
|------|-------------|-----------|
| `pending_invoices` | `/dashboards/invoices-issued/list` | `warning` |
| `overdue_invoices` | `/dashboards/invoices-issued/list` | `warning` |
| `new_clients` | `/dashboards/clients/list` | `success` |

Para añadir un nuevo tipo: actualizar `NotificationType` en `stats-interface.ts` y el mapper.

---

## 📗 Libro de IVA

`VatBookComponent` usa un servicio basado completamente en **Signals** de Angular 19.

**Estado reactivo**:
- `VatBookService` expone `vatData`, `loading`, `error` como signals de solo lectura
- El componente los consume directamente como referencias (sin `computed` redundante)
- Los filtros del formulario se convierten a signal con `toSignal(filtersForm.valueChanges)`
- `filteredSupported`, `filteredCharged`, `filteredOwners` y `currentStats` son `computed()`

**Funcionalidades operativas**:
- Consulta libro consolidado con filtros: año, trimestre (opcional), mes (opcional)
- 3 pestañas: IVA Soportado, IVA Repercutido, Resumen por Propietarios
- Búsqueda en tiempo real dentro de los datos cargados
- Exportación client-side a Excel (xlsx) o PDF (jsPDF) mediante `ExportService`

---

## 📤 Sistema de exportación

`ExportableListBase<T>` es una clase abstracta de la que heredan los componentes de listado. Provee tres modos de exportación:

| Modo | Descripción |
|------|-------------|
| `exportData()` | Exporta todos los registros filtrados |
| `exportCurrentPage()` | Exporta solo la página visible |
| `exportSelected()` | Exporta los registros marcados con checkbox |

Al llamar a cualquier modo, `ExportService` muestra un diálogo SweetAlert2 para elegir formato:
- **Excel** (.xlsx) — generado con `xlsx`
- **PDF** — generado con `jsPDF` + `jspdf-autotable` (orientación horizontal, filas alternadas)

---

## 📄 Paginación

`PaginationService` implementa paginación **client-side**: carga todos los datos del backend y los divide en páginas en memoria. Métodos disponibles: `paginate()`, `getVisiblePages()`, `getPaginationText()`.

---

## ⚙️ Configuración de usuario

`SettingsComponent` usa un `ReactiveForm` que:
- Pre-carga datos mediante `toSignal()` + `effect()` para aplicar `patchValue` cuando el signal cambia
- El campo `userName` es de solo lectura en el formulario (`disabled: true`)
- Envía `PUT /api/settings` al guardar
- Muestra SweetAlert2 de éxito (cierre automático en 1.5s)

Campos editables: email, nombre de empresa, CIF, dirección, tipo de IVA por defecto, moneda.

---

## 🧪 Estado actual

**✔ Funcionalidades completas**

- Autenticación con refresh automático y logout por inactividad
- Routing protegido con authGuard y publicGuard
- CRUD de: usuarios, empleados, clientes, propietarios, inmuebles, relaciones inmueble-propietario, proveedores
- Gestión de facturas emitidas (incluyendo abonos y facturación proporcional)
- Gestión de facturas recibidas (con abonos y estados de pago)
- Gestión de gastos internos
- Libro de IVA con filtros año/trimestre/mes y 3 pestañas
- Dashboard con 7 estadísticas en tiempo real
- Sistema de notificaciones con mapper desacoplado
- Exportación client-side (Excel/PDF) desde listas con selección
- Paginación client-side
- Configuración de usuario/empresa
- Interceptor de errores HTTP con SweetAlert2 global

**⚠ Funcionalidades parciales**

- **Libro de IVA — datos adicionales**: `getAnnualStats()`, `getQuarterlyComparison()`, `getQuarterlyLiquidation()` y `getConfig()` llaman al backend pero el resultado **no se almacena en ningún signal** ni se renderiza (TODOs explícitos en el código)
- **Libro de IVA — descarga backend**: `downloadExcel()` y `downloadPDF()` envían la petición pero **no gestionan el blob** de respuesta ni descargan el archivo
- **BreadcrumbService**: `dashboards.service.ts` tiene un servicio de breadcrumb completo que no está conectado al template (el componente layout usa su propio mapa interno de rutas)

---

## ⚠️ Limitaciones reales

1. **Sin lazy loading**: todos los módulos se cargan en el bundle inicial. No hay `loadComponent()` ni `loadChildren()` en las rutas.
2. **Paginación client-side**: para conjuntos de datos grandes, se carga todo en memoria antes de paginar.
3. **Environment de producción sin URL diferenciada**: `environment.ts` apunta a la misma IP que desarrollo. Requiere ajuste antes de desplegar.
4. **`estates-owners` sin ruta de registro**: no existe `/dashboards/estates-owners/register`, solo list y edit.
5. **InvoicesIssuedService con métodos comentados**: `getVATBookData`, `getIncomeStatement`, `getMonthlySummary` y `getPendingInvoicesAging` están comentados en el servicio.
6. **Tests mínimos**: los archivos `.spec.ts` existen pero solo contienen scaffolding básico; no hay cobertura funcional.
7. **Sin control de roles en templates**: `AuthService.isAdmin()` está disponible pero la gestión de visibilidad de elementos por rol depende de cada componente.

---

## 🧠 Mejoras futuras

- Activar lazy loading por módulo para reducir el bundle inicial
- Paginación server-side en listas grandes (pasar `page` y `limit` al backend)
- Completar las visualizaciones del libro de IVA (estadísticas anuales, comparación trimestral, liquidación)
- Implementar descarga real de blobs (Excel/PDF desde backend) en el libro de IVA
- Conectar `BreadcrumbService` al layout o eliminarlo si no se va a usar
- Añadir tests de componentes con cobertura mínima por módulo
- Separar correctamente `environment.ts` para producción con su propia URL
- Añadir ruta `/dashboards/estates-owners/register` si el alta de relaciones es necesaria
