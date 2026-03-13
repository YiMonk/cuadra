import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title, Text, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { SalesService } from '../../services/sales.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
    const { signOut } = useAuth();
    const theme = useTheme();
    const [salesToday, setSalesToday] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadStats();
        }, [])
    );

    const loadStats = async () => {
        setLoading(true);
        try {
            // Get start/end of today
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

            const [dailySales, pendingSales] = await Promise.all([
                SalesService.getDailySales(startOfDay, endOfDay),
                SalesService.getPendingSales()
            ]);

            const totalDaily = dailySales.reduce((sum, sale) => sum + sale.total, 0);
            const totalPending = pendingSales.reduce((sum, sale) => sum + sale.total, 0);

            setSalesToday(totalDaily);
            setPendingAmount(totalPending);
        } catch (error) {
            console.error("Error loading stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Title style={{ marginBottom: 20, textAlign: 'center', color: theme.colors.onBackground }}>Panel de Control</Title>

            <View style={styles.statsRow}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Ventas de Hoy</Text>
                        <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                            ${salesToday.toFixed(2)}
                        </Text>
                    </Card.Content>
                </Card>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Por Cobrar</Text>
                        <Text variant="headlineMedium" style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                            ${pendingAmount.toFixed(2)}
                        </Text>
                    </Card.Content>
                </Card>
            </View>

            <View style={styles.menuGrid}>
                <Button
                    mode="contained"
                    icon="cart"
                    onPress={() => navigation.navigate('POS')}
                    style={[styles.button, { marginBottom: 10, backgroundColor: theme.colors.primary }]}
                    contentStyle={{ height: 50 }}
                >
                    Nueva Venta
                </Button>

                <Button
                    mode="outlined"
                    icon="cash-multiple"
                    onPress={() => navigation.navigate('Collections')}
                    style={[styles.button, { borderColor: theme.colors.secondary }]}
                    textColor={theme.colors.secondary}
                >
                    Cobranzas
                </Button>

                <Button
                    mode="outlined"
                    icon="history"
                    onPress={() => navigation.navigate('SalesHistoryFull')}
                    style={styles.button}
                >
                    Historial de Ventas
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('Inventory')}
                    style={styles.button}
                >
                    Inventario & Stock
                </Button>

                <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('Clients')}
                    style={styles.button}
                >
                    Clientes
                </Button>

                <Button
                    mode="outlined"
                    icon="chart-bar"
                    onPress={() => navigation.navigate('ReportsTab')}
                    style={styles.button}
                >
                    Reportes
                </Button>

                <Button
                    mode="text"
                    icon="test-tube"
                    onPress={() => navigation.navigate('Simulation')}
                    style={styles.button}
                    labelStyle={{ fontSize: 12, color: theme.colors.outline }}
                >
                    Test del Sistema
                </Button>
            </View>

            <Button
                mode="text"
                textColor={theme.colors.error}
                onPress={() => signOut()}
                style={styles.button}
            >
                Cerrar Sesión
            </Button>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        // backgroundColor handled inline
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    card: {
        flex: 0.48,
        elevation: 2,
        // backgroundColor handled inline
    },
    menuGrid: {
        flex: 1,
        justifyContent: 'center',
    },
    button: {
        marginVertical: 8,
        paddingVertical: 6,
    },
});
