# 🚀 FORMARRAY MIGRATION PLAN + STATUS

Eres un desarrollador senior especializado en Angular (v17+), arquitectura reactiva y buenas prácticas.

---

# 🎯 OBJETIVO

Refactorizar progresivamente los componentes del proyecto para migrar correctamente el manejo de formularios dinámicos desde arrays manuales de FormGroup hacia FormArray, aplicando buenas prácticas de arquitectura y manteniendo el sistema estable en todo momento.

---

# 📌 REGLA CRÍTICA (OBLIGATORIA)

ANTES DE HACER NADA:

1. Leer COMPLETAMENTE este archivo
2. Localizar:
  - Componente actual
  - Paso actual
3. Continuar EXACTAMENTE desde ese punto
4. NO repetir pasos ya completados
5. NO avanzar si hay errores

---

# ⚙️ REGLAS GENERALES (OBLIGATORIAS)

1. ❌ NO avanzar al siguiente paso si hay errores
2. Después de CADA cambio:
  - Ejecutar:
    npx ng build --configuration development
  - Si hay errores → corregir antes de continuar
3. ❌ NO usar `any`
4. ❌ NO mezclar responsabilidades
  - Componente → orquesta
  - Transformaciones → mappers
5. ❌ NO eliminar funcionalidad existente
6. Mantener compatibilidad con HTML (adaptándolo si es necesario)
7. Código limpio y consistente con Angular moderno
8. ❌ NO hacer cambios destructivos de golpe
9. ✔️ Migración SIEMPRE incremental
10. ✔️ Sustituir `toPromise()` por `lastValueFrom()` o `firstValueFrom()`

---

# ❗ CONTROL DE INCREMENTALIDAD (OBLIGATORIO)

Está PROHIBIDO:

- ❌ Eliminar estructuras existentes antes del PASO 8
- ❌ Mezclar pasos (ej: PASO 2 + PASO 8)
- ❌ Refactorizar múltiples responsabilidades en un mismo paso

Cada paso debe ejecutarse de forma aislada y verificable.

---

# 🔁 ESTRATEGIA DE TRABAJO

Trabajar componente por componente.

## Orden:

1. clients-register
2. suppliers-register
3. owners-register
4. employee-register
5. estates-register

---

# 📍 ESTADO ACTUAL (MUY IMPORTANTE)

## Componente actual:
(ninguno - migración completa)

## Estado:
COMPLETED

## Paso actual:
FINALIZADO

## Última acción realizada:
- estates-register analizado (PASO 1 completado)
- ✅ estates-register ya usa FormArray correctamente → No requiere migración
- ✅ TODOS los componentes revisados
- Build final ejecutado: OK
- Commit final realizado

## Próxima acción:
- (ninguna - migración completa)

## Build:
- Último build: OK
- Pendiente tras próximo cambio: NO

## Notas:
- ✅ Migración FormArray completada en todos los componentes del plan

---

# 🧱 PASOS POR COMPONENTE

## PASO 1: Análisis inicial
- Leer .ts + .html
- Detectar:
  - FormGroup[]
  - Lógica de creación/eliminación
  - Validaciones
- ❌ NO modificar nada

---

## PASO 2: Introducir FormArray
- Añadir al FormGroup:
  administrators: this.fb.array([])
- Crear getter:
  get administratorsArray(): FormArray
- ❌ NO eliminar aún estructuras existentes

---

## PASO 3: Refactor de creación
- Reemplazar:
  .push() → administratorsArray.push()
- Crear:
  createAdministratorForm(): FormGroup

---

## PASO 4: Refactor de eliminación
- Reemplazar:
  splice() → administratorsArray.removeAt(index)

---

## PASO 5: Refactor de validación
- Crear:
  validateAdministrators(): boolean
- Usar:
  this.administratorsArray.controls

---

## PASO 6: Refactor de creación de datos
- Usar:
  this.administratorsArray.getRawValue()
- Usar mapper (si existe o crearlo)

---

## PASO 7: Refactor HTML
- Añadir:
  formArrayName="administrators"
- Cambiar:
  [formGroup] → [formGroupName]
- Usar:
  @for (item of administratorsArray.controls; let i = $index)

---

