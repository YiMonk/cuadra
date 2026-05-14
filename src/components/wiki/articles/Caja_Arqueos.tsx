import React from 'react';
import { Step, Tip, Warning, InfoBox, List } from '@/components/wiki/WikiArticleRenderer';

export default function Caja_ArqueosArticle() {
  return (
    <>
      <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
        El arqueo de caja es el proceso de contar físicamente el dinero en caja y compararlo
        con lo que el sistema espera que haya. Es la herramienta principal para detectar
        faltantes o sobrantes al cierre de cada turno.
      </p>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        ¿Qué es un Arqueo?
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Un arqueo compara dos valores:
      </p>

      <List
        items={[
          'Efectivo esperado: monto inicial + ventas en efectivo - retiros realizados',
          'Efectivo contado: lo que tú contas físicamente en la caja',
          'Diferencia: sobrante (si contaste más) o faltante (si contaste menos)',
        ]}
      />

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Hacer un Arqueo de Cierre
      </h2>

      <Step number={1} title="Cierra la sesión de caja">
        Ve a <strong>Caja</strong> y haz clic en <strong>"Cerrar Caja"</strong> al finalizar
        el turno.
      </Step>

      <Step number={2} title="Cuenta el efectivo físico">
        Antes de ingresar cualquier número, cuenta todos los billetes y monedas que hay
        en la caja. Hazlo por denominaciones para mayor precisión.
      </Step>

      <Step number={3} title="Ingresa el monto contado">
        Escribe el total que contaste. Cuadra mostrará la diferencia inmediatamente:
        el efectivo esperado versus lo que contaste.
      </Step>

      <Step number={4} title="Revisa el resumen">
        Verás un resumen con: ventas del turno, total esperado, lo que contaste y la diferencia.
        Si hay diferencia, revisa los movimientos antes de confirmar.
      </Step>

      <Step number={5} title="Confirma el arqueo">
        Haz clic en <strong>"Confirmar Cierre"</strong>. La sesión queda cerrada y el arqueo
        queda registrado en el historial.
      </Step>

      <Tip>
        <strong>Contar por denominaciones:</strong> Cuenta primero los billetes grandes,
        luego los pequeños, y al final las monedas. Registra cada denominación por separado
        para facilitar la revisión si encuentras diferencias.
      </Tip>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Arqueo Parcial (sin cerrar la sesión)
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        Puedes hacer arqueos parciales durante el turno sin cerrar la sesión. Esto es útil
        para verificar el estado de la caja a mitad del día o antes de un turno de relevo.
      </p>

      <Step number={1} title="Accede a arqueo parcial">
        Con la sesión abierta, busca la opción <strong>"Arqueo Parcial"</strong> o{' '}
        <strong>"Verificar Caja"</strong>.
      </Step>

      <Step number={2} title="Ingresa el conteo">
        Escribe el efectivo que contaste. Cuadra mostrará si hay diferencia sin cerrar
        la sesión.
      </Step>

      <Warning>
        <strong>Diferencias recurrentes:</strong> Si noche tras noche hay faltantes pequeños,
        puede indicar errores al dar vueltos. Capacita al personal en el manejo del efectivo
        y considera usar calculadora para los vueltos.
      </Warning>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Entender el Informe de Arqueo
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-4">
        El informe de arqueo muestra:
      </p>

      <List
        items={[
          'Monto inicial: con cuánto efectivo se abrió la sesión',
          'Ventas en efectivo: suma de todos los pagos en efectivo del turno',
          'Retiros: dinero extraído de la caja durante el turno (por ejemplo, para depositar)',
          'Total esperado: inicial + ventas - retiros',
          'Total contado: lo que ingresaste manualmente',
          'Diferencia: positivo = sobrante, negativo = faltante',
        ]}
      />

      <InfoBox>
        <strong>Exportar arqueos:</strong> Puedes exportar el historial de arqueos a CSV
        desde <strong>Caja → Historial</strong> para llevar el control en una hoja de cálculo
        o compartirlo con tu contador.
      </InfoBox>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white my-6">
        Preguntas frecuentes
      </h2>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Puedo editar un arqueo después de confirmarlo?
      </h3>
      <p className="text-slate-700 dark:text-slate-300 mb-4">
        No. Una vez confirmado, el arqueo queda registrado permanentemente. Si hubo un error,
        debes registrar un ajuste o anotarlo en observaciones al cierre siguiente.
      </p>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white my-3">
        ¿Qué hago si el faltante es grande?
      </h3>
      <p className="text-slate-700 dark:text-slate-300">
        Primero verifica que no hayas olvidado contar algún billete. Si la diferencia persiste,
        revisa el historial de movimientos de la sesión para identificar si hubo alguna operación
        no registrada o un retiro manual sin documentar.
      </p>
    </>
  );
}
