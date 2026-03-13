# **Documento de Especificación de Requerimientos: App de Gestión "CookieManager"**

## **1\. Resumen Ejecutivo**

El objetivo es desarrollar una aplicación móvil administrativa ("Back-office") en **React Native** para digitalizar y optimizar la gestión operativa de un emprendimiento de galletas.

La aplicación reemplazará el registro manual (bloc de notas) por un sistema centralizado que gestione **inventario, producción, ventas, cuentas por cobrar (fiado), preventas y promociones condicionales**, permitiendo escalar el negocio y evitar pérdidas financieras o de stock.

**Tipo de App:** Uso interno/administrativo (No es para el cliente final).

**Plataforma:** Android / iOS.

## ---

**2\. Arquitectura de la Información y Módulos**

La aplicación se divide en 7 módulos principales interconectados:

### **Módulo A: Dashboard (Panel de Control)**

Es la pantalla de inicio. Su función es dar una "radiografía" instantánea del negocio.

* **KPIs en tiempo real:** Total vendido en el día ($), Unidades vendidas, Total pendiente por cobrar.  
* **Sistema de Alertas:**  
  * *Stock Crítico:* Aviso visual si un producto tiene menos de X unidades.  
  * *Deudas Vencidas:* Alerta de clientes que superaron los 15 días de crédito.  
  * *Entregas Próximas:* Recordatorio de Preventas para el día actual o siguiente.

### **Módulo B: Inventario y Producción**

Control del flujo físico del producto.

* **Catálogo de Productos:** Nombre, Precio Base, Costo de Producción (opcional), Stock Actual.  
* **Entrada de Producción:** Formulario rápido para sumar stock recién horneado (+ Stock).  
* **Registro de Mermas:** Funcionalidad para dar de baja productos dañados, rotos o quemados.  
  * *Input:* Producto, Cantidad, Motivo, Foto (opcional).  
  * *Acción:* Resta del stock y suma a un reporte de "Pérdidas Operativas".

### **Módulo C: Punto de Venta (POS) y Promociones**

El núcleo transaccional de la app.

* **Carrito de Compras:** Selección múltiple de productos.  
* **Motor de Promociones (Lógica Condicional):**  
  * El sistema debe validar reglas automáticas. *Ejemplo: Si (Producto \= "Chips" AND Cantidad \>= 2 AND Pago \= "Efectivo") ENTONCES (Precio \= $5.00).*  
  * Si el método de pago cambia (ej. a Transferencia), el precio se recalcula automáticamente al valor original.  
* **Registro de Pago:**  
  * *Efectivo:* Cierre inmediato de venta.  
  * *Digital (Transferencia/Pago Móvil):* Opción obligatoria u opcional de **adjuntar comprobante (Foto)**.  
* **Estado del Pago:** Switch para marcar la venta como "Pagada" o "Fiado/Pendiente".

### **Módulo D: Gestión de Cobranzas (Cuentas por Cobrar)**

Para recuperar el dinero de ventas a crédito.

* **Listado de Deudores:** Ordenado por antigüedad de la deuda.  
* **Regla de los 15 Días:** El sistema calcula la fecha de vencimiento automáticamente al crear la venta.  
* **Acción de Cobro:** Botón de "Recordar Pago" que abre la API de WhatsApp con un mensaje pre-llenado: *"Hola \[Cliente\], recordatorio amable de tu saldo pendiente de \[Monto\] por las galletas del día \[Fecha\]..."*.

### **Módulo E: Preventas (Pedidos Futuros)**

Gestión de demanda futura sin afectar el stock actual inmediatamente.

* **Calendario:** Vista de pedidos agendados por fecha.  
* **Calculadora de Producción:** Sumatoria de (Pedidos Preventa \+ Stock Mínimo) para saber cuánto hornear.  
* **Conversión:** Botón para transformar una "Preventa" en una "Venta Real" el día de la entrega (en ese momento se descuenta del stock).

### **Módulo F: Clientes (CRM Ligero)**

* Base de datos de compradores.  
* Historial de compras y frecuencia (para identificar clientes VIP).  
* Datos de contacto y dirección de entrega.

### **Módulo G: Reportes**

* Ventas Totales (Diarias/Mensuales).  
* Producto más vendido vs. Producto menos vendido.  
* Reporte de Mermas (Pérdidas).

## ---

**3\. Stack Tecnológico Sugerido**

Para garantizar escalabilidad, manejo de imágenes (comprobantes) y seguridad de datos, se recomienda la siguiente arquitectura:

### **Frontend (La App)**