## PASO 8: Limpieza
- Eliminar:
  - arrays antiguos (FormGroup[])
  - código muerto
  - console.log
- Simplificar lógica duplicada

---

## PASO 9: Validación completa
- Ejecutar build
- Verificar:
  - Sin errores TS
  - Sin errores HTML
  - Funcionalidad intacta

---

# 🚨 CONTROL DE ERRORES

Si ocurre un error:

1. DETENER ejecución
2. Analizar error
3. Corregir completamente
4. Ejecutar build
5. Solo continuar cuando todo esté OK

---

# 🔁 ACTUALIZACIÓN DE ESTADO (OBLIGATORIO)

Después de CADA paso actualizar:

- Paso actual
- Última acción
- Próxima acción
- Estado del build

---

# 🔄 CONTROL AUTOMÁTICO DE PROGRESO (OBLIGATORIO)

Cuando completes TODOS los pasos (1 → 9) de un componente:

1. Marcar como completado:

## Estado global
- [x] clients-register
- [x] suppliers-register (sin FormGroup[] → no requiere migración)
- [x] owners-register (sin FormGroup[] → no requiere migración)
- [x] employee-register (sin FormGroup[] → no requiere migración)
- [x] estates-register (FormArray ya implementado correctamente → no requiere migración)

---

2. Buscar automáticamente el siguiente componente pendiente ([ ])

3. Actualizar:

## Componente actual:
(siguiente componente)

## Estado:
IN_PROGRESS

## Paso actual:
PASO 1 - Análisis inicial

## Última acción realizada:
- Componente anterior completado

## Próxima acción:
- Analizar nuevo componente

---

4. CONTINUAR automáticamente

---

# ❌ PROHIBIDO

- ❌ Pedir confirmación para continuar
- ❌ Pararse tras terminar un componente
- ❌ Saltarse el orden definido
- ❌ Eliminar estructuras antes de PASO 8
- ❌ Mezclar pasos

---

# 🤖 COMPORTAMIENTO ESPERADO DEL AGENTE

El flujo debe ser completamente automático:

clients-register → DONE  
↓  
suppliers-register → START  
↓  
owners-register → START  
↓  
employee-register → START  
↓  
estates-register → START

SIN intervención del usuario.

---

# 📦 FINALIZACIÓN GLOBAL

Cuando TODOS los componentes estén completados:

1. Ejecutar build final:
   npx ng build --configuration development

2. Si todo está correcto:

   git add .  
   git commit -m "refactor: migración completa a FormArray en formularios dinámicos"  
   git push

---

# 🧠 REGLA CLAVE FINAL

SIEMPRE debe existir:

- ✔ Un solo componente en IN_PROGRESS
- ✔ Un solo PASO activo
- ✔ Un build válido antes de avanzar  

---

# 💾 AUTO-GUARDADO Y SEGURIDAD (OBLIGATORIO)

Después de COMPLETAR cada PASO:

1. Guardar archivos modificados

2. Ejecutar build:
   npx ng build --configuration development

3. Si el build es correcto:

   Ejecutar commit automático:

   git add .
   git commit -m "refactor(<componente>): PASO <número> completado"

4. Si el build falla:
   ❌ NO hacer commit
   ✔ corregir errores primero

---

# 🔄 RECUPERACIÓN AUTOMÁTICA

Antes de empezar cualquier trabajo:

1. Leer MIGRATION_FORMARRAY_STATUS.md
2. Verificar estado del código vs archivo
3. Si hay diferencias:
  - Explicar problema
  - NO continuar

---

# 🛑 PROTECCIÓN ANTI-ROTURA

Está PROHIBIDO:

- Hacer múltiples pasos sin commit intermedio
- Hacer commit si el build falla
- Modificar más de un componente a la vez

---

# 🧾 LOG DE CAMBIOS (OBLIGATORIO)

Después de cada paso añadir:

## Últimos cambios realizados:
- Archivo:
- Cambio:
- Motivo:

---

# 🔙 ROLLBACK AUTOMÁTICO (SI ALGO FALLA)

Si después de un cambio el sistema queda inestable:

1. Ejecutar:
   git reset --hard HEAD

2. Volver al último estado estable

3. Reanalizar el paso antes de reintentar
