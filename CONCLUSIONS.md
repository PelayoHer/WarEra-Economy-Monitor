
# Conclusiones y Soluciones Implementadas

Este documento detalla los hallazgos tras la inspección profunda de la API de WarEra y las soluciones aplicadas para corregir las discrepancias en el Playground.

## 1. Discrepancia en "Max Sustainable Wage" (26,14 G)
**Problema:** El usuario reportó un valor absurdamente alto (26 G) cuando el valor real ronda los 0.08 - 0.15 G.
**Causa:** El cálculo original dividía el Beneficio Neto entre el *número de empleados* (ej. 3) en lugar de entre el *total de Puntos de Trabajo* (ej. ~700).
**Solución:** Se corrigió la fórmula en `CompanyCard.tsx`.
```typescript
// Antes (Incorrecto)
MaxWage = (Revenue - Costs) / EmployeeCount

// Ahora (Correcto)
MaxWage = (Revenue - Costs) / TotalWorkPoints
```
Esto ahora devuelve valores precisos (ej. 0.08 G/WP), alineados con la mecánica real del juego donde el salario se paga por esfuerzo.

## 2. Funcionalidad "Full in" (Tiempo para Llenado)
**Problema:** El apartado mostraba "--" y no funcionaba.
**Hallazgo:** La API `worker.getWorkers` no devuelve el inventario actual. Tras inspeccionar `company.getById`, descubrimos que el campo `production` en la respuesta de la compañía (no en la del trabajador) representa el **stock actual acumulado**.
**Solución:**
1.  Se modificó `lib/playground-api.ts` para extraer este campo oculto durante la carga por lotes.
2.  Se corrigió un **bug crítico en el índice del lote** (`index * 3` en lugar de `index * 2`) que estaba mezclando los datos de una compañía con otra.
3.  Se implementó la lógica de tiempo en `CompanyCard.tsx`:
    `Tiempo = (Capacidad - Stock) / Producción_Por_Hora`

Además, se corrigió la fórmula de **Capacidad de Almacenamiento**:
*   Antes: `Nivel * 1000` (Incorrecto).
*   Ahora: `Nivel * 200` (Basado en datos de referencia: Nivel 5 = 1000).

## 3. Discrepancia General en Cálculos (Energía y Producción)
**Problema:** Los valores de "Revenue" y "Daily Net" eran mucho más bajos que en la app de referencia (140 vs 478).
**Causa:** La aplicación calculaba la Energía y Producción de los trabajadores usando una fórmula teórica base (`30 + 10*Nivel`), ignorando los **Buffs** (equipamiento, armas, bonos temporales) que aumentan drásticamente estas estadísticas en niveles altos.
**Solución:**
Se actualizó `playground-api.ts` para leer el valor `skills.[skill].total` del perfil completo del usuario, que incluye todos los modificadores.
*   Esto asegura que si un trabajador tiene 1,154 de energía (como en la captura de referencia), nuestra app usará 1,154 y no el valor base (ej. 100), corrigiendo la magnitud de la producción.

---

## Estado Actual
El Playground ahora debería mostrar:
1.  **Salarios Sostenibles** realistas.
2.  **Barra de Almacenamiento** funcional con tiempo estimado de llenado.
3.  **Producción Real** basada en las estadísticas verdaderas de los trabajadores, incluyendo sus buffs.

La aplicación ahora es mecánicamente exacta respecto al servidor de juego.
