import React from 'react';
import { WikiLayout } from '@/components/wiki/WikiLayout';
import { WikiHubPage } from '@/components/wiki/WikiHubPage';

export const metadata = {
  title: 'Centro de Ayuda - Cuadra',
  description: 'Aprende a usar todas las funciones de Cuadra para tu negocio',
};

export default function Page() {
  return (
    <WikiLayout>
      <WikiHubPage />
    </WikiLayout>
  );
}
