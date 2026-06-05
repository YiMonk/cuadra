import React from 'react';
import { Step, Tip, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function MetodosPagoArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        Cuadra soporta múltiples métodos de pago para que tus clientes tengan flexibilidad al
        pagar.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Métodos Disponibles
      </h2>

      <List
        items={[
          'Efectivo',
          'Transferencia bancaria',
          'Tarjeta de crédito/débito',
          'Billeteras digitales (Apple Pay, Google Pay)',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Efectivo
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El método más común en tiendas físicas.
      </p>

      <Step number={1} title="Selecciona Efectivo">
        En el POS, elige "Efectivo" como método de pago.
      </Step>

      <Step number={2} title="Ingresa el monto recibido">
        Escribe cuánto dinero en efectivo recibiste del cliente.
      </Step>

      <Step number={3} title="El cambio se calcula automáticamente">
        Cuadra muestra el vuelto que debes dar.
      </Step>

      <Tip>
        <strong>Consejo:</strong> Cuadra registra todo el efectivo en tu sesión de caja para
        facilitar el arqueo al final del día.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Transferencia Bancaria
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Para pagos por transferencia o depósito bancario.
      </p>

      <Step number={1} title="Selecciona Transferencia">
        En el POS, elige "Transferencia Bancaria".
      </Step>

      <Step number={2} title="Registra los datos">
        Puedes anotar la referencia de transferencia o banco del cliente.
      </Step>

      <Step number={3} title="Marca como completada">
        Cuando confirmes que recibiste el dinero, marca la venta como pagada.
      </Step>

      <InfoBox>
        Las transferencias pueden tomar tiempo en procesarse. En tu reporte, verás las
        transferencias pendientes.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Tarjeta de Crédito/Débito
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Para pagos con tarjeta de crédito o débito.
      </p>

      <Step number={1} title="Selecciona Tarjeta">
        En el POS, elige "Tarjeta de Crédito" o "Tarjeta de Débito".
      </Step>

      <Step number={2} title="Procesa el pago">
        Si tienes un lector de tarjeta conectado, pasa la tarjeta. Si no, registra los datos
        manualmente.
      </Step>

      <Step number={3} title="Confirma la transacción">
        Completa cualquier autenticación requerida.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Billeteras Digitales
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Apple Pay, Google Pay, y otras billeteras digitales.
      </p>

      <Step number={1} title="Selecciona Billetera Digital">
        En el POS, elige tu opción de billetera digital.
      </Step>

      <Step number={2} title="El cliente confirma el pago">
        El cliente usa su dispositivo para autorizar el pago.
      </Step>

      <Step number={3} title="La transacción se completa">
        El dinero se transfiere inmediatamente a tu cuenta.
      </Step>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Crédito (Para Clientes Registrados)
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Si tu cliente tiene una cuenta de crédito en tu negocio.
      </p>

      <Step number={1} title="El cliente debe estar registrado">
        El cliente debe ser un contacto que hayas agregado con limite de crédito.
      </Step>

      <Step number={2} title="Selecciona Crédito">
        En el POS, elige "Crédito" o "Cuenta Abierta".
      </Step>

      <Step number={3} title="La deuda se registra">
        La venta se agrega a la cuenta del cliente como deuda pendiente.
      </Step>

      <Tip>
        <strong>Gestión de crédito:</strong> En el módulo de Clientes, puedes monitorear quién
        te debe y cuánto.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Pagos Parciales y Devoluciones
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Cuadra también soporta pagos parciales y múltiples métodos en una sola venta.
      </p>

      <Step number={1} title="Registra cada método">
        Ingresa el monto para cada método de pago.
      </Step>

      <Step number={2} title="El total debe coincidir">
        Asegúrate de que la suma de todos los métodos iguales el total de la venta.
      </Step>

      <p className="text-slate-700 dark:text-slate-300 mt-4">
        Ejemplo: Cliente paga 50 en efectivo + 50 en tarjeta = 100 total.
      </p>
    </>
  );
}