* **Framework:** **React Native** (con **Expo**). Permite desarrollo rápido y despliegue fácil en Android/iOS.  
* **Lenguaje:** JavaScript / TypeScript (Recomendado TypeScript para evitar errores de tipado en precios y stock).  
* **UI Kit:** **React Native Paper** o **NativeBase** (Componentes visuales listos para usar: botones, listas, inputs).

### **Backend & Base de Datos (La Nube)**

* **Servicio:** **Google Firebase**.  
  * **Firestore Database:** Base de datos NoSQL en tiempo real. Ideal para guardar ventas, clientes y stock sincronizados. Si cambias de teléfono, no pierdes nada.  
  * **Firebase Storage:** **CRÍTICO** para guardar las fotos de los comprobantes de pago. No se deben guardar en el celular (se llena la memoria), sino en la nube.  
  * **Authentication:** Login simple (Email/Pass) para asegurar que solo tú accedas a la info administrativa.

## ---

**4\. Modelo de Datos (Esquema Simplificado)**

Para que el desarrollador entienda cómo guardar la información:

**Colección: products**

JSON

{  
  "id": "prod\_01",  
  "name": "Galleta Chips",  
  "price": 3.00,  
  "stock": 45,  
  "min\_stock\_alert": 10  
}

**Colección: promotions**

JSON

{  
  "id": "promo\_01",  
  "name": "Promo Efectivo 2x5",  
  "trigger\_qty": 2,  
  "trigger\_payment\_method": "cash",  
  "final\_price": 5.00,  
  "is\_active": true  
}

**Colección: sales**

JSON

{  
  "id": "sale\_999",  
  "date": "2023-10-27T14:30:00",  
  "customer\_id": "cust\_55",  
  "items": \[  
      {"prod\_id": "prod\_01", "qty": 2, "price\_applied": 2.50} // Precio unitario tras promo  
  \],  
  "total\_amount": 5.00,  
  "payment\_method": "cash", // cash, transfer, mobile\_pay  
  "payment\_status": "paid", // paid, pending  
  "payment\_proof\_url": "https://firebasestorage...", // Link a la foto  
  "is\_presale": false  
}

**Colección: waste\_log (Mermas)**

JSON

{  
  "id": "waste\_01",  
  "date": "2023-10-27",  
  "prod\_id": "prod\_01",  
  "qty": 3,  
  "reason": "Quemadas"  
}

## ---

**5\. Flujo de Usuario (User Journey) \- Ejemplo: Venta con Promo**

1. **Inicio:** El usuario abre la app y ve el Dashboard.  
2. **Acción:** Toca el botón flotante "+" \-\> "Nueva Venta".  
3. **Selección:** Busca al cliente "Juan". Selecciona "2 Galletas Chips".  
4. **Sistema:** La app muestra Subtotal: $6.00.  
5. **Interacción:** El usuario selecciona Método de Pago: "Efectivo".  
6. **Sistema:** La app detecta la regla, tacha el $6.00 y muestra **Total: $5.00 (Promo Aplicada)**.  
7. **Cierre:** El usuario confirma.  
8. **Resultado:**  
   * Stock de Chips reduce en 2\.  
   * Caja aumenta en $5.00.  
   * Se genera registro en historial.

---

Este documento sirve como "Plan Maestro". Con esto, ya puedes empezar a configurar el entorno de desarrollo en React Native. **¿Quieres que te guíe con los primeros comandos para instalar el proyecto y las dependencias necesarias?**

**Arquitectura** 

**Aquí tienes el Plan Maestro de Arquitectura para CookieManager.**

**Este documento define cómo se conectan todas las piezas (Frontend, Backend, Datos y Lógica). Está diseñado para ser "Offline-First", lo que significa que tu app funcionará perfectamente aunque se vaya el internet o la luz (algo vital en nuestro contexto), y se sincronizará cuando vuelva la conexión.**

---

## **1\. Diagrama de Alto Nivel (El "Big Picture")**

**Imagina tu aplicación como un edificio de 3 pisos.**

---

## **2\. Tecnologías Seleccionadas (El Stack)**

### **A. Frontend (Tu Teléfono)**

* **Core: React Native con Expo.**  
  * ***Por qué:*** **Desarrollo rápido, fácil de probar en tu celular real sin cables complejos.**  
* **Lenguaje: TypeScript.**  
  * ***Por qué:*** **"Tipado estático". Si intentas sumar Precio \+ Nombre del Cliente, la app te grita un error antes de que la compiles. Evita bugs de dinero.**  
* **Interfaz (UI): React Native Paper.**  
  * ***Por qué:*** **Ya trae componentes listos (tarjetas, botones, inputs) que se ven profesionales y modernos (Material Design). No pierdes tiempo diseñando botones desde cero.**  
