
# Mecánicas del Playground de EraEconomy

## 1. Visión General
El **Playground** (o Zona de Pruebas) es un entorno de simulación interactivo diseñado para ayudar a los jugadores de WarEra a optimizar sus empresas. A diferencia de otras herramientas que dependen de fórmulas estáticas u ocultas, EraEconomy utiliza cálculos dinámicos y transparentes basados en las mecánicas reales del juego.

Esta documentación detalla las fórmulas exactas y la lógica utilizada en la aplicación.

---

## 2. Cálculos Principales

### 2.1. Cálculo de Puntos de Trabajo (WP)
Cada empleado produce "Puntos de Trabajo" (WP) basándose en su Energía, Habilidad (Skill) y Fidelidad. Esta es la unidad fundamental de productividad.

```typescript
WP = Energía * Habilidad * PROD_CONSTANT * (1 + Fidelidad / 100)
```

*   **Energía**: La energía actual del empleado (0-100+).
*   **Habilidad**: El nivel del empleado en la habilidad relevante (Producción).
*   **Fidelidad**: Un bono porcentual basado en cuánto tiempo ha estado el empleado en la empresa.
*   **PROD_CONSTANT**: `0.24` (Derivado de la ingeniería inversa del motor del juego).

### 2.2. Producción Total (Output)
La cantidad total de items producidos diariamente depende de los Puntos de Trabajo totales y de la receta específica del producto.

```typescript
Output Final = (Suma(WP) * (1 + Bono / 100)) / Dificultad_Receta
```

*   **Suma(WP)**: Total de Puntos de Trabajo de todos los empleados.
*   **Bono**: El "Bono %" configurable en la tarjeta (combina bonos de Región, País y Partido).
*   **Dificultad_Receta**:
    *   *Recursos Primos* (ej. Grano, Hierro): típicamente **1**.
    *   *Bienes Manufacturados* (ej. Pan, Acero): típicamente **10**.

### 2.3. Análisis Financiero

#### Ingresos Diarios (Revenue)
```typescript
Ingresos = Output Final * Precio de Mercado
```
*   **Precio de Mercado**: Obtenido en tiempo real desde la API de WarEra.

#### Costos de Insumos (Input Costs)
Para bienes manufacturados, se deduce el costo de las materias primas.
```typescript
Costos Insumos = Suma(Cant_Insumo * Output Final * Precio_Mercado_Insumo)
```
*Ejemplo: Producir 10 Panes requiere 10 Granos. Si produces 100 Panes, necesitas 100 Granos.*

#### Costos Salariales (Wages)
Los salarios se calculan según el esfuerzo (Puntos de Trabajo) ejercido por los empleados, multiplicado por su tasa salarial acordada.
```typescript
Salarios Totales = Suma(WP_Empleado * Tasa_Salarial)
```
*   **Tasa_Salarial**: El valor establecido en el campo "Salario" (ej. 0.15 G por WP). *Nota: Esto difiere de algunas herramientas que tratan el salario como una tarifa diaria plana, pero nuestro análisis sugiere que el juego paga por unidad de trabajo.*

#### Beneficio Neto Diario
```typescript
Neto Diario = Ingresos - (Costos Insumos + Salarios Totales)
```

### 2.4. Salario Máximo Sostenible
Esta métrica crítica te indica la **Tasa Salarial Máxima** que puedes pagar por Punto de Trabajo para no perder dinero (Neto Diario = 0).

```typescript
Tasa Salarial Máxima = (Ingresos - Costos Insumos) / Total Puntos de Trabajo
```
*   Si pagas menos de este valor, eres rentable.
*   Si pagas más, pierdes dinero.

---

## 3. Por qué EraEconomy es Superior

1.  **Mecánicas Salariales Exactas**: Calculamos los salarios basándonos en los *Puntos de Trabajo* reales generados, no solo en una estimación plana por cabeza. Esto refleja con precisión que los trabajadores de alta habilidad y energía cuestan más pero producen significativamente más.
2.  **Escenarios "Y si..." en Tiempo Real**:
    *   **Cambio de Producto**: Puedes ver instantáneamente qué pasa si cambias una fábrica de producir *Pescado* a *Pescado Cocinado* sin cambiarlo realmente en el juego.
    *   **Simulación de Contratación**: Puedes añadir "Empleados Fantasma" con estadísticas específicas (ej. "¿Qué pasa si contrato a un gurú con 100 de habilidad?") para ver el retorno de inversión antes de gastar dinero.
3.  **Integración Dinámica de Mercado**: La rentabilidad se calcula usando precios de mercado *en vivo*, identificando oportunidades de arbitraje donde la materia prima podría valer más que el producto terminado.
4.  **Procesamiento por Lotes**: Nuestro backend recupera todos los datos en lotes paralelos, reduciendo los tiempos de carga y asegurando que veas una instantánea de todo tu imperio a la vez, en lugar de cargar tarjeta por tarjeta.
