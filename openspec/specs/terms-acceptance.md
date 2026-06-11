# Spec: Aceptación de Términos y Condiciones

**Dominio:** auth / legal  
**Última actualización:** 2026-06-09

---

## Contexto

CUADRA requiere que cada usuario acepte los Términos y Condiciones, Política de Privacidad y Disclaimer antes de operar la plataforma. La aceptación se registra en el campo `terms_accepted` (backend) / `termsAccepted` (frontend) del perfil del usuario.

---

## Flujo normal — primer ingreso

```
Given un usuario recién registrado (termsAccepted = false)
When entra a cualquier ruta protegida por AppLayout
Then el modal de términos se muestra automáticamente (no puede cerrarse)
 And el usuario puede navegar entre las tres pestañas: Términos, Privacidad, Disclaimer
 And al hacer clic en "De acuerdo" se guarda termsAccepted = true en backend
 And el modal se cierra y el usuario puede operar normalmente
```

---

## Flujo de registro

```
Given un usuario nuevo en la página /auth/register
When completa el formulario y hace clic en "Crear Cuenta"
Then la creación de la cuenta implica aceptación de términos
 And NO se requiere checkbox explícito en el formulario
 And el aviso "Al crear tu cuenta aceptas nuestros Términos" aparece debajo del form
 And al entrar al panel, AppLayout muestra el modal de términos para que los lea
```

---

## Actualización de términos (caso controlado)

```
Given que los T&C han sido actualizados y el admin decide forzar re-aceptación
When el admin/admingod resetea termsAccepted = false para los usuarios afectados
 (vía UserService.syncUserMetadata o desde el panel de admin)
Then en el próximo ingreso del usuario el modal aparece nuevamente
 And el usuario debe hacer clic en "De acuerdo" para continuar
 And el sistema guarda la nueva aceptación con timestamp
```

---

## Restricciones

- El modal NO tiene botón de cerrar ni se puede descartar haciendo clic fuera.
- El botón "De acuerdo" no requiere checkbox previo — solo leer y confirmar.
- El modal solo aplica a rutas bajo `AppLayout` (rutas `/auth/*` no lo muestran).
- El campo `termsAccepted` solo puede ser reseteado por `admingod` o `admin`.
- Las rutas admin (`/admin/*`) están excluidas del modal de términos.

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `Frontend/src/components/legal/TermsAcceptanceModal.tsx` | Modal de aceptación — muestra T&C, Privacidad y Disclaimer |
| `Frontend/src/components/layout/AppLayout.tsx` | Trigger del modal (`!user.termsAccepted`) |
| `Frontend/src/services/user.service.ts` | `syncUserMetadata({ termsAccepted })` — guarda en backend |
| `Backend/app/models/user.py` | Campo `terms_accepted: bool`, default `false` |
| `Frontend/src/types/auth.ts` | `UserProfile.termsAccepted?: boolean` |

---

## Estado del campo en backend

El campo `terms_accepted` en el modelo `User` debe tener:
- `default = False` — todo usuario nuevo empieza sin aceptar
- Actualizable solo por el propio usuario (vía el endpoint de sincronización) o por admin
- El timestamp de aceptación no se guarda actualmente (deuda técnica abierta)

---

## Deuda técnica

- [ ] Guardar `terms_accepted_at` (timestamp) para auditoría — útil si los T&C son modificados y hay que demostrar qué versión aceptó cada usuario.
- [ ] Versionar los T&C (`terms_version`) para poder detectar automáticamente si el usuario aceptó una versión anterior.
