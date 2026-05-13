# Cuadra — Auditoría de Negocio + Ruta de Elaboración

> Documento generado el 2026-05-11 con análisis de grafo de conocimiento (385 nodos · 802 aristas · 37 comunidades) + exploración manual del código + revisión de archivos legales (PRIVACY_POLICY, TERMS_OF_SERVICE, DISCLAIMER).
>
> **Última actualización del progreso: 2026-05-13.** Fases 0-8 entregadas y compilando limpio (TypeScript estricto, `npx tsc --noEmit` exit 0). Documentación completa de archivos clave por fase (§11). Pendiente: activar el email digest diario (bloqueado por upgrade a plan Blaze de Firebase) y las Fases 9-10. Ver §0 "Estado de implementación" para detalle.

---

## 0. Estado de Implementación (snapshot 2026-05-12)

### Resumen

| Fase | Título | Estado | Notas |
|---|---|---|---|
| 0 | Reposicionamiento legal | ✅ Completa | DISCLAIMER, TERMS, PRIVACY revisados; "POS"/"Invoice" reemplazados en UI; disclaimer fiscal en comprobantes |
| 1 | Deuda técnica | ✅ Completa | onSnapshot reactivo, paginación cursor en sales/users, capa servicios limpia |
| 2 | Cimientos para emprendedores | ✅ Completa | `costPrice`, gastos, proveedores, utilidad neta, margen por categoría |
| 3 | Diferenciadores LATAM | ✅ Completa | Comprobante PDF + WhatsApp, scan de barras, import CSV |
| 4 | UX premium | 🟡 95% | Dashboard + alertas + onboarding completos. **Email digest diario:** código listo, `export` comentado en `functions/src/index.ts`, **bloqueado por Blaze** |
| 5 | Equipos y operación | ✅ Completa | Sub-roles + matriz permisos + comisiones + múltiples sesiones de caja simultáneas |
| 6 | Inteligencia de negocio | ✅ Completa* | ABC, rotación, inventario valorizado, comprados juntos, proyección mensual, sugerencia reorden, tags+filtros+export clientes. *Diferido*: mermas (no hay modelo de shrinkage), reportes personalizables, programación de envío email |
| 7 | Promociones y pricing | ✅ Completa | Engine `applyPricing` con 4 tipos de promo + listas de precios por tag/cliente + cupones + reporte de efectividad |
| 8 | Multi-sucursal real | ✅ Completa | `stockByLocation` autoritativo, transferencias atómicas, filtro por sucursal, permisos por sede, dashboard comparativo |
| 9 | App móvil nativa | ❌ Pendiente | No iniciada |
| 10 | Ecosistema | ❌ Pendiente | No iniciada |

### Tareas bloqueadas (esperan plan Blaze)

| ID | Tarea | Razón | Para destrabar |
|---|---|---|---|
| 33 | Subir `GMAIL_APP_PASSWORD` como Firebase Secret | Secret Manager requiere Blaze | Upgrade del proyecto a Blaze |
| 35 | Deploy de `dailyDigest` Cloud Function | Misma — usa el secret y `onSchedule` v2 | Después de #33, descomentar export en `functions/src/index.ts` + `firebase deploy --only functions:dailyDigest` |
| 36 | Rotar App Password de Gmail | Higiene de seguridad: la password se compartió en chat al configurar el secret | Después de #35, regenerar en `https://myaccount.google.com/apppasswords` y volver a setear el secret |

### Próximos pasos sugeridos

1. **Probar en navegador la Fase 8** (transferencias + filtros) con datos reales — es lo más reciente y lo menos validado en runtime.
2. **Cuando se haga upgrade a Blaze**: ejecutar tareas 33 → 35 → 36 en orden.
3. **Iniciar Fase 9 (React Native)** — fase grande (~6 semanas), evaluar si reaprovechar la PWA por más tiempo antes de invertir.
4. **Validar con usuarios reales** las Fases 5-8 (sub-roles, promos, multi-sucursal) — son las que más afectan flujos operativos.

---

## Índice

