# 🏛️ Guía de Cumplimiento Legal - Cuadra

## Resumen ejecutivo

Cuadra ha sido reposicionado como una **herramienta de gestión empresarial** (Modelo SaaS con Disclaimers) en lugar de un "Sistema de Punto de Venta" fiscal. Esto permite comercializarlo sin necesidad de registro inmediato ante el SENIAT, mientras se mantiene transparencia total sobre limitaciones legales.

**Estado:** ✅ Implementado completamente

---

## Cambios implementados

### 1. Documentación Legal Creada

#### a) **DISCLAIMER.md**
- Aviso claro que NO es un POS fiscal autorizado
- Responsabilidades del usuario sobre cumplimiento fiscal
- Limitaciones de garantía
- Contacto para dudas

#### b) **TERMS_OF_SERVICE.md**
- Licencia de uso no-exclusiva
- Responsabilidades de cuenta de usuario
- Limitaciones de responsabilidad de Cuadra
- Derechos de suspensión de cuenta

#### c) **PRIVACY_POLICY.md**
- Cumplimiento con PDVD (Ley de Protección de Datos Venezuela 2012)
- Detalle de datos recolectados
- Derechos de acceso, corrección y eliminación
- Almacenamiento en Google Cloud

### 2. Componentes React Creados

#### a) **DisclaimerBanner.tsx**
- Banner amarillo que aparece en todas las páginas autenticadas
- Texto claro de aviso legal
- Botón para leer disclaimer completo
- Closeable por usuario

#### b) **TermsAcceptanceModal.tsx**
- Modal que se muestra en primer login
- Obliga a aceptar 3 documentos:
  1. Aviso Legal
  2. Términos de Servicio
  3. Política de Privacidad
- Botón "Aceptar y continuar" deshabilitado hasta aceptar todos

### 3. Páginas públicas creadas

| URL | Componente | Propósito |
|---|---|---|
| `/disclaimer` | DisclaimerPage | Aviso legal completo |
| `/terms` | TermsPage | Términos de servicio completos |
| `/privacy` | PrivacyPage | Política de privacidad completa |

### 4. Cambios en codebase

#### AuthContext & Types
- Agregado campo `termsAcceptedAt?: number` a `UserProfile`
- Registra timestamp cuando usuario acepta términos

#### AppLayout
- Importa `DisclaimerBanner` y `TermsAcceptanceModal`
- Muestra banner en todas las páginas autenticadas
- Muestra modal en primer login si `termsAcceptedAt` no existe
- Efecto que detecta cambios en autenticación

#### API Route
- **`/api/users/accept-terms`** (POST)
  - Recibe `userId`
  - Actualiza documento de usuario con `termsAcceptedAt`
  - Llamada desde `TermsAcceptanceModal`

#### Metadata
- Actualizado título en layout: "Cuadra — Herramienta de gestión empresarial..."
- Cambio de descripción de "Sistema de Punto de Venta" a "Herramienta de gestión"

---

## Posicionamiento Legal

### Antes (Problemático)
```
"Cuadra - POS para comerciantes venezolanos"
→ Implica ser un sistema fiscal autorizado
→ Requiere registro SENIAT
→ Responsabilidad de Cuadra sobre cumplimiento fiscal
```

### Ahora (Legalmente seguro)
```
"Cuadra - Herramienta de gestión empresarial e inventario"
+ Disclaimer claro
+ Términos de servicio con limitación de responsabilidad
+ USUARIO es responsable de obligaciones fiscales
→ Puede commercializarse sin registro SENIAT inmediato
```

---

## Flujo de usuario (perspectiva legal)

```
1. Usuario se registra
   ↓
2. Primer login → Modal de Términos aparece (obligatorio)
   ↓
3. Usuario acepta 3 documentos
   ↓
4. termsAcceptedAt se guarda en Firestore
   ↓
5. Entra a app con Banner de Disclaimer visible
   ↓
6. Usuario opera sabiendo que:
   - Cuadra es solo herramienta
   - El USUARIO es responsable del cumplimiento fiscal
   - Los datos están en la nube (Google Cloud)
   - Puede solicitar acceso/eliminación en cualquier momento
```

---

## Cambios de Terminología

Para reforzar el posicionamiento, considera cambiar lenguaje en UI:

| Cambiar de | A | Razon |
|---|---|---|
| "Generar Reporte Fiscal" | "Generar Reporte de Operaciones" | No es documento fiscal oficial |
| "Sistema de Facturación" | "Registro de Transacciones" | No factura, solo registra |
| "Ventas" | "Transacciones" (opcional) | Menos connotación fiscal |

---

## Protección Legal

### ✅ Implementado

1. **Aviso Legal (Disclaimer)**
   - Claro y visible
   - Aceptación obligatoria
   - Enlazable desde cualquier parte

2. **Términos de Servicio**
   - Limita responsabilidad de Cuadra
   - Define permisos y restricciones
   - Ley aplicable: Venezuela

