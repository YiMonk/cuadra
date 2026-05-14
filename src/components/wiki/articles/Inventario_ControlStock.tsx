import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Inventario_ControlStockArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El control de stock te permite saber exactamente cuántas unidades tienes de cada producto
        y actuar antes de quedarte sin existencias.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ver el Estado del Inventario
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        En <strong>Inventario → Gestión</strong> puedes ver de un vistazo el estado de todos tus
        productos con indicadores visuales de color:
      </p>

      <List
        items={[
          'Verde: stock suficiente',
          'Amarillo: stock bajo (cerca del mínimo configurado)',
          'Rojo: sin stock o en nivel crítico',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Configurar Stock Mínimo
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El stock mínimo es el umbral de alerta. Cuando el stock cae por debajo de ese número,
        Cuadra te notifica.
      </p>

      <Step number={1} title="Edita el producto">
        Abre el producto en Inventario y haz clic en Editar.
      </Step>

      <Step number={2} title="Ingresa el Stock Mínimo">
        Escribe el número mínimo que quieres mantener en existencia. Por ejemplo, si no quieres
        bajar de 10 unidades, escribe 10.
      </Step>

      <Step number={3} title="Guarda el cambio">
        Haz clic en Guardar. Cuadra alertará cuando el stock caiga por debajo de ese número.
      </Step>

      <Tip>
        <strong>Sugerencia:</strong> Configura el stock mínimo considerando cuánto tiempo tarda
        en llegar tu reposición. Si el proveedor demora 3 días, el mínimo debe cubrir las ventas
        de esos 3 días.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Ajustar Stock Manualmente
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Hay situaciones donde necesitas ajustar stock sin crear una venta o compra: pérdidas,
        daños, corrección de errores, inventario inicial, etc.
      </p>

      <Step number={1} title="Abre el producto">
        En Inventario, busca el producto y ábrelo.
      </Step>

      <Step number={2} title="Selecciona 'Ajustar Stock'">
        Busca la opción de ajuste o movimiento manual de inventario.
      </Step>

      <Step number={3} title="Ingresa el tipo y cantidad">
        Selecciona si es una entrada (agregar stock) o salida (reducir stock), ingresa la
        cantidad y el motivo del ajuste.
      </Step>

      <Step number={4} title="Confirma el ajuste">
        El stock se actualiza inmediatamente y queda registrado en el historial de movimientos.
      </Step>

      <Warning>
        <strong>Siempre ingresa el motivo:</strong> Los motivos de ajuste (pérdida, daño,
        corrección) son clave para auditorías y para entender discrepancias en el futuro.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Historial de Movimientos
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra registra automáticamente todos los movimientos de stock:
      </p>

      <List
        items={[
          'Entradas por compras a proveedores',
          'Salidas por ventas en POS',
          'Ajustes manuales con su motivo y fecha',
          'Transferencias entre sucursales',
          'Importaciones masivas de productos',
        ]}
      />

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Para ver el historial completo, ve a <strong>Inventario → Movimientos</strong> o abre un
        producto específico y busca la pestaña <strong>"Historial"</strong>.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Inventario Físico
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Periódicamente deberías hacer un conteo físico para verificar que el sistema coincide
        con la realidad:
      </p>

      <Step number={1} title="Exporta la lista actual">
        Exporta el inventario a CSV con los stocks del sistema.
      </Step>

      <Step number={2} title="Cuenta físicamente">
        Cuenta las unidades reales en tu tienda o bodega.
      </Step>

      <Step number={3} title="Ajusta las diferencias">
        Para cada diferencia encontrada, usa ajuste manual para corregir el stock en Cuadra con
        motivo "Inventario físico".
      </Step>

      <InfoBox>
        <strong>Frecuencia recomendada:</strong> Realiza un conteo físico completo una vez al
        mes, y conteos parciales por categoría cada semana para productos de alta rotación.
      </InfoBox>
    </>
  );
}