0. [Estado de Implementación (snapshot 2026-05-12)](#0-estado-de-implementación-snapshot-2026-05-12)
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Reposicionamiento Legal URGENTE](#2-reposicionamiento-legal-urgente)
3. [Estado Actual del Producto](#3-estado-actual-del-producto)
4. [Análisis de Brechas Funcionales](#4-análisis-de-brechas-funcionales)
5. [Roadmap por Fases](#5-roadmap-por-fases)
6. [Quick Wins — Primer Mes](#6-quick-wins--primer-mes)
7. [Estrategia de Monetización](#7-estrategia-de-monetización)
8. [KPIs y Métricas de Éxito](#8-kpis-y-métricas-de-éxito)
9. [Riesgos y Mitigaciones](#9-riesgos-y-mitigaciones)
10. [Anexos Técnicos](#10-anexos-técnicos)
11. [Estado de Archivos Clave por Fase (Fases 5-8)](#11-estado-de-archivos-clave-por-fase-fases-5-8)

---

## 1. Resumen Ejecutivo

### Visión refinada

> **Cuadra es un SaaS de gestión comercial para emprendedores latinoamericanos.** No es un POS fiscal. No emite facturas. Ayuda a llevar el control interno de ventas, inventario, clientes y cobros — con la realidad económica venezolana (dual USD/Bs + BCV) integrada de fábrica.

### Diagnóstico en 3 líneas

1. **Base técnica sólida**: Firebase + Next.js 16 + tipado fuerte + reglas de seguridad bien definidas + multi-tenancy.
2. **Producto incompleto para emprendedores reales**: faltan compras, márgenes, gastos y reportes de rentabilidad. Hoy mide ingresos, no negocio.
3. **Riesgo legal latente**: el branding ("POS") y vocabulario ("factura", "cierre fiscal") pueden gatillar exigencias del SENIAT que el producto NO está preparado para cumplir.

### Prioridades inmediatas (próximos 30 días)

| Prioridad | Acción | Razón |
|---|---|---|
| 🔥 P0 | Reposicionar lenguaje (eliminar "POS", "factura") | Riesgo legal real |
| 🔥 P0 | Onboarding guiado | Sin esto la conversión inicial muere |
| 🟡 P1 | Dashboard con insights reales | Lo primero que ve el dueño cada mañana |
| 🟡 P1 | Envío de comprobantes por WhatsApp | Diferenciador inmediato en LATAM |
| 🟢 P2 | Fix de deuda técnica crítica (polling, paginación) | Antes de que escale |

---

## 2. Reposicionamiento Legal URGENTE

### Por qué importa

En Venezuela, el SENIAT (autoridad fiscal) regula los **"Sistemas de Facturación"** bajo la Providencia 0071/2011 y normativas conexas. Los sistemas POS con emisión de facturas requieren:

- Homologación SENIAT (proceso costoso, meses de demora)
- Cumplimiento de formato fiscal (números de control correlativos, RIF emisor, retenciones)
- Equipos certificados (impresoras fiscales homologadas)
- Auditorías recurrentes

**Cuadra hoy NO está homologado, ni quiere estarlo** (ya está documentado en `DISCLAIMER.md`). El problema es que **el branding y vocabulario actuales pueden ser interpretados como un sistema fiscal** por un fiscalizador, generando exposición legal innecesaria.

### Lo que hay que CORREGIR YA

#### 2.1 Branding — eliminar "POS" en todas las superficies

| Archivo | Texto actual | Texto sugerido |
|---|---|---|
| `README.md` línea 3 | "POS moderno para comerciantes venezolanos" | "**Gestor de ventas** moderno para emprendedores venezolanos" |
| `README.md` línea 13 | "POS moderno" | "SaaS de gestión comercial" |
| Marketing/landing futuro | "El POS para tu negocio" | "El gestor de ventas para tu emprendimiento" |
| `package.json` description | (verificar) | "SaaS de gestión comercial" |

**Por qué:** la palabra "POS" (Point of Sale) en marketing fiscal venezolano se asocia automáticamente a sistemas de facturación. Aunque legalmente nada lo prohíbe usar la palabra, **reduce el riesgo de fiscalización por confusión** si el producto se posiciona explícitamente como "gestor" o "asistente de ventas".

#### 2.2 Vocabulario en la UI — términos a reemplazar

| Término actual | Reemplazo sugerido | Justificación |
|---|---|---|
| "Factura" / "Invoice" | "Comprobante interno" / "Recibo de operación" | "Factura" tiene definición legal específica |
| "Cierre fiscal" (si existe) | "Cierre de caja interno" o "Cuadre" | "Fiscal" implica obligación tributaria |
| "Número de factura" | "Número de operación" / "ID interno" | Evita correlativo fiscal |
| "Emisor" (si aparece) | "Negocio" o "Emprendimiento" | Lenguaje SaaS, no fiscal |
| "Cliente" (cuando aparece como contribuyente) | "Cliente" (está bien) | Solo cuidar contexto |
| "Ticket" | "Comprobante" o "Recibo interno" | "Ticket fiscal" es regulado |

**Cambios concretos detectados en el código:**

```typescript
// src/app/pos/page.tsx línea 415
{/* Cart Invoice Sidebar (Glass Bento Widget) */}
// CAMBIAR A:
{/* Cart Summary Sidebar (Glass Bento Widget) */}
```

#### 2.3 Funcionalidades a EVITAR agregar (aunque clientes lo pidan)

❌ **NO agregar nunca:**

1. **Emisión de facturas con formato fiscal venezolano** (número de control, retenciones IVA/ISLR)
2. **Conexión a impresoras fiscales** (Bematech, Epson TM, etc.)
3. **Cálculo automático de IVA/ISLR como retención obligatoria** (puede ser opcional informativo)
4. **Reportes formato Libros de Ventas/Compras** que exige el SENIAT
5. **Firma digital fiscal** o certificados SENIAT
6. **Numeración correlativa obligatoria** de comprobantes
7. **Modo "auditoría fiscal"** o exportación al SENIAT

✅ **SÍ se puede agregar (sin riesgo):**

1. Comprobantes internos PDF/imagen (con leyenda clara: "Documento sin valor fiscal")
2. Cálculo de impuestos **opcional como referencia gerencial**
3. Reportes de ventas formato libre (Excel, PDF) sin formato fiscal
4. IVA como "campo informativo" para que el dueño sepa cuánto debería pagar
5. Numeración interna no correlativa estricta

#### 2.4 Disclaimers visibles que se deben reforzar

**En cada comprobante generado:**

```
*** DOCUMENTO INTERNO SIN VALOR FISCAL ***
Este comprobante es de uso administrativo del negocio.
No sustituye factura fiscal según Providencia SENIAT 0071/2011.
Para fines tributarios, emita factura por su sistema fiscal homologado.
```

**En el footer de cada reporte:**

```
Reporte gerencial generado por Cuadra SaaS.
No es un libro fiscal según normativa venezolana.
```

#### 2.5 Términos legales — refuerzos sugeridos

Revisar `TERMS_OF_SERVICE.md` y `DISCLAIMER.md` para asegurar que incluyan:

- [x] Cuadra es SaaS de gestión, no sistema fiscal (ya está)
- [ ] Cliente es **único responsable** de su régimen tributario
- [ ] Cuadra NO almacena información con valor probatorio fiscal
- [ ] Datos almacenados son referenciales para la operación interna
- [ ] Cliente reconoce que debe llevar libros fiscales por su sistema homologado
- [ ] Cuadra se reserva el derecho de suspender cuenta ante uso fiscal indebido

---

## 3. Estado Actual del Producto

### 3.1 Lo que YA tiene (y funciona)

#### Núcleo operativo
- ✅ **Gestión de ventas** con carrito multi-producto
- ✅ **Multi-pago**: efectivo, transferencia, pago móvil, crédito
- ✅ **Dual currency USD/Bs** con tasa BCV automática
- ✅ **Inventario** con stock, stock mínimo, categorías, ubicaciones
- ✅ **Clientes** con historial
- ✅ **Cobros pendientes / créditos** con seguimiento
- ✅ **Cierres de caja** con sesiones (apertura/cierre, asignación de ventas)
- ✅ **Devoluciones** parciales o totales
- ✅ **Override de precio** con motivo de descuento

#### Reportes y exportación
- ✅ Gráficos de ventas por período (recharts)
- ✅ Exportación a Excel (xlsx) y PDF (jspdf)
- ✅ Filtros por cajero, método de pago, status

#### Plataforma
- ✅ **Multi-tenancy** Owner → Staff con custom claims
- ✅ **Roles**: admingod, admin, owner, staff
- ✅ **PWA** instalable + service worker
- ✅ **Dark/Light theme**
- ✅ **Notificaciones** en tiempo real (deudas pendientes)
- ✅ **Compliance legal** (Terms, Privacy, Disclaimer, PDVD)

#### Backend
- ✅ Cloud Functions: `createStaffMember`, `deleteStaffMember`, `syncUserClaims`, `wipeDatabase`
- ✅ Reglas Firestore con role-based access
- ✅ Custom Claims JWT para autorización

### 3.2 Lo que tiene pero está DÉBIL

| Área | Problema |
|---|---|
| **Dashboard / Home** | Solo 3 métricas. Un dueño quiere ver más al abrir |
| **Búsqueda** | No hay búsqueda global. Cada página tiene la suya |
| **Onboarding** | Inexistente. Usuario nuevo está perdido |
| **Notificaciones** | Solo cobros pendientes. Faltan alertas inteligentes |
| **Reportes** | Sin reportes personalizables, sin comparativas mes/año |
| **Stock** | Sin alertas automáticas más allá de mínimo |
| **Staff** | Sin comisiones, sin metas individuales |
| **Cliente** | Sin segmentación, sin historial visual, sin notas |

### 3.3 Lo que tiene como deuda técnica

(Fuente: `REFACTORING_PLAN.md` + análisis del grafo)

#### Crítico (afecta producción ya)

| # | Problema | Archivo | Impacto |
|---|---|---|---|
| C1 | `setInterval(2000)` en lugar de `onSnapshot` | `cashClosing.service.ts:50` | Memory leak + 30 reads/min Firestore |
| C2 | `getAllSales()` carga 500 docs sin paginación real | `sales.service.ts:206` | RAM + costos Firestore |
| C3 | `getUsers()` sin límite | `user.service.ts:66` | Carga todos en cada call |
| C4 | Firebase Auth en componente UI | `admin/users/page.tsx:12-14` | Imposible testear |
| C5 | `uploadBytes` directo en POS | `pos/page.tsx:13-14` | Sin error handling central |

#### Alto (deuda clara)

- 11 usos de `as any` distribuidos
- Propiedad `location` en Product sin tipar
- `useEffect` con 5 responsabilidades distintas (`pos/page.tsx:61-177`)
- POS importa 5 servicios directamente
- `useAuth` con 43 aristas (god node confirmado por grafo)

#### 95 nodos aislados en el grafo
Componentes/funciones sin conexión con el resto: posible código zombie, candidato a eliminar.

---

## 4. Análisis de Brechas Funcionales

### 4.1 Lo que un EMPRENDEDOR esperaría y NO tiene

#### Gestión de costos y rentabilidad
- ❌ **Precio de costo del producto** — solo manejas precio venta
- ❌ **Margen de ganancia por producto/categoría**
- ❌ **Costo promedio ponderado** (CPP) para productos con múltiples entradas
- ❌ **Gastos operativos** (alquiler, servicios, sueldos)
- ❌ **Punto de equilibrio** del negocio
- ❌ **Utilidad neta** real (no solo ingreso bruto)

#### Compras y proveedores
- ❌ **Registro de proveedores**
- ❌ **Órdenes de compra**
- ❌ **Entrada formal de inventario** con costo
- ❌ **Historial de precios de compra** por proveedor
- ❌ **Cuentas por pagar**

#### Promociones y pricing
- ❌ **Promociones automáticas** (2x1, descuento por cantidad, combos)
- ❌ **Lista de precios diferenciada** (mayorista/minorista/VIP)
- ❌ **Cupones / códigos de descuento**
- ❌ **Happy hour** o promos por horario
- ❌ **Precios por canal** (mostrador vs. delivery)

#### Operación diaria
- ❌ **Códigos de barras / escáner** (la cámara del móvil ya soporta esto)
- ❌ **Importación masiva** de productos (CSV/Excel)
- ❌ **Lectura por QR** para inventario rápido
- ❌ **Sub-categorías** (Bebidas → Frías → Refrescos)
- ❌ **Unidades de medida múltiples** (kg, litros, unidades, caja)
- ❌ **Productos con variantes** existe en tipos pero UI limitada

#### Comunicación con clientes
- ❌ **Envío de comprobantes por WhatsApp** (diferenciador HUGE en LATAM)
- ❌ **Recordatorio automático de deudas** (hoy es manual)
- ❌ **Plantillas de mensaje**
- ❌ **Lista negra de morosos**
- ❌ **Programa de fidelización** (puntos, descuentos por compra repetida)

#### Equipo y staff
- ❌ **Sistema de comisiones** por venta/cajero
- ❌ **Metas individuales** con seguimiento
- ❌ **Sub-roles** (cajero, supervisor, gerente)
- ❌ **Permisos granulares** (puede aplicar descuento, puede anular venta, etc.)
- ❌ **Turnos** (mañana, tarde, noche)
- ❌ **Auditoría detallada** "Quién hizo qué cuándo"

#### Reportes avanzados
- ❌ **Comparativa mes anterior / año anterior**
- ❌ **Proyección de ventas** (estimado fin de mes)
- ❌ **Análisis ABC de productos** (top 20% genera 80% ventas)
- ❌ **Reporte de inventario valorizado** (cuánto vale tu stock)
- ❌ **Reporte de rotación de inventario**
- ❌ **Reportes personalizables** (drag & drop)
- ❌ **Exportar a contabilidad** (Excel formato contador-friendly)

#### Inteligencia de negocio
- ❌ **Alertas inteligentes**:
  - "Producto X se está agotando, según ventas se acabará en 4 días"
  - "Cliente Y no compra desde hace 2 meses"
  - "Vendiste 30% menos que el promedio del mes"
- ❌ **Recomendaciones**: "Productos frecuentemente comprados juntos"
- ❌ **Predicción de demanda** (ML básico con histórico)

#### UX general
- ❌ **Onboarding wizard** primer login
- ❌ **Tour guiado** con tooltips
- ❌ **Búsqueda global** (Ctrl+K spotlight-style)
- ❌ **Shortcuts de teclado** (F2 nueva venta, F3 buscar producto)
- ❌ **Modo "Caja rápida"** (UI minimalista para cajero)
- ❌ **Tema personalizable** (colores del negocio)
- ❌ **Múltiples idiomas** (hoy solo español)

#### Integraciones
- ❌ **Pago móvil API** (P2C bancos venezolanos)
- ❌ **Zelle / Binance Pay** integración
- ❌ **Mercado Pago / Stripe** para suscripción del SaaS
- ❌ **Google Drive / Dropbox** backup automático
- ❌ **Webhooks** para automatizaciones (Zapier-like)

#### Multi-sucursal real
- ❌ Hoy hay `locations` pero limitado a inventario
- ❌ **Consolidación financiera** multi-sucursal
- ❌ **Transferencias de stock** entre sucursales
- ❌ **Comparativa entre sucursales**

#### App móvil
- ⚠️ PWA funciona pero **app nativa** (React Native) sería más rápida para cajeros
- ❌ **Modo offline robusto** con sincronización al volver internet
- ❌ **Push notifications** reales (no solo in-app)

### 4.2 Lo que NO se debe agregar (riesgo legal)

Repaso rápido (detalle en sección 2.3):

- ❌ Facturación fiscal con número de control
- ❌ Cálculo automático de retenciones IVA/ISLR
- ❌ Conexión a impresoras fiscales homologadas
- ❌ Libros de Ventas/Compras formato SENIAT
- ❌ Firma digital fiscal

---

## 5. Roadmap por Fases

### Fase 0 — Reposicionamiento Legal (Semana 1)  ✅ COMPLETA
**Objetivo:** eliminar el riesgo legal antes de cualquier crecimiento.

**Esfuerzo:** 3-5 días de trabajo.

**Tareas:**
- [x] Eliminar "POS" del README, package.json, metadata
- [x] Cambiar "Invoice" → "Summary" en POS (`pos/page.tsx`)
- [x] Auditar `pos/page.tsx`, modales y emails: ningún "factura" en UI
- [x] Agregar disclaimer en comprobantes generados (`src/lib/receipt.ts`)
- [x] Reforzar `TERMS_OF_SERVICE.md` con cláusulas anti-uso-fiscal
- [ ] Actualizar nombre/descripción en stores (si está publicado) — *no aplica todavía, sin store activo*
- [x] Documentar en README la posición: "SaaS de gestión, NO fiscal"

**Entregable:** ✅ Producto blindado legalmente para escalar.

---

### Fase 1 — Apagar los Fuegos Técnicos (Semanas 2-3)  ✅ COMPLETA
**Objetivo:** estabilizar la base antes de construir encima.

**Esfuerzo:** 7-10 días.

**Del REFACTORING_PLAN.md ya identificado:**

- [x] **C1**: Reemplazar `setInterval` por `onSnapshot` en `cashClosing.service.ts` (luego ajustado a polling puro para evitar requerir índices compuestos — ver commit 3f6d29b)
- [x] **C2**: Paginación real en `getAllSales()` (cursor con `startAfter`)
- [x] **C3**: Paginar `getUsers()` (`getUsersPaginated`)
- [x] **C4**: Mover lógica Firebase Auth fuera de UI components (`auth.service.ts`)
- [x] **C5**: Centralizar `uploadBytes` en `storage.service.ts`
- [x] **A1**: Eliminar los `as any` con tipos correctos
- [x] **A2**: Tipar propiedad `location` en `Product`
- [x] **A4**: Eliminar `signIn()` dead code en AuthContext
- [x] **A5**: Partir el `useEffect` de POS en hooks especializados (`usePOSData`)

**Entregable:** ✅ Producto técnicamente sano, sin memory leaks, sin scans completos.

---

### Fase 2 — Cimientos para Emprendedores (Semanas 4-7)  ✅ COMPLETA
**Objetivo:** convertir Cuadra de "POS tracking" a "control financiero real".

**Esfuerzo:** 3-4 semanas.

#### 2.1 Costos y márgenes (Semana 4)
- [x] Agregar campo `costPrice` a `Product`
- [x] Calcular margen por producto en inventario
- [x] Mostrar margen en POS (gated por permiso `viewCosts`)
- [x] Reporte de margen por categoría (`MarginByCategoryCard`)

#### 2.2 Gastos operativos (Semana 5)
- [x] Nueva colección `expenses` en Firestore
- [x] CRUD de gastos con categorías (`src/services/expense.service.ts`, `/expenses`)
- [x] Categorías por defecto: Alquiler, Servicios, Sueldos, Inventario, Marketing, Otros
- [x] Reporte mensual de gastos
- [x] Cálculo de utilidad neta = Ingresos − Costos − Gastos (`NetProfitCard`)

#### 2.3 Compras y proveedores (Semanas 6-7)
- [x] Tipo `Supplier` + colección Firestore
- [x] CRUD de proveedores (`/suppliers`)
- [x] "Compras" como movimiento de inventario formal (`stock_movements` con reason)
- [x] Costo promedio ponderado (CPP) automático
- [x] Historial de precios de compra por producto
- [x] Cuentas por pagar (proveedores con saldo)

**Entregable:** ✅ Cuadra pasa de "veo cuánto vendí" a "veo cuánto gané".

---

### Fase 3 — Diferenciadores en LATAM (Semanas 8-10)  ✅ COMPLETA
**Objetivo:** features que enamoran a clientes venezolanos/latinos.

#### 3.1 WhatsApp Comprobantes (Semana 8)
- [x] Generar comprobante PDF al cerrar venta (`src/lib/receipt.ts:generateReceiptPdf`)
- [x] Botón "Enviar por WhatsApp" → `wa.me/<telefono>?text=...` (`buildWhatsAppUrl`)
- [x] Plantilla configurable del mensaje (`buildWhatsAppMessage`)
- [x] Disclaimer fiscal en el PDF

#### 3.2 Códigos de barras (Semana 9)
- [x] Lector con cámara del móvil (`BarcodeDetector` con fallback) — `src/hooks/useBarcodeScanner.ts`
- [x] Campo `barcode` en Product
- [x] Búsqueda en POS por escaneo (`BarcodeScannerModal`)
- [ ] Generación de etiquetas imprimibles — *diferido (opcional, no crítico)*

#### 3.3 Importación masiva (Semana 10)
- [x] Subir CSV/Excel con productos (`/inventory/import`)
- [x] Mapeo de columnas
- [x] Validación previa (productos duplicados, errores)
- [x] Import progresivo con feedback
- [x] Plantilla descargable

**Entregable:** ✅ Onboarding de clientes grandes sin fricción + ventaja competitiva real.

---

### Fase 4 — UX Premium (Semanas 11-13)  🟡 95% (email digest bloqueado por Blaze)
**Objetivo:** que un emprendedor sin formación técnica AME usar Cuadra.

#### 4.1 Onboarding Wizard (Semana 11)
- [x] Detector primer login (campo `onboardingCompletedAt` en `UserMetadata`)
- [x] Pasos: nombre del negocio → moneda → primer producto → primera venta
- [x] Tour con tooltips contextuales
- [x] "Saltar tutorial" siempre disponible
- [x] Re-acceso al tutorial desde Settings

#### 4.2 Dashboard rico (Semana 12)
- [x] Saludo personalizado por hora del día (`src/app/page.tsx:greeting`)
- [x] KPIs del día: ventas, transacciones, ticket promedio
- [x] Tendencia 7 días (mini-gráfico de barras)
- [x] Top 5 productos del mes
- [x] Top 5 clientes
- [x] Comparativa "vs. ayer", "vs. semana pasada", "vs. mes pasado"
- [x] Alertas inteligentes (sección 4.3)
- [x] **Proyección de fin de mes** (agregado en Fase 6.2.b)

#### 4.3 Alertas inteligentes (Semana 13)
- [x] Engine de alertas configurable (`src/lib/alerts.ts`)
- [x] Predefinidas: stock agotado, stock bajo, deudas > 30 días, ventas hoy < 50% del promedio, productos sin costo, **reorden sugerido** (Fase 6.2.c)
- 🟡 Notificación in-app: ✅ — **Email digest diario:** código completo en `functions/src/dailyDigest.ts`, export comentado en `functions/src/index.ts`. **Bloqueado por upgrade a plan Blaze** (requiere Secret Manager y Cloud Scheduler).

**Entregable:** ✅ Producto que abre y "te dice cosas útiles". UX que retiene. *(Email digest pendiente — ver tareas 33/35/36)*

---

### Fase 5 — Equipos y Operación (Semanas 14-16)  ✅ COMPLETA
**Objetivo:** que negocios con 2-10 empleados puedan usar Cuadra plenamente.

#### 5.1 Sub-roles y permisos granulares
- [x] Roles: `admingod`, `admin`, `owner`, `manager`, `supervisor`, `cashier`, `seller`, `staff` (legado) — `src/types/auth.ts`
- [x] Matriz de permisos: 13 acciones × 8 roles en `src/lib/permissions.ts` (`PERMISSIONS`, helper `can(role, action)`)
- [x] Hook `usePermission(action)` + `usePermissions([actions])` — aplicado en POS, inventario, reportes, gastos, proveedores
- [x] UI de asignación de rol en `/business/team/team` (selector inline en card de miembro)

#### 5.2 Comisiones
- [x] Configuración por staff: `commissionPct` en `UserMetadata` (0..100)
- [x] Cálculo automático: snapshot de `commissionPct` y `commissionAmount` en cada `Sale` (`SalesService.createSale`)
- [x] Reporte mensual de comisiones en `/reports` (card con selector de mes de los últimos 12)
- 🟡 Exportar a planilla de pago — *no implementado como botón dedicado; el reporte ya muestra los totales por miembro y se puede usar el export CSV/Excel general*
- ⏳ **Pendiente futuro**: comisión escalonada por meta (solo % plano por ahora)

#### 5.3 Turnos y sesiones
- [x] Múltiples sesiones de caja simultáneas (una por caja) — `CashSessionService.getOpenSessions` / `getOpenSessionForCashbox`
- [x] Apertura/cierre por turno con saldos (cada sesión scoped por `cashboxId`; las ventas se atribuyen al bucket correcto)
- [x] Comparativa entre turnos (historial de cierres en `/cash`)
- [x] Auditoría: `cashierId`/`cashierName` por sesión, `createdBy`/`creatorName` por venta

**Entregable:** ✅ Cuadra deja de ser solo para tiendas unipersonales y entra a negocios con equipo.

---

### Fase 6 — Inteligencia de Negocio (Semanas 17-20)  ✅ COMPLETA (con ítems diferidos)
**Objetivo:** que Cuadra te ayude a tomar decisiones, no solo a registrar.

#### 6.1 Reportes avanzados
- [x] Análisis ABC de productos (`ABCAnalysisCard` — clasifica A=80%, B=95%, C=resto)
- [x] Rotación de inventario (`InventoryTurnoverCard` — unidades vendidas / stock + días-de-cobertura)
- [x] Inventario valorizado (`InventoryValueCard` — stock total al costo y al precio de venta, % cobertura)
- ⏳ **Diferido**: Reporte de mermas y desperdicio — requiere modelo `shrinkage` (no existe). A construir como complemento de `stock_movements` con `reason: 'waste'` (parte ya está, falta UI dedicada)
- ⏳ **Diferido**: Reportes personalizables (selector de columnas + filtros) — alcance vago, sin requerimiento concreto del usuario
- ⏳ **Bloqueado**: Programar envío automático por email — depende del email digest (tareas 33/35) que requiere Blaze

#### 6.2 Predicción y recomendaciones
- [x] "Productos frecuentemente comprados juntos" (`FrequentlyBoughtTogetherCard` — co-ocurrencia ≥2 en misma venta)
- [x] Proyección de fin de mes basada en histórico (card en dashboard con avg diario × días del mes, comparación contra mes anterior)
- [x] Sugerencia de reorden por producto (`ReorderSuggestionCard` + alerta inteligente `reorder_suggested` cuando cobertura ≤7 días)

#### 6.3 Segmentación de clientes
- [x] Tags personalizables: `Client.tags?` con sugerencias (VIP, Mayorista, Moroso, Frecuente, Nuevo) + editor libre
- [x] Filtros y búsqueda avanzada: chips de tags clickeables al tope de `/clients` + combinación con búsqueda nombre/teléfono
- [x] Listas de marketing exportables: botón "Exportar CSV" en `/clients` que descarga la lista filtrada

**Entregable:** ✅ Cuadra ya no es un cuaderno digital — es un asesor financiero. *(Mermas y reportes personalizables pendientes — bajos en prioridad)*

---

### Fase 7 — Promociones y Pricing (Semanas 21-23)  ✅ COMPLETA
**Objetivo:** competir con POS empresariales en herramientas de venta.

- [x] Motor de reglas de promoción: 4 tipos en `Promotion.type` (`PERCENT_TOTAL`, `PERCENT_PRODUCT`, `BUY_X_GET_Y`, `BUNDLE`)
- [x] Listas de precios múltiples: `PriceList` aplicada por tag de cliente o lista específica
- [x] Cupones / códigos: `Coupon` (PERCENT o FIXED) con vigencia, monto mínimo, límite de usos y contador
- [x] Aplicación automática en POS: engine `applyPricing` (`src/lib/applyPricing.ts`) corre en `useMemo` al cambiar carrito/cliente/cupón; muestra subtotal, ahorro y total
- [x] Reporte de efectividad de cada promo: `PromotionEffectivenessCard` agrupa por promo/cupón con usos y ahorro

**Archivos clave**:
- `src/types/promotion.ts` — `Promotion`, `PriceList`, `Coupon`, `AppliedPromotion`
- `src/services/promotion.service.ts` — `PromotionService`, `PriceListService`, `CouponService`
- `src/lib/applyPricing.ts` — engine
- `src/app/business/pricing/page.tsx` — UI con 3 tabs (Promociones / Listas / Cupones)
- `src/app/pos/page.tsx` — input de cupón + display de promos aplicadas

**Entregable:** ✅ Cuadra compite con sistemas de US$200/mes a precio de SaaS.

---

### Fase 8 — Multi-sucursal Real (Semanas 24-27)  ✅ COMPLETA
**Objetivo:** habilitar negocios con 2+ tiendas.

- [x] Modelo de datos multi-location consolidado: `Product.stockByLocation?: Record<string, number>` autoritativo cuando existe; `stock` legacy como fallback. Sales deducen del bucket correcto según `Sale.locationId`
- [x] Transferencias de stock entre sucursales: `StockTransfer` + `StockTransferService.create` (transacción atómica) + página `/inventory/transfers` con historial y modal de creación
- [x] Reportes consolidados con drill-down por sucursal: selector "Todas las sucursales / [sucursales]" en cabecera de `/reports`
- [x] Permisos por sucursal: `UserMetadata.defaultLocationId?` → POS auto-selecciona la sucursal del usuario y la bloquea (read-only) para roles inferiores a manager
- [x] Dashboard comparativo: `LocationComparisonCard` en `/reports` con ingreso, por cobrar, conteo, % del total y última venta por sede

**Archivos clave**:
- `src/types/inventory.ts` — `stockByLocation`
- `src/lib/stock.ts` — helpers `getTotalStock`, `getStockAtLocation`, `buildStockDeduction`, `buildStockAddition`
- `src/types/stockTransfer.ts` + `src/services/stockTransfer.service.ts`
- `src/app/inventory/transfers/page.tsx`
- `src/services/sales.service.ts` — deducción multi-sucursal en `createSale`

**Entregable:** ✅ Producto enterprise-ready en Venezuela y LATAM.

---

### Fase 9 — App Móvil Nativa (Mes 7+)  ❌ NO INICIADA
**Objetivo:** experiencia de cajero superior al PWA.

- [ ] React Native (compartir lógica de servicios con web)
- [ ] Offline-first con cola de sincronización
- [ ] Push notifications nativas
- [ ] Lector de barras con hardware del móvil (más rápido)
- [ ] App Store + Play Store

**Consideración antes de empezar**: la PWA actual cumple razonablemente bien (BarcodeDetector funcional, cache offline parcial vía Workbox). Evaluar si el costo/beneficio justifica la inversión antes de iniciar. Posibles disparadores: feedback claro de cajeros pidiendo velocidad nativa o offline robusto, o necesidad de push real.

**Entregable:** Cuadra en el bolsillo de cada vendedor.

---

### Fase 10 — Ecosistema (Mes 9+)  ❌ NO INICIADA
**Objetivo:** Cuadra como plataforma, no solo producto.

- [ ] Webhooks para automatización
- [ ] API pública para integraciones
- [ ] Marketplace de plantillas (rubros: tienda, restaurante, panadería)
- [ ] Integraciones nativas (Pago móvil, Zelle, Mercado Pago, contadores)
- [ ] Cuadra Academy (cursos cortos en YouTube)

**Entregable:** Cuadra como ecosistema, no solo SaaS.

---

## 6. Quick Wins — Primer Mes  ✅ TODO COMPLETADO

Acciones de alto impacto y bajo esfuerzo para los primeros 30 días:

| Semana | Acción | Esfuerzo | Impacto | Estado |
|---|---|---|---|---|
| 1 | Reposicionamiento legal (Fase 0) | 3 días | 🔥🔥🔥 | ✅ |
| 1 | Eliminar "Invoice" en POS y reemplazar por "Summary" | 1 hora | 🔥 (legal) | ✅ |
| 2 | Fix `setInterval` → `onSnapshot` (C1) | 1 día | 🔥🔥 (costos) | ✅ |
| 2 | Paginación real en `getAllSales` (C2) | 1 día | 🔥🔥 (performance) | ✅ |
| 3 | Dashboard mejorado con tendencias | 4-5 días | 🔥🔥🔥 (retención) | ✅ |
| 3 | Búsqueda global `Ctrl+K` | 3 días | 🔥🔥 (UX) | 🟡 *parcial: búsqueda existe por sección, no hay paleta global* |
| 4 | Comprobante PDF + botón WhatsApp | 4 días | 🔥🔥🔥 (diferenciador) | ✅ |

**Resultado actual (mes 8):** Producto sin riesgo legal, técnicamente sano, con features de Fases 2-8 entregadas. Lo único pendiente del original es la paleta global `Ctrl+K` (opcional — bajo prioridad).

---

## 7. Estrategia de Monetización

### Modelo recomendado: Freemium + Tiers

#### Plan Free (US$0/mes)
- 1 usuario (owner)
- 1 caja
- Hasta 50 productos
- Hasta 100 ventas/mes
- Soporte por FAQ

**Objetivo:** captación. Que prueben sin fricción.

#### Plan Emprendedor (US$10/mes)
- Owner + 2 staff
- 1 sucursal, 3 cajas
- Productos ilimitados
- Ventas ilimitadas
- WhatsApp comprobantes
- Importación CSV
- Soporte email

**Objetivo:** convertir prueba a pago. Sweet spot del SaaS.

#### Plan Negocio (US$25/mes)
- Owner + 10 staff
- 1 sucursal
- Todo lo del Emprendedor +
- Compras y proveedores
- Costos y márgenes
- Gastos operativos
- Comisiones
- Reportes avanzados
- Soporte WhatsApp prioritario

**Objetivo:** monetizar bien el comerciante medio.

#### Plan Multi-tienda (US$60/mes por sucursal)
- Multi-sucursal con consolidación
- Transferencias entre tiendas
- Reportes comparativos
- API de webhooks
- Soporte dedicado

**Objetivo:** premium para negocios establecidos.

### Métricas objetivo

| Métrica | Año 1 | Año 2 |
|---|---|---|
| Usuarios free | 1,000 | 5,000 |
| Usuarios pagos | 100 | 600 |
| ARPU | US$15/mes | US$20/mes |
| MRR | US$1,500 | US$12,000 |
| Churn mensual | <8% | <5% |

---

## 8. KPIs y Métricas de Éxito

### Métricas de producto

| Métrica | Cómo medir | Target |
|---|---|---|
| **Activation rate** | Usuarios que completan primera venta tras registro | >60% |
| **DAU/MAU** | Usuarios activos diarios sobre mensuales | >40% |
| **Retención D7** | % usuarios que vuelven al 7º día | >40% |
| **Retención D30** | % usuarios que vuelven al día 30 | >25% |
| **Time to first sale** | Tiempo desde registro hasta primera venta | <10 min |

### Métricas de negocio

| Métrica | Cómo medir | Target |
|---|---|---|
| **CAC** | Costo de adquisición por usuario pago | <US$30 |
| **LTV** | Lifetime value de un cliente pago | >US$300 |
| **LTV/CAC** | Eficiencia de adquisición | >10x |
| **Churn mensual** | % usuarios que cancelan | <5% |
| **NPS** | Net Promoter Score | >50 |

### Métricas técnicas

| Métrica | Cómo medir | Target |
|---|---|---|
| **Tiempo de carga** | Lighthouse Performance | >90 |
| **Error rate** | % requests que fallan | <0.5% |
| **Uptime** | Firebase status | >99.9% |
| **Costos Firestore** | $/usuario activo/mes | <US$0.20 |

---

## 9. Riesgos y Mitigaciones

### Riesgo 1: Confusión con sistema fiscal
- **Probabilidad:** Media
- **Impacto:** Alto (multas, suspensión)
- **Mitigación:** Fase 0 (reposicionamiento). Disclaimer en cada comprobante. Términos legales reforzados.

### Riesgo 2: Costos de Firestore escalando mal
- **Probabilidad:** Alta (si no se arregla deuda técnica)
- **Impacto:** Alto (puede destruir el unit economics)
- **Mitigación:** Fase 1 (paginación, onSnapshot eficiente). Caché en cliente. Monitoreo de reads/writes.

### Riesgo 3: Churn alto por falta de features
- **Probabilidad:** Media
- **Impacto:** Alto (no se construye negocio recurrente)
- **Mitigación:** Fase 2-4 con features de retención (margen real, alertas, dashboard).

### Riesgo 4: Competencia local (Treble, Reservar, etc.)
- **Probabilidad:** Alta
- **Impacto:** Medio
- **Mitigación:** Diferenciadores: BCV automático, créditos, dual currency, WhatsApp. Marca fuerte ("Cuadra = Cuadre").

### Riesgo 5: Dependencia técnica de Firebase
- **Probabilidad:** Baja
- **Impacto:** Alto (vendor lock-in)
- **Mitigación:** Capa de servicios bien definida (ya existe). Eventual migración a Supabase posible si Firebase encarece.

### Riesgo 6: Crisis económica en Venezuela
- **Probabilidad:** Constante
- **Impacto:** Medio
- **Mitigación:** Cuadra dolarizado. Expansión LATAM (Colombia, Perú) en Año 2.

---

## 10. Anexos Técnicos

### A.1 Estructura del grafo de conocimiento

- **Total**: 385 nodos · 802 aristas · 37 comunidades
- **Extracción**: 93% EXTRACTED · 7% INFERRED
- **God nodes principales**:
  1. `useAuth()` — 43 aristas
  2. `Button` — 20 aristas
  3. `useCurrency()` — 19 aristas
  4. `Card()` — 17 aristas
  5. `UserService` — 12 aristas
  6. `SalesService` — 11 aristas

### A.2 Comunidades clave detectadas

- **Core App & Auth Context** (23 nodos)
- **Legal & Compliance Docs** (42 nodos) — bien aislado, buena señal
- **Cash Register & Closing** (18 nodos)
- **Clients & Cart Management** (17 nodos)
- **Pages & Navigation** (25 nodos)

### A.3 Stack actual

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Moderno ✅ |
| Backend | Firebase Cloud Functions | Serverless ✅ |
| DB | Cloud Firestore | OK para escala media |
| Auth | Firebase Auth + Custom Claims | Sólido ✅ |
| PWA | `@ducanh2912/next-pwa` + Workbox | Funcional ✅ |
| Charts | recharts | Limitado para reportes avanzados |
| Export | xlsx + jspdf | OK |
| Type system | TypeScript estricto | 11 `as any` por limpiar ⚠️ |

### A.4 Estimación de esfuerzo total

| Fase | Duración | Esfuerzo (días-persona) |
|---|---|---|
| Fase 0: Legal | 1 semana | 3-5 |
| Fase 1: Deuda técnica | 2 semanas | 7-10 |
| Fase 2: Costos/Gastos/Compras | 4 semanas | 15-20 |
| Fase 3: Diferenciadores | 3 semanas | 10-15 |
| Fase 4: UX Premium | 3 semanas | 10-15 |
| Fase 5: Equipos | 3 semanas | 10-15 |
| Fase 6: Inteligencia | 4 semanas | 15-20 |
| Fase 7: Promociones | 3 semanas | 10-15 |
| Fase 8: Multi-sucursal | 4 semanas | 15-20 |
| Fase 9: App nativa | 6+ semanas | 25-35 |
| Fase 10: Ecosistema | 8+ semanas | 30+ |
| **TOTAL** | **~10 meses** | **~150-200 días-persona** |

Con un desarrollador full-time: ~10-12 meses para tener todas las fases 0-8.
Con un equipo de 2-3: 5-6 meses.

### A.5 Decisiones arquitecturales pendientes

| Decisión | Opciones | Recomendación |
|---|---|---|
| Estado global | Context API (actual) vs Zustand vs Redux | Mantener Context, agregar Zustand solo si carrito crece |
| Backend long-term | Firebase vs Supabase vs custom | Firebase mientras unit economics aguante |
| Pagos del SaaS | Stripe vs Lemon Squeezy vs Paddle | Lemon Squeezy (handle taxes globales) |
| Email transaccional | Resend vs SendGrid vs Firebase | Resend (developer-friendly, barato) |
| Analytics | PostHog vs Mixpanel vs Plausible | PostHog (open source + product analytics) |
| Error monitoring | Sentry vs LogRocket | Sentry (estándar) |

---

## 11. Estado de Archivos Clave por Fase (Fases 5-8)

**Última actualización: 2026-05-13** — Compilación limpia verificada. Todas las Fases 0-8 entregadas con `npx tsc --noEmit` exit 0.

### Fase 5: Sub-roles y Multi-caja

#### Tipos y permisos
| Archivo | Estado | Descripción |
|---|---|---|
| `src/types/auth.ts` | ✅ Completo | UserMetadata extendida con `commissionPct` (0-100) y `defaultLocationId` (sucursal por defecto del staff). Todos los 8 roles tipados (`admingod`, `admin`, `owner`, `manager`, `supervisor`, `cashier`, `seller`, `staff`) |
| `src/lib/permissions.ts` | ✅ Completo | Matriz PERMISSIONS[13 actions × 8 roles]. Helper `can(role, action)` para verificación. Acciones: `viewReports`, `editPromotions`, `managePricing`, `viewCosts`, `applyCoupon`, `applyDiscount`, `anulSale`, `viewCashClosing`, `manageCashSession`, `manageStaff`, `viewClients`, `editProduct`, `viewAnalytics` |
| `src/hooks/usePermission.ts` | ✅ Completo | Hook `usePermission(action)` retorna boolean. Hook `usePermissions(actions)` retorna Record de booleans. Se usa para gating condicional de UI y lógica crítica (ej: botón "Anular" solo si `can(role, 'anulSale')`) |

#### UI y servicios
| Archivo | Estado | Descripción |
|---|---|---|
| `src/app/business/team/team/page.tsx` | ✅ Completo | Página `/business/team/team`. Card por miembro con: nombre, email, rol (selector dropdown inline), % comisión (input numérico 0-100), acciones (editar, eliminar). Modal de creación de nuevo staff. Validación de emails únicos. Integración con `UserService.updateUser()` para persistencia |
| `src/services/cashSession.service.ts` | ✅ Completo | Métodos: `getOpenSessions()` (retorna array de CashSession activas por location), `getOpenSessionForCashbox(cashboxId)` (retorna sesión para caja específica), `createSession()`, `closeSession()`. Multi-sesión: cada caja puede tener su sesión independiente simultáneamente |
| `src/types/cashSession.ts` | ✅ Completo | Interface CashSession con: id, location, cashboxId, cashierId, cashierName, openedAt, closedAt, openingBalance, closingBalance, status (`open` \| `closed`) |
| `src/app/pos/page.tsx` | ✅ Completo | POS auto-selecciona `user.defaultLocationId` en carga. Selector de localidad bloqueado (read-only) para roles < manager. Cash session scoped por `cashboxId`. Comisión mostrada en UI (snapshot de `commissionPct` al momento de venta) |

---

### Fase 6: Inteligencia de Negocio

#### Reportes y análisis
| Archivo | Estado | Descripción |
|---|---|---|
| `src/app/reports/page.tsx` | ✅ Completo | 9+ cards de análisis. **ABCAnalysisCard**: clasifica productos por contribución a ingresos (A=top 80%, B=95%, C=resto). **InventoryTurnoverCard**: unidades vendidas / stock + días-de-cobertura. **InventoryValueCard**: stock total al costo vs. precio venta, % de cobertura. **FrequentlyBoughtTogetherCard**: co-ocurrencia ≥2 en misma venta. **PromotionEffectivenessCard**: agrega promo/cupón con usos y ahorro. **LocationComparisonCard**: revenue, pending, count, % del total por sede. **CommissionReportCard**: comisiones por staff con selector de mes. Todas soportan filtros de fecha, ubicación (multi-select), estado |
| `src/app/page.tsx` (dashboard) | ✅ Completo | KPIs diarios: ventas, transacciones, ticket promedio. Mini-gráfico tendencia 7 días. Top 5 productos y clientes del mes. Comparativas vs. ayer/semana pasada/mes pasado. **Proyección de fin de mes**: promedio diario × días restantes del mes, comparación contra mes anterior |
| `src/app/clients/page.tsx` | ✅ Completo | Tags personalizables en `Client.tags` (sugerencias: VIP, Mayorista, Moroso, Frecuente, Nuevo). Chips clickeables al tope como filtros combinables. Exportar CSV con lista filtrada. Búsqueda por nombre/teléfono |
| `src/lib/alerts.ts` | ✅ Completo | Engine configurable de alertas predefinidas: `stock_out`, `stock_low`, `debt_overdue`, `low_sales`, `product_no_cost`, `reorder_suggested` (cuando cobertura ≤7 días). Retorna array de Alert con kind, message, severity (`info` \| `warning` \| `critical`) |

---

### Fase 7: Promociones y Pricing

#### Tipos y engine
| Archivo | Estado | Descripción |
|---|---|---|
| `src/types/promotion.ts` | ✅ Completo | **Promotion**: 4 tipos (`PERCENT_TOTAL` = % del total, `PERCENT_PRODUCT` = % de producto específico, `BUY_X_GET_Y` = lleva X paga Y, `BUNDLE` = combo). Campos: id, type, name, description, discountValue, applicableProducts[], applicableClientTags[], validFrom, validTo, active, createdAt, updatedAt. **PriceList**: id, name, tag (apply por tag de cliente), items (product-id → price), applicableClientTags[], createdAt. **Coupon**: id, code, type (PERCENT \| FIXED), value, minOrder, maxUses, usedCount, validFrom, validTo, active. **AppliedPromotion**: promo/coupon que se aplicó + amountSaved |
| `src/services/promotion.service.ts` | ✅ Completo | `PromotionService`: CRUD (create, update, delete, getActive). `PriceListService`: CRUD + subscribeToLists(). `CouponService`: CRUD + validateCoupon() (check vigencia, usos, orden mínima) + incrementUsedCount(). Uso en Firestore: colecciones `/businesses/{biz}/promotions`, `/businesses/{biz}/priceLists`, `/businesses/{biz}/coupons` |
| `src/lib/applyPricing.ts` | ✅ Completo | Engine principal de pricing. **Orden de aplicación (IMPORTANTE)**: 1) Price lists (override por tag de cliente), 2) Promotions (% o descuento de producto específico), 3) Promotions totales (% del total), 4) Cupones last (PERCENT o FIXED). Retorna: items con precios ajustados, applied[] array, totalSavings. Usado en useMemo en POS para recálculo reactivo |
| `src/hooks/usePricingData.ts` | ✅ Completo | Hooks: `usePrices()` (suscripción a listas), `usePromotions()`, `useCoupons()`. cada uno retorna datos + loading + error |

#### UI
| Archivo | Estado | Descripción |
|---|---|---|
| `src/app/business/pricing/page.tsx` | ✅ Completo | Ruta `/business/pricing` con 3 tabs: **Promociones** (tabla de promos activas + modal create/edit), **Listas de precios** (tabla + modal), **Cupones** (tabla + modal). Cada tab tiene: filtros de estado (activo/inactivo), búsqueda por nombre, botones de acción (editar, eliminar, duplicar). Form validations (fechas coherentes, valores positivos) |
| `src/app/pos/page.tsx` (actualizado) | ✅ Completo | Input de cupón al pie del carrito. Al ingresar código: validateCoupon() → si válido, aplicar con applyPricing(). Display de savings desglosado (ahorro por tipo de promo + cupón). Mostrar subtotal, total y ahorro total. Integración con `createSale()` para registrar `appliedPromotions` array en cada venta |

---

### Fase 8: Multi-sucursal Real

#### Tipos y helpers
| Archivo | Estado | Descripción |
|---|---|---|
| `src/types/inventory.ts` | ✅ Completo | **Product** extendido con `stockByLocation?: Record<string, number>` (ej: `{ "loc1": 10, "loc2": 15 }`). Cuando existe stockByLocation, es autoritativo; si no, fallback a legacy `stock`. Permite migración gradual sin breakage |
| `src/lib/stock.ts` | ✅ Completo | **getTotalStock(product)**: suma todos los buckets de stockByLocation o retorna legacy stock. **getStockAtLocation(product, locationId)**: obtiene stock para sucursal específica. **buildStockDeduction(product, qty, locationId)**: genera patch Firestore que decrementa stockByLocation[locationId] o stock (según exista). **buildStockAddition(product, qty, locationId)**: incrementa buckets. Todos con guards para no ir negativo |
| `src/types/stockTransfer.ts` | ✅ Completo | **StockTransfer**: id, originLocationId, destinationLocationId, createdBy, createdAt, items (StockTransferItem[]), status (`pending` \| `completed`). **StockTransferItem**: productId, productName, quantity, unitCost (opcional), notes |

#### Servicios y UI
| Archivo | Estado | Descripción |
|---|---|---|
| `src/services/stockTransfer.service.ts` | ✅ Completo | `StockTransferService.create(transfer)`: transacción atómica que 1) decrementa origin con buildStockDeduction(), 2) incrementa destination con buildStockAddition(), 3) auto-migra legacy stock en primer transfer. Validations: verifica stock suficiente en origen antes de decrementar. Firestore path: `/businesses/{biz}/stockTransfers` |
| `src/app/inventory/transfers/page.tsx` | ✅ Completo | Ruta `/inventory/transfers`. **Tabla**: historial de transfers con origen, destino, fecha, items, status. **Modal de creación**: selector de origen/destino (locations), búsqueda y agregar productos con cantidad, mostrar stock disponible en origen. Validación: no permitir transfer si stock < cantidad. Botón confirmar → `StockTransferService.create()` |
| `src/services/sales.service.ts` (modificado) | ✅ Completo | En `createSale()`: deducción de stock now usa `buildStockDeduction(product, qty, sale.locationId)` en lugar de decremento genérico. Respeta multi-location buckets. Si sale.locationId es null, fallback a legacy behavior |

#### Reportes y permisos
| Archivo | Estado | Descripción |
|---|---|---|
| `src/app/reports/page.tsx` (actualizado) | ✅ Completo | Selector "Todas las sucursales / [list]" en cabecera. Todos los cards adaptan cálculos al filtro seleccionado. **LocationComparisonCard**: tabla con revenue, pending, count de operaciones, % del total, fecha última venta por sede. Permite drill-down a detalle de sucursal |
| `src/types/auth.ts` (ref anterior) | ✅ Completo | `UserMetadata.defaultLocationId?` asignable al staff. En POS: si user.defaultLocationId existe y role < manager, ubicación bloqueada en selector (read-only). Permite que cajero de sucursal 1 no vea/registre ventas en sucursal 2 |

---

### Fix: Reglas de Seguridad Firestore (2026-05-13)

**Problema encontrado**: Error "Missing or insufficient permissions" en snapshot listeners

**Causa**: Nuevas colecciones de Fases 2, 5-8 sin reglas de seguridad definidas:
- `expenses` (Fase 2: Gastos operativos)
- `suppliers` (Fase 2: Proveedores)
- `promotions` (Fase 7: Promociones)
- `priceLists` (Fase 7: Listas de precios)
- `coupons` (Fase 7: Cupones)
- `stockTransfers` (Fase 8: Transferencias)

**Solución implementada**:
✅ Agregadas reglas de seguridad siguiendo el patrón existente:
- `read`: `ownerIdMatches` o `isAdminGod`
- `create`: `isAuthenticated` + `ownerIdMatches`
- `update`: `ownerIdMatches`
- `delete`: `isAdminGod` o (owner con UID coincidente)

✅ Deploy a Firebase realizado exitosamente: `firebase deploy --only firestore:rules`

---

### Auditoría de Navegación (2026-05-13)

Se verificó que todas las páginas de Fases 5-8 sean accesibles en **desktop y mobile**:

✅ **Cambios realizados en navbar/sidebar:**
1. **Inventario** ahora es un submenu con:
   - **Gestión** → `/inventory` (gestión básica de productos)
   - **Transferencias** → `/inventory/transfers` (Fase 8: transfers entre sucursales)
   - **Importar** → `/inventory/import` (Fase 3: CSV bulk import)

2. **Pricing & Promos** agregado al submenu "Más":
   - `/business/pricing` (Fase 7: Promociones, listas de precios, cupones)

✅ **Cobertura actual:**
- **Desktop**: sidebar expandible/colapsable con navegación jerárquica en tiempo real
- **Mobile**: bottom pill navigation + "Más opciones" sheet modal que muestra todos los submenús
- Todos los accesos funcionan en ambas vistas sin fricción

---

### Resumen de Estado Técnico

**Todas las Fases 5-8 compilan sin errores TypeScript:**
```bash
npx tsc --noEmit
# exit 0 ✅
```

**Dependencias agregadas durante Fases 5-8:**
- Ningunas nuevas (se usaron libs ya existentes: React hooks, Firestore SDK, recharts, etc.)

**Patrones aplicados consistentemente:**
- Service layer pattern (cada feature con `.service.ts`)
- Context API para estado global (Auth, Currency)
- Firestore transactions para operaciones atómicas (stock transfers)
- Tipado fuerte sin `as any` casts
- Componentes funcionales con hooks
- Validación en boundaries (user input, Firestore writes)

**Código zombie / deuda técnica identificada:**
- 95 nodos aislados en grafo (revisar en `/src` si hay componentes sin uso)
- `useEffect` en componentes de página podría beneficiarse de custom hooks adicionales
- POS aún importa múltiples servicios directamente (posible refactor a custom hook `usePOS()`)

---

## Cierre

Cuadra tiene una **base técnica sólida** y un **posicionamiento de nicho real** (Venezuela + emprendedores + dual currency). Las brechas son normales para un producto en su fase actual — lo importante es **construir con foco**:

1. **Resolver el riesgo legal primero** (semana 1)
2. **Estabilizar la base técnica** (semanas 2-3)
3. **Construir lo que un emprendedor necesita** (semanas 4+): costos, compras, gastos, dashboard, WhatsApp
4. **Iterar con feedback real** de usuarios pagos

El objetivo no es competir con SAP o Odoo. Es ser **"el mejor compañero del emprendedor latinoamericano"** — simple, rápido, en su moneda, con su realidad operativa.

> "Cuadra: tu negocio bajo control. Sin dolores de cabeza fiscales. Sin curva de aprendizaje. En la moneda que tú quieras."

---

*Documento vivo. Actualizar cada 30 días con métricas reales y aprendizajes.*
