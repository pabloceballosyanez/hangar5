# WhatsApp — Aviso "Pedido Listo" (Fase 1)

Cuando la cocina marca una orden QR como **READY**, el cliente recibe un
WhatsApp automático. El código ya está desplegado y **no hace nada** hasta que
se configuren las variables de entorno (seguro de deployar antes del trámite).

## Pasos del trámite en Meta (los hace Pablo, ~30-60 min + espera de verificación)

1. **Meta Business Suite** → https://business.facebook.com
   - Crear (o usar) el portafolio de negocio "Hangar 5"
   - Configuración del negocio → Centro de seguridad → **Iniciar verificación**
     (RFC / comprobante de domicilio / teléfono del negocio). Tarda 1-5 días.

2. **Crear app** → https://developers.facebook.com/apps
   - Tipo: **Business** → agregar producto **WhatsApp**
   - Esto crea un número de prueba; después se agrega el número real.

3. **Número dedicado**
   - WhatsApp → API Setup → **Add phone number**
   - Usar un número SIN WhatsApp registrado (SIM nueva o fijo del restaurante;
     los fijos verifican por llamada de voz).
   - Anotar el **Phone Number ID** (no es el número, es un ID largo).

4. **Token permanente**
   - Business Settings → Users → **System Users** → crear "hangar5-bot" (admin)
   - Generar token con permisos `whatsapp_business_messaging` +
     `whatsapp_business_management`, sin expiración.

5. **Plantilla de mensaje** (Manager de WhatsApp → Message Templates → Create)
   - Nombre: `pedido_listo`
   - Categoría: **Utility** · Idioma: **Español (MEX)** → `es_MX`
   - Cuerpo:
     ```
     ¡Hola {{1}}! 🍽️ Tu pedido #{{2}} en Hangar 5 está listo.
     Puedes pasar a recogerlo o espéralo en tu mesa. ¡Buen provecho!
     ```
   - Aprobación: minutos a horas.

## Variables de entorno en Render

Render Dashboard → hangar5 → Environment → Add:

| Variable | Valor |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | token permanente del system user |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID del paso 3 |
| `WHATSAPP_TEMPLATE_ORDER_READY` | `pedido_listo` (opcional, es el default) |
| `WHATSAPP_TEMPLATE_LANG` | `es_MX` (opcional, es el default) |

Al guardar, Render redeploya y los avisos quedan activos. Sin estas variables
el sistema simplemente no envía nada (no-op silencioso).

## Cómo funciona (técnico)

- `src/lib/whatsapp.ts` — cliente de Cloud API + normalización de teléfonos MX
  (10 dígitos → `52XXXXXXXXXX`).
- Hooks de envío (fire-and-forget, jamás bloquean el flujo de cocina):
  - `orders/[orderId]/status` — transición manual a READY
  - `orders/[orderId]/items/[itemId]/status` — auto-advance a READY cuando
    todos los items del pedido quedan listos (camino normal del KDS)
- Solo notifica órdenes `source === "QR"` con `customerPhone` capturado.
- El checkout QR ahora pide el número como "WhatsApp 📱 te avisamos cuando
  tu pedido esté listo".

## Costos

- Mensajes de utilidad en México: ~$0.20-0.40 MXN c/u.
- Respuestas del cliente (ventana 24h): gratis.
- Estimado: 300 pedidos QR/mes ≈ $60-120 MXN/mes.

## Fase 3 (pendiente — agente comercial independiente)

Chatbot LLM en el mismo número: hotelería, actividades (parapente, enduro,
MTB), disponibilidad y FAQs, con escalamiento a humano. Se montará como
servicio aparte (webhook independiente) para no acoplar al app del restaurante.
