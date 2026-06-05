#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../cuadra-bf832-firebase-adminsdk-fbsvc-3db3ea06db.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'cuadra-bf832'
});

const db = admin.firestore();

async function assignSalesToCashbox() {
  try {
    console.log('🔍 Buscando cajas...');

    // Get all cashboxes
    const cashboxesSnapshot = await db.collection('cashboxes').get();
    const cashboxes = cashboxesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('📦 Cajas encontradas:', cashboxes.map(cb => `${cb.name} (${cb.id})`).join(', '));

    // Find cashbox "J"
    const cashboxJ = cashboxes.find(cb => cb.name === 'J' || cb.name === 'Caja J');

    if (!cashboxJ) {
      console.log('❌ Caja "J" no encontrada');
      console.log('Cajas disponibles:', cashboxes.map(cb => cb.name).join(', '));
      process.exit(1);
    }

    console.log(`✅ Caja "J" encontrada: ${cashboxJ.id}`);

    // Get all sales without cashbox
    console.log('\n🔍 Buscando ventas sin caja asignada...');
    const salesSnapshot = await db.collection('sales')
      .where('cashboxId', '==', null)
      .get();

    const salesWithoutCashbox = salesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Ventas sin caja encontradas: ${salesWithoutCashbox.length}`);
    console.log('Monto total:', salesWithoutCashbox.reduce((sum, s) => sum + (s.total || 0), 0).toFixed(2));

    if (salesWithoutCashbox.length === 0) {
      console.log('✅ No hay ventas sin caja que asignar');
      process.exit(0);
    }

    // Update all sales to assign to cashbox J
    console.log(`\n📝 Asignando ${salesWithoutCashbox.length} ventas a caja "${cashboxJ.name}"...`);

    const batch = db.batch();
    let count = 0;

    salesWithoutCashbox.forEach(sale => {
      const saleRef = db.collection('sales').doc(sale.id);
      batch.update(saleRef, {
        cashboxId: cashboxJ.id,
        cashboxName: cashboxJ.name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;

      // Firestore batch has a limit of 500 operations
      if (count % 500 === 0) {
        console.log(`  - Procesadas ${count} ventas...`);
      }
    });

    await batch.commit();

    console.log(`\n✅ ¡Éxito! Se asignaron ${salesWithoutCashbox.length} ventas a la caja "${cashboxJ.name}"`);
    console.log(`📦 Caja: ${cashboxJ.name} (${cashboxJ.id})`);
    console.log(`💰 Monto total asignado: ${salesWithoutCashbox.reduce((sum, s) => sum + (s.total || 0), 0).toFixed(2)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

assignSalesToCashbox();
