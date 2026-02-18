# Documentación de Servicios (API Interna)

Dado que "Cuadra" es una aplicación Serverless (sin backend tradicional) que se conecta directamente a **Firebase Firestore**, no existen "endpoints REST" convencionales (como `GET /api/products`).

En su lugar, la aplicación utiliza una **Capa de Servicios** (`src/services`) que encapsula la lógica de base de datos. A efectos de desarrollo e integración, estos métodos actúan como nuestra API.

## Estructura de Datos (Modelos)

### 1. Product (Inventario)

```typescript
interface Product {
  id: string;          // Auto-generado por Firestore
  name: string;        // Nombre del producto
  price: number;       // Precio unitario
  stock: number;       // Cantidad disponible
  unit: string;        // 'unit' | 'kg' | 'g'
  createdAt: number;   // Timestamp
  updatedAt: number;   // Timestamp
}
```

### 2. Sale (Venta)

```typescript
interface Sale {
  id: string;
  items: CartItem[];      // Array de productos vendidos
  total: number;          // Monto total
  paymentMethod: 'cash' | 'transfer' | 'credit';
  clientId?: string;      // ID del cliente (obligatorio si es 'credit')
  status: 'paid' | 'pending'; // 'pending' si es fiado
  createdAt: number;
}
```

### 3. Client (Cliente)

```typescript
interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
}
```

---

## Servicios Principales

### A. ProductService (`src/services/product.service.ts`)

Encargado de la gestión del inventario.

#### 1. `subscribeToProducts(callback)`

- **Descripción:** Escucha en tiempo real cambios en el inventario.
- **Uso:** Se usa en pantallas de lista para actualización automática.
- **Ejemplo:**

  ```typescript
  const unsubscribe = ProductService.subscribeToProducts((products) => {
    console.log("Inventario actualizado:", products);
  });
  ```

#### 2. `adjustStock(id, adjustment, reason, notes)`

- **Descripción:** Modifica el stock de un producto (transaccional).
- **Parámetros:**
  - `id`: ID del producto.
  - `adjustment`: Cantidad a sumar (positivo) o restar (negativo).
  - `reason`: 'restock' | 'waste' | 'correction'.
- **Ejemplo (Entrada de mercancía):**

  ```typescript
  await ProductService.adjustStock('prod_123', 50, 'restock', 'Compra semanal');
  ```

- **Ejemplo (Merma/Desperdicio):**

  ```typescript
  await ProductService.adjustStock('prod_123', -2, 'waste', 'Se causo al piso');
  ```

---

### B. SalesService (`src/services/sales.service.ts`)

Encargado del procesamiento de ventas y caja.

#### 1. `createSale(saleData)`

- **Descripción:** Registra una venta nueva y descuenta el stock atómicamente.
- **Validaciones:**
  - Verifica stock suficiente.
  - Si `paymentMethod` es 'credit', marca estado como `pending`.
- **Payload Ejemplo:**

  ```javascript
  {
    items: [{ id: 'prod_1', quantity: 2, price: 10, name: 'Galleta' }],
    total: 20,
    paymentMethod: 'credit',
    clientId: 'client_555'
  }
  ```

#### 2. `getDailySales(startOfDay, endOfDay)`

- **Descripción:** Obtiene ventas en un rango de fechas.
- **Uso:** Dashboard para KPIs (Sales Today).

#### 3. `getPendingSales()`

- **Descripción:** Obtiene todas las ventas con estatus `pending` (Fiados).
- **Uso:** Módulo de Cobranzas.

---

### C. ClientService (`src/services/client.service.ts`)

Gestión de la base de datos de clientes.

#### 1. `addClient(clientData)`

- **Descripción:** Crea un cliente nuevo.
- **Payload Ejemplo:**

  ```javascript
  {
    name: "Juan Pérez",
    phone: "+58 412 1234567"
  }
  ```

#### 2. `subscribeToClients(callback)`

- **Descripción:** Lista clientes en tiempo real (ordenados alfabéticamente).