* **Navegación: React Navigation.**  
  * ***Por qué:*** **Estándar de la industria para pasar de "Inicio" a "Ventas".**  
* **Estado Global: React Context API.**  
  * ***Por qué:*** **Para manejar datos que se usan en toda la app (como el "Carrito de Compras" o el "Usuario Logueado") sin complicar el código con librerías pesadas como Redux.**

### **B. Backend (La Nube \- Google Cloud)**

* **Base de Datos: Cloud Firestore.**  
  * ***Por qué:*** **Es NoSQL (flexible). Guarda los datos como documentos JSON.**  
  * ***Funcionalidad Clave:*** **Persistencia Offline. Si vendes sin internet, Firestore guarda la venta en el disco del celular. Cuando detecta red, la sube sola a la nube.**  
* **Imágenes: Firebase Storage.**  
  * ***Por qué:*** **Para guardar las fotos de los comprobantes de pago (Pago Móvil / Zelle).**  
* **Auth: Firebase Authentication.**  
  * ***Por qué:*** **Manejo seguro de tu sesión (Email/Password).**

---

## **3\. Arquitectura de Datos (Esquema de Base de Datos)**

**Aunque Firestore es flexible, definiremos estas Colecciones fijas para mantener el orden:**

### **📦 Colección: products (Inventario)**

**Cada documento es una galleta o insumo.**

* **id (Auto-generado)**  
* **name: "Chips Choco"**  
* **price\_usd: 3.00 (Base en dólares)**  
* **stock\_qty: 50**  
* **min\_stock\_alert: 10**

### **💰 Colección: sales (Ventas)**

**El registro histórico.**

* **id (Auto-generado)**  
* **created\_at: Timestamp**  
* **customer\_info: { nombre, telefono } (Copia del momento de la venta)**  
* **items: Array \[{ id\_producto, cantidad, precio\_aplicado }\]**  
* **total\_usd: 5.00**  
* **payment\_method: "pago\_movil" | "efectivo"**  
* **payment\_status: "paid" | "pending"**  
* **evidence\_url: "https://firebasestorage..." (Foto del pago)**

### **👥 Colección: clients (Directorio)**

**Para autocompletar nombres al vender.**

* **id (Teléfono como ID único)**  
* **name: "Juan Perez"**  
* **address: "Calle 1..."**  
* **last\_purchase: Timestamp**

### **📉 Colección: waste\_logs (Mermas)**

* **id**  
* **date: Timestamp**  
* **product\_id: "galleta\_chips"**  
* **quantity: 3**  
* **reason: "Quemadas"**

### **⚙️ Colección: config (Variables Globales)**

**Un solo documento para controlar la app remotamente.**

* **exchange\_rate: 38.5 (Tasa BCV del día, actualizable manualmente).**  
* **active\_promos: Array de IDs de promociones activas.**

---

## **4\. Flujo de Información (Data Flow)**

**Así viaja un dato cuando haces una venta:**

1. **Input (UI): Tú seleccionas "2 Chips" y tocas "Cobrar" en la pantalla POSScreen.**  
2. **Logic (Hook): La función useCart calcula el total.**  
   * ***Verifica:*** **¿Hay promo activa? \-\> Sí \-\> Aplica descuento.**  
   * ***Convierte:*** **¿Pago en Bolívares? \-\> Multiplica Total USD \* Tasa BCV (del Contexto).**  
3. **Service (API): Llama a SalesService.createSale(venta).**  
4. **Firebase (SDK):**  
   * **Intenta subir a la nube.**  
   * **¿Sin internet? Guarda en caché local.**  
   * **¿Con internet? Sincroniza.**  
5. **Feedback (UI): La pantalla muestra "¡Venta Exitosa\!" y limpia el carrito.**

---

## **5\. Estrategia de Seguridad (Security Rules)**

**Como la app es para ti, las reglas en Firebase serán simples pero efectivas:**

***Esto evita que cualquier persona extraña lea tus datos, solo tú con tu email y contraseña.***

---

## **6\. Organización del Proyecto (Carpetas Clave)**

**Basado en lo que hablamos antes, así se verá tu "mapa de trabajo":**

---

### **Veredicto Final del Arquitecto 🏗️**

**Esta arquitectura es:**

1. **Robusta: Separa la vista de la lógica. Si cambias el diseño, no rompes los cálculos.**  
2. **Económica: Usa el plan gratuito de Firebase al máximo.**  
3. **Realista: Contempla el problema de internet y la doble moneda (USD/Bs).**

