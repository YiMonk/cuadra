# Manual de Usuario - App Cuadra

Bienvenido a **Cuadra**, tu sistema de punto de venta y gestión de inventario. Este manual te guiará por las funciones principales de la aplicación.

## 1. Inicio y Dashboard

Al abrir la aplicación verás el **Dashboard (Panel Principal)**. Aquí encontrarás un resumen rápido de tu negocio:

- **Sales Today:** Total vendido en el día actual (Dinero real + Fiado).
- **Pending (Fiado):** Total de dinero que te deben tus clientes.
- **Botones de Acceso Rápido:** Para ir a Ventas, Inventario, Clientes, etc.

## 2. Gestión de Inventario

Accede desde "Manage Inventory & Stock".

### Crear Producto

1. Presiona el botón flotante **`+`** abajo a la derecha.
2. Elige **"Add New Product"**.
3. Ingresa Nombre, Precio, Stock inicial y Unidad.
4. Toca "Create Product".

### Ajustar Stock (Entradas y Mermas)

Para cambiar el stock de un producto existente:

1. Presiona el botón flotante **`+`**.
2. Elige **"Adjust Stock"**.
3. Selecciona el producto de la lista (puedes buscar por nombre).
4. Elige el tipo de acción:
   - **Restock (Entrada):** Para cuando compras o produces más mercancía. Suma al inventario.
   - **Waste (Merma):** Para productos dañados, regalados o consumo propio. Resta del inventario.
5. Ingresa la cantidad y una nota opcional.
6. Confirma.

## 3. Realizar una Venta (POS)

Accede desde "New Sale (POS)".

1. **Agregar Productos:** Toca las tarjetas de los productos. Verás un contador rojo sobre el producto indicando cuántos llevas.
2. **Ver Carrito:** En la parte inferior verás una barra con el total. Toca **"Checkout"**.
3. **Pantalla de Pago (Checkout):**
    - **Customer (Opcional):** Selecciona un cliente si es necesario (Obligatorio para fiados). Si no existe, puedes crearlo ahí mismo con "Create New Customer".
    - **Revisar Orden:** Verifica los items.
    - **Forma de Pago:**
        - *Cash:* Efectivo.
        - *Transfer:* Pago móvil o transferencia.
        - *Credit (Fiado):* Genera una deuda al cliente.
4. Presiona **"Confirm Sale"**.

## 4. Gestión de Cobranzas

Accede desde "Collections (Cobranzas)".

Aquí verás la lista de **Deudores**.

- Cada tarjeta muestra el nombre del cliente, su teléfono y el **Total Adeudado**.
- **Send Reminder:** Simula el envío de un recordatorio de cobro.

## 5. Reportes

Accede desde "Sales Reports".

Visualiza estadísticas históricas:

- **Total Revenue:** Ingresos totales históricos.
- **Métodos de Pago:** Gráfico numérico de cómo te pagan más.
- **Top 5 Productos:** Tus productos estrella.

## Preguntas Frecuentes

**¿Necesito internet?**
Sí, la aplicación guarda los datos en la nube (Firebase) para que estén seguros y accesibles.

**¿Qué pasa si vendo algo sin stock?**
La aplicación te avisará, pero actualmente no bloquea la venta (el stock pasará a negativo), para no detener tu operación en momento crítico. Se recomienda ajustar el stock luego.
