import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, List, Divider, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClientService } from '../../services/client.service';
import { ProductService } from '../../services/product.service';
import { SalesService } from '../../services/sales.service';
import { doc, getDoc, deleteDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';
import { useNotifications } from '../../context/NotificationContext';

export default function SimulationScreen() {
    const theme = useTheme();
    const { showAlert } = useNotifications();
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runSimulation = async () => {
        setLoading(true);
        setLogs([]);

        // Debug Auth
        const user = auth.currentUser;
        addLog(`👤 Usuario Actual: ${user ? user.uid : 'NO LEAGUEADO'}`);
        if (!user) {
            addLog("❌ Error: Debe iniciar sesión para ejecutar la simulación.");
            setLoading(false);
            return;
        }

        addLog("🚀 Iniciando Simulación del Sistema...");

        let clientId = '';
        let productId = '';

        try {
            // 1. Create Client
            addLog("Paso 1: Creando Cliente de Prueba...");
            clientId = await ClientService.addClient({
                name: "Usuario Prueba " + Math.floor(Math.random() * 1000),
                phone: "555-0199",
                notes: "Creado por simulación automatizada"
            });
            addLog(`✅ Cliente Creado: ID ${clientId}`);

            // 2. Create Product
            addLog("Paso 2: Creando Producto de Prueba...");
            productId = await ProductService.addProduct({
                name: "Galleta Prueba " + Math.floor(Math.random() * 1000),
                price: 5.00,
                stock: 10,
                unit: 'unit',
                minStockAlert: 5
            });
            addLog(`✅ Producto Creado: ID ${productId}`);

            // 3. Adjust Stock (Restock)
            addLog("Paso 3: Reabasteciendo Producto (+20)...");
            await ProductService.adjustStock(productId, 20, 'restock', 'Reabastecimiento Simulación');

            // Verify Stock
            const productRef = doc(db, 'products', productId); // Using raw Firestore for verification
            const productSnap = await getDoc(productRef);
            const currentStock = productSnap.data()?.stock;
            if (currentStock !== 30) throw new Error(`Discrepancia de stock. Esperado 30, obtenido ${currentStock}`);
            addLog(`✅ Stock Verificado: ${currentStock} (10 inicial + 20 reabastecimiento)`);

            // 4. Perform Sale (Credit)
            addLog("Paso 4: Realizando Venta a Crédito (Cant: 5)...");
            const saleItem = {
                id: productId,
                name: "Galleta Prueba",
                price: 5.00,
                finalPrice: 5.00,
                quantity: 5,
                stock: 30, // Snapshot at time of sale
                minStockAlert: 5,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await SalesService.createSale({
                items: [saleItem],
                total: 25.00, // 5 * 5.00
                paymentMethod: 'credit',
                clientId: clientId
            });
            addLog("✅ Venta Registrada");

            // 5. Verify Stock Deduction
            const productSnapAfter = await getDoc(productRef);
            const stockAfter = productSnapAfter.data()?.stock;
            if (stockAfter !== 25) throw new Error(`Discrepancia stock post-venta. Esperado 25, obtenido ${stockAfter}`);
            addLog(`✅ Stock Verificado Post-Venta: ${stockAfter}`);

            // 6. Verify Debt / Pending Sales
            addLog("Paso 6: Verificando Deuda...");
            const pendingSales = await SalesService.getPendingSales();
            const clientDebt = pendingSales
                .filter(s => s.clientId === clientId)
                .reduce((sum, s) => sum + s.total, 0);

            if (clientDebt !== 25.00) throw new Error(`Discrepancia deuda. Esperado 25.00, obtenido ${clientDebt}`);
            addLog(`✅ Deuda Verificada: $${clientDebt} pendiente para cliente`);

            addLog("🎉 ¡SIMULACIÓN EXITOSA! Todos los sistemas funcionan.");

            // Cleanup (Optional)
            addLog("Limpiando datos de prueba...");
            await ClientService.deleteClient(clientId);
            await ProductService.deleteProduct(productId);
            addLog("🧹 Limpieza Finalizada (Clientes y Productos eliminados)");

        } catch (error: any) {
            addLog(`❌ FALLO: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const wipeDatabase = async () => {
        setLoading(true);
        setLogs([]);
        addLog("🚨 INICIANDO LIMPIEZA TOTAL DE BASE DE DATOS...");

        try {
            const collections = ['products', 'clients', 'sales', 'stock_movements'];

            for (const collName of collections) {
                addLog(`Borrando colección: ${collName}...`);
                const q = collection(db, collName);
                const snapshot = await getDocs(q);

                const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                addLog(`✅ ${collName} vaciada (${snapshot.size} documentos eliminados).`);
            }

            addLog("🎉 LIMPIEZA COMPLETADA CON ÉXITO.");
            addLog("ℹ️ Los usuarios de Firebase Auth no han sido afectados.");
        } finally {
            setLoading(false);
        }
    };

    const promoteToAdmin = async () => {
        const user = auth.currentUser;
        if (!user) {
            showAlert({ title: 'Error', message: 'No hay usuario autenticado' });
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { role: 'admin' }, { merge: true });
            addLog(`✅ Usuario ${user.email} promovido a ADMINISTRADOR`);
            showAlert({ title: 'Éxito', message: 'Has sido promovido a Administrador. Por favor, reinicia la app para aplicar los cambios.' });
        } catch (error: any) {
            addLog(`❌ ERROR AL PROMOVER: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, marginBottom: 10, fontWeight: 'bold' }}>Simulación y Mantenimiento</Text>

                <View style={styles.buttonRow}>
                    <Button
                        mode="contained"
                        onPress={runSimulation}
                        loading={loading}
                        disabled={loading}
                        icon="play"
                        style={styles.btn}
                        buttonColor={theme.colors.primary}
                    >
                        Probar Sistema
                    </Button>

                    <Button
                        mode="contained"
                        onPress={promoteToAdmin}
                        loading={loading}
                        disabled={loading}
                        icon="shield-account"
                        style={styles.btn}
                        buttonColor="#4CAF50"
                    >
                        Promoverme a Admin
                    </Button>

                    <Button
                        mode="contained-tonal"
                        onPress={() => {
                            showAlert({
                                title: 'BORRAR TODO',
                                message: '¿Estás completamente seguro de borrar TODO el contenido (Productos, Clientes, Ventas)? Esta acción es irreversible.',
                                showCancel: true,
                                confirmText: 'BORRAR TODO',
                                onConfirm: wipeDatabase
                            });
                        }}
                        loading={loading}
                        disabled={loading}
                        icon="trash-can"
                        style={styles.btn}
                        buttonColor={theme.colors.error}
                        textColor="white"
                    >
                        Limpiar DB
                    </Button>
                </View>
            </View>

            <ScrollView style={[styles.logs, { backgroundColor: theme.colors.surface }]}>
                {logs.map((log, index) => (
                    <View key={index}>
                        <Text style={[
                            styles.logText,
                            log.includes('✅') ? { color: 'green' } : // Keep hardcoded colors for logs or use theme success?
                                log.includes('❌') ? { color: theme.colors.error } :
                                    log.includes('🎉') ? { color: theme.colors.primary, fontWeight: 'bold' } :
                                        { color: theme.colors.onSurface }
                        ]}>
                            {log}
                        </Text>
                        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    btn: {
        borderRadius: 8,
    },
    logs: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
        flex: 1,
        elevation: 2,
    },
    logText: {
        paddingVertical: 8,
        fontSize: 14,
        fontFamily: 'monospace',
    }
});