**¿Te parece sólida esta estructura? Si das el "Visto Bueno", el siguiente paso es configurar la conexión a Firebase (firebaseConfig.ts) y definir los Tipos (types.ts) para empezar a programar. ¿Le damos luz verde?**

**legal**   
**Esta es una pregunta muy importante y madura. Entender el límite entre una "herramienta administrativa" y un "sistema fiscal" en Venezuela es crucial para evitar problemas con el SENIAT.**

**Dado que tu aplicación es de uso interno (Back-Office), no procesa pagos y no emite facturas al cliente final, el panorama legal es mucho más sencillo, pero hay puntos clave que debes cubrir para protegerte a ti mismo como desarrollador.**

**Aquí te detallo la situación legal y recomendaciones específicas para Venezuela:**

### **1\. La Diferencia Clave: Gestión vs. Facturación**

**En Venezuela, el SENIAT regula estrictamente los Sistemas de Facturación.**

* **Lo que SÍ requiere permisos complejos: Cualquier software que emita un papel que diga "Factura Fiscal", calcule el IVA para declarar al gobierno o reemplace a una Impresora Fiscal.**  
* **Lo que es TU app: Es un Libro Auxiliar de Gestión. Es el equivalente digital a un cuaderno.**  
* **Veredicto: NO necesitas permisos del SENIAT ni certificaciones de "Máquina Fiscal" para publicar tu app, SIEMPRE Y CUANDO dejes claro que los recibos que genera la app (si genera alguno en PDF o imagen) son "Notas de Entrega" o "Comprobantes de Control Interno", y explícitamente digan: "NO VÁLIDO COMO FACTURA FISCAL".**

### **2\. Términos y Condiciones (Tu Escudo Legal)**

**Si haces pública la app para que otros emprendedores la usen, debes incluir una pantalla de "Términos y Condiciones" al inicio. Esto es vital en Venezuela para evitar que te culpen de evasión de impuestos.**

**Debes incluir cláusulas como:**

* **Deslinde de Responsabilidad Fiscal: "Esta aplicación es una herramienta de organización administrativa. El usuario (emprendedor) es el único responsable de cumplir con sus obligaciones tributarias, emitir facturas fiscales legales y declarar sus ingresos ante el SENIAT."**  
* **Integridad de Datos: "El desarrollador no se hace responsable por pérdidas de información debido a fallos del dispositivo o falta de conexión."**

### **3\. Manejo de Divisas (Tasa BCV vs. Paralelo)**

**En Venezuela, la Ley de Ilícitos Cambiarios fue derogada, por lo que es legal cobrar y fijar precios en dólares. Sin embargo:**

* **Para evitar problemas, tu app debería permitir al usuario registrar la tasa de cambio manualmente o, si la automatizas en el futuro, usar la referencia del BCV (Banco Central de Venezuela) como oficial.**  
* **Si permites que el usuario ponga "Dólares", legalmente está bien, ya que es una referencia de valor.**

### **4\. Privacidad de Datos (Data de Terceros)**

**Aunque tu app sea administrativa, el emprendedor guardará ahí los nombres y teléfonos de *sus* clientes.**

* **No necesitas un registro complejo ante el gobierno, pero éticamente y por seguridad de las tiendas (Google/Apple), debes tener una Política de Privacidad simple donde digas: *"Los datos de los clientes registrados en la app pertenecen exclusivamente al usuario del dispositivo. Nosotros no vendemos ni compartimos esta información con terceros."***

### **5\. Propiedad Intelectual (SAPI)**

**Esto no es obligatorio para operar, pero si tu app se vuelve famosa en Venezuela:**

* **Marca: Si le pones un nombre pegajoso (ej. "MiKioscoApp"), podrías registrar la marca en el SAPI para que nadie más la use.**  
* **Derecho de Autor: El código es tuyo.**

---

### **Resumen para tu tranquilidad:**

1. **¿Es legal publicarla? Sí, totalmente. Es una herramienta de productividad, como Excel o Trello.**  
2. **¿Necesito permisos del gobierno? No, porque no eres un banco (no tocas el dinero) ni eres una imprenta fiscal.**  
3. **¿Qué debo cuidar? Que la app nunca diga la palabra "Factura" en los comprobantes que genere. Usa "Recibo", "Nota de Pedido" o "Control".**

### **Recomendación Técnica para el Desarrollo:**

**En la pantalla de "Configuración" de tu app, agrega un texto pequeño al pie de página que diga:**

***"Software de gestión administrativa interna."***

**Con eso, estás blindado. Puedes desarrollar tu app con tranquilidad.**

**¿Te sientes más seguro con esta información? ¿Quieres que empecemos a definir la estructura de carpetas de React Native ahora que ya sabemos que el proyecto es viable?**