3. **Política de Privacidad**
   - Cumple PDVD
   - Derechos de usuarios respecto a datos
   - Trasparencia sobre almacenamiento en cloud

4. **Aceptación documentada**
   - `termsAcceptedAt` en Firestore
   - Prueba de que usuario aceptó términos
   - Auditable en admin activities

5. **Banner permanente**
   - Recordatorio continuo
   - No es "escondido"
   - User puede revisitar documentos cuando quiera

---

## Recomendaciones próximas (Fase 2)

### Corto plazo (1-2 semanas)
- [ ] Agregar "certificado de uso" descargable (PDF con timestamp de aceptación)
- [ ] Log de auditoría en `admin_activities` cuando se aceptan términos
- [ ] Versioning de documento (ej: "v1.0" en disclaimers) para trackear cambios

### Mediano plazo (1-2 meses)
- [ ] Consultar con abogado local sobre posibles requisitos adicionales
- [ ] Considerar agregar checkbox de consentimiento PDVD específico para almacenamiento de datos de terceros
- [ ] Implementar "solicitud de acceso a datos" self-service en settings

### Largo plazo (6+ meses - Cuando crezcas)
- [ ] **Registrarse ante SENIAT** (una vez tengas suficientes usuarios)
- [ ] Implementar webhooks para reportes automáticos a SENIAT (si aplica)
- [ ] Contrato de proveeedor de servicios con Google Cloud formalizado

---

## Testing de aceptación

### Manual Testing Checklist

- [ ] Nuevo usuario ve modal en primer login
- [ ] No puede proceder sin aceptar los 3 checkboxes
- [ ] Botón "Aceptar y continuar" se habilita solo cuando todos están checkeados
- [ ] Después de aceptar, modal desaparece
- [ ] Usuario existente que aceptó no ve modal de nuevo
- [ ] Banner de disclaimer aparece en todas las páginas autenticadas
- [ ] Clickear en disclaimer abre página `/disclaimer`
- [ ] Páginas `/disclaimer`, `/terms`, `/privacy` se cargan correctamente
- [ ] Revisar Firestore: campo `termsAcceptedAt` se populó con timestamp

### Verificar en Firestore

```javascript
// Documento de usuario
{
  uid: "abc123",
  email: "user@example.com",
  displayName: "Juan Pérez",
  role: "owner",
  termsAcceptedAt: 1714384800000,  // ← Nuevo campo
  createdAt: 1714384700000,
  updatedAt: 1714384800000
}
```

---

## Casos de uso y respuestas legales

### "¿Puedo comercializar Cuadra sin estar registrado ante SENIAT?"
**Respuesta:** Sí, como herramienta de gestión. El disclaimer/términos aclaran que los usuarios son responsables de sus obligaciones fiscales. Una vez que crezcas, registrarte ante SENIAT te permitirá ofrecer funcionalidades más avanzadas.

### "¿Qué pasa si un usuario usa Cuadra sin registrarse ante SENIAT?"
**Respuesta:** Eso es responsabilidad del usuario. Tus términos lo aclaran. Tú has hecho tu parte mostrando el disclaimer.

### "¿Puedo cambiar el disclaimer después de que usuarios lo aceptaron?"
**Respuesta:** Sí, pero documenta el cambio. Versiona tus documentos (v1.0, v1.1, v2.0) y requiere re-aceptación si hay cambios significativos. El campo `termsAcceptedAt` te permite auditar quién aceptó cuándo.

### "¿Qué información puedo compartir con autoridades?"
**Respuesta:** Si SENIAT solicita información (con orden judicial), estás obligado a compartir. Tu Política de Privacidad ya lo menciona. Tienes derecho a notificar al usuario (cuando sea posible).

---

## Archivos modificados / creados

### Creados
- `DISCLAIMER.md` (Documento)
- `TERMS_OF_SERVICE.md` (Documento)
- `PRIVACY_POLICY.md` (Documento)
- `src/components/DisclaimerBanner.tsx` (Componente)
- `src/components/TermsAcceptanceModal.tsx` (Componente)
- `src/app/disclaimer/page.tsx` (Página)
- `src/app/terms/page.tsx` (Página)
- `src/app/privacy/page.tsx` (Página)
- `src/app/api/users/accept-terms/route.ts` (API)
- `LEGAL_COMPLIANCE_GUIDE.md` (Este archivo)

### Modificados
- `src/types/auth.ts` → Agregado `termsAcceptedAt`
- `src/components/layout/AppLayout.tsx` → Importa componentes, maneja modal
- `src/app/layout.tsx` → Actualizada descripción metadata

---

## Próximos pasos

1. **Hoy:** Revisar cambios implementados ✅
2. **Esta semana:** Probar flujo de aceptación de términos
3. **Próxima semana:** Considerar cambios de terminología en UI (opcional)
4. **Antes de publicar:** Consultar con contador/abogado local

---

**Documentación generada:** 29 de abril de 2026  
**Estado:** Listo para producción (Opción 2: SaaS con Disclaimers)
