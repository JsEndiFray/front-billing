🚀 DASHBOARD → DATOS REALES (Angular + Backend)

Eres un desarrollador senior especializado en Angular (v17+), arquitectura reactiva y consumo de APIs REST.

⸻

🎯 OBJETIVO

Convertir el dashboard actual (datos mock/estáticos) en un dashboard dinámico que consuma datos reales desde el backend.

El dashboard debe mostrar:
•	Ingresos de hoy
•	Clientes activos
•	Nuevos clientes
•	Ventas totales
•	Facturas pendientes
•	Propiedades activas
•	Empleados

⸻

⚙️ REGLAS OBLIGATORIAS
1.	NO usar datos hardcodeados
2.	Todo debe venir del backend
3.	Separar responsabilidades:
•	Servicio → llamadas HTTP
•	Componente → solo orquesta
4.	Usar Signals (NO subscribe manual si no es necesario)
5.	Manejar errores (aunque sea básico)
6.	Tipado estricto (sin any)
7.	No romper el diseño actual

⸻

🧱 PASOS A SEGUIR

PASO 1: Análisis del dashboard actual
•	Localizar el componente del dashboard (dashboard.component.ts / .html)
•	Identificar:
•	dónde están los datos actuales (seguramente hardcoded)
•	qué variables usa el template

NO modificar aún

⸻

PASO 2: Definir modelo de datos

Crear una interfaz:

export interface DashboardStats {
todayIncome: number;
activeClients: number;
newClients: number;
totalSales: number;
pendingInvoices: number;
activeProperties: number;
activeEmployees: number;
}

⸻

PASO 3: Crear servicio

Ejecutar:

ng generate service core/services/dashboard

Implementar método:

getDashboardStats(): Observable

Endpoint esperado:

GET /api/dashboard/stats

⸻

PASO 4: Backend (SI NO EXISTE)

Crear endpoint en Node.js:

GET /dashboard/stats

Debe devolver:

{
“todayIncome”: 2347,
“activeClients”: 156,
“newClients”: 12,
“totalSales”: 45230,
“pendingInvoices”: 8,
“activeProperties”: 23,
“activeEmployees”: 7
}

IMPORTANTE:
•	NO hardcodear
•	Calcular desde base de datos

⸻

PASO 5: Integrar en Angular (Signals)

En el componente:

import { toSignal } from ‘@angular/core/rxjs-interop’;

private dashboardService = inject(DashboardService);

readonly stats = toSignal(
this.dashboardService.getDashboardStats(),
{ initialValue: null }
);

⸻

PASO 6: Adaptar HTML

ANTES:

€2,347

DESPUÉS:

{{ stats()?.todayIncome | currency:‘EUR’ }}

Aplicar a todos los bloques:
•	clientes
•	facturas
•	propiedades
•	empleados

⸻

PASO 7: Manejo de carga

Añadir control:

@if (!stats()) {
  <p>Cargando datos...</p>
}
PASO 8: Validación

Después de cada cambio ejecutar:

npx ng build –configuration development

Verificar:
•	Sin errores
•	UI funcionando
•	Datos reales visibles

⸻

🚨 CONTROL DE ERRORES

Si falla:
1.	Revisar endpoint
2.	Revisar tipos
3.	Revisar null/undefined
4.	NO continuar hasta resolver

⸻

📦 RESULTADO ESPERADO
•	Dashboard dinámico
•	Sin datos hardcodeados
•	Conectado a backend
•	Arquitectura limpia
•	Preparado para escalar

⸻

🧠 BONUS (OPCIONAL)
•	Cache en el servicio
•	Refresco automático
•	Loader visual mejorado

⸻

🚀 INICIO

Empieza por PASO 1 y muestra el análisis antes de modificar nada.


