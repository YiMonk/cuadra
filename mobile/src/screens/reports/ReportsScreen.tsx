import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { Text, Card, ActivityIndicator, List, Divider, DataTable, useTheme, IconButton, SegmentedButtons, Avatar, Button, Chip, Surface, Portal, Modal, Searchbar } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../types/sales';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { UserService, UserMetadata } from '../../services/user.service';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ReportsTab'>;

export default function ReportsScreen({ navigation }: Props) {
    const theme = useTheme();
    const { showAlert } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [filter, setFilter] = useState('all');
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [cashierModalVisible, setCashierModalVisible] = useState(false);
    const [cashierSearch, setCashierSearch] = useState('');

    // Dashboard metrics
    const [metrics, setMetrics] = useState({
        revenue: 0,
        pending: 0,
        count: 0,
        average: 0
    });

    const [cashboxMetrics, setCashboxMetrics] = useState<any[]>([]);

    const [chartData, setChartData] = useState<{
        labels: string[],
        datasets: { data: number[] }[]
    }>({ labels: [], datasets: [{ data: [] }] });

    const [pieData, setPieData] = useState<any[]>([]);

    // Refresh data whenever screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            loadData();
            loadCashiers();
        }, [])
    );

    useEffect(() => {
        applyFilter();
    }, [filter, allSales, selectedCashierId]);

    const loadCashiers = async () => {
        try {
            const users = await UserService.getUsers();
            setCashiers(users);
        } catch (error) {
            console.error("Error loading cashiers:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await SalesService.getAllSales();
            setAllSales(data);
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudieron cargar las ventas' });
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        // TIME FILTER REMOVED BY REQUEST - ALWAYS SHOW ALL HISTORY

        let filtered = allSales.filter(s => {
            // Cashier Filter
            if (selectedCashierId) {
                // Determine if this sale belongs to the selected cashier
                // 1. Is it in their cashbox? (They received the money / manage the box)
                const isCashboxOwner = s.cashboxId === selectedCashierId;

                // 2. Did they create the sale? (Even if pending or paid to someone else)
                const isCreator = s.createdBy === selectedCashierId;

                return isCashboxOwner || isCreator;
            }

            return true;
        });

        // Sort desc
        filtered.sort((a, b) => {
            const timeA = parseTimestamp(a.createdAt);
            const timeB = parseTimestamp(b.createdAt);
            return timeB - timeA;
        });

        console.log(`Filtered result: ${filtered.length} sales`);

        setFilteredSales(filtered);
        processStats(filtered, 0); // 0 means calculate for all time
    };

    const parseTimestamp = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (val.toMillis) return val.toMillis(); // Firestore Timestamp
        if (val.seconds) return val.seconds * 1000;
        if (val instanceof Date) return val.getTime();
        return 0;
    };

    const processStats = (data: Sale[], startThreshold: number) => {
        // Safe number parsing
        const getVal = (v: any) => Number(v) || 0;

        const rev = data.reduce((sum, s) => {
            return sum + getVal(s.total);
        }, 0);

        const pend = data.filter(s => s.status === 'pending').reduce((sum, s) => sum + getVal(s.total), 0);

        setMetrics({
            revenue: rev,
            pending: pend,
            count: data.length,
            average: data.length > 0 ? rev / data.length : 0
        });

        // Prepare Chart Data
        const last7 = data.slice(0, 7).reverse();
        setChartData({
            labels: last7.map(s => {
                const ts = parseTimestamp(s.createdAt);
                return ts ? new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '?';
            }),
            datasets: [{ data: last7.map(s => getVal(s.total)) }]
        });

        // Pie Chart
        const methods: Record<string, number> = {};
        data.forEach(s => {
            const m = s.paymentMethod || 'unknown';
            methods[m] = (methods[m] || 0) + 1;
        });

        const colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9E9E9E'];
        const pie = Object.entries(methods).map(([name, count], i) => ({
            name: name === 'cash' ? 'Efectivo' : name === 'transfer' ? 'Transf.' : name === 'credit' ? 'Crédito' : name,
            population: count,
            color: colors[i % colors.length],
            legendFontColor: theme.colors.onSurface,
            legendFontSize: 12
        }));
        setPieData(pie);

        // Cashbox/Creator Metrics
        const boxSummary: Record<string, any> = {};

        data.forEach(s => {
            if (s.status === 'cancelled') return;

            const cId = s.createdBy || 'unknown';
            const cName = s.creatorName || 'Desconocido';

            const bId = s.cashboxId || 'unknown'; // Money receiver
            const bName = s.cashboxName || 'Sin Caja';

            const addMetric = (id: string, name: string, type: 'real' | 'teorico', amount: number) => {
                if (!boxSummary[id]) {
                    boxSummary[id] = { id, name, real: 0, teorico: 0, salesCount: 0 };
                }
                if (type === 'teorico') {
                    boxSummary[id].teorico += amount;
                    boxSummary[id].salesCount += 1;
                } else {
                    boxSummary[id].real += amount;
                }
            };

            const tsCreated = parseTimestamp(s.createdAt);
            const tsPaid = parseTimestamp(s.paidAt);
            const amount = getVal(s.total);

            // 1. Theoretical (Sales Generated)
            if (tsCreated >= startThreshold) {
                addMetric(cId, cName, 'teorico', amount);
            }

            // 2. Real (Money Received)
            if (s.status === 'paid' && tsPaid >= startThreshold) {
                // If no cashbox ID, explicit 'Unknown'
                const effectiveBId = bId === 'unknown' ? 'sincaja' : bId;
                const effectiveBName = bId === 'unknown' ? 'Sin Caja Asignada' : bName;
                addMetric(effectiveBId, effectiveBName, 'real', amount);
            }
        });

        // We do NOT filter this list by selectedCashierId anymore.
        // The 'data' input is already filtered. We want to see ALL metrics resulting from those sales.
        // E.g. Filter by "Seller A". We see sales created by A.
        // If those sales were paid to "Box B", we want to see "Box B: $Real" in the table.
        // If we filtered the summary, we would hide where the money actually went.
        let summaryList = Object.values(boxSummary);

        // Sort by Real amount descending
        summaryList.sort((a, b) => b.real - a.real || b.teorico - a.teorico);

        setCashboxMetrics(summaryList);
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'cash': return 'cash';
            case 'transfer': return 'bank-transfer';
            case 'mobile_pay': return 'cellphone-check';
            case 'credit': return 'account-clock';
            default: return 'help-circle';
        }
    };

    const getStatusIcon = (status: string) => {
        return status === 'paid' ? 'check-decagram' : 'alert-circle';
    };

    const getStatusColor = (status: string) => {
        return status === 'paid' ? '#4CAF50' : '#F44336';
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text variant="headlineMedium" style={styles.title}>Ventas y Métricas</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{filter === 'today' ? 'Resumen de hoy' : 'Análisis del período'}</Text>
                </View>
                <View style={styles.headerActions}>
                    <IconButton
                        icon={showFilters ? "filter-variant-remove" : "filter-menu"}
                        mode={showFilters ? "contained" : "contained-tonal"}
                        containerColor={showFilters ? theme.colors.primary : theme.colors.surfaceVariant}
                        iconColor={showFilters ? "#fff" : theme.colors.primary}
                        onPress={() => setShowFilters(!showFilters)}
                    />
                    <IconButton icon="refresh" onPress={loadData} loading={loading} />
                </View>
            </View>

            {showFilters && (
                <View style={styles.filterContainer}>
                    <Surface style={[styles.filterSurface, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]} elevation={0}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text variant="labelLarge" style={styles.filterLabel}>Filtrar por Caja / Vendedor</Text>
                            <Button
                                mode="outlined"
                                onPress={() => setCashierModalVisible(true)}
                                icon="account-search"
                                style={{ borderColor: theme.colors.outline }}
                            >
                                {selectedCashierId
                                    ? cashiers.find(c => c.id === selectedCashierId)?.displayName || 'Caja Seleccionada'
                                    : 'Todas las Cajas'
                                }
                            </Button>
                        </View>
                        {selectedCashierId && (
                            <Button
                                mode="text"
                                compact
                                onPress={() => setSelectedCashierId(null)}
                                style={{ marginTop: 8 }}
                            >
                                Borrar Filtro de Caja
                            </Button>
                        )}
                    </Surface>
                </View>
            )}

            <Portal>
                <Modal
                    visible={cashierModalVisible}
                    onDismiss={() => setCashierModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge">Seleccionar Caja</Text>
                        <IconButton icon="close" onPress={() => setCashierModalVisible(false)} />
                    </View>

                    <Searchbar
                        placeholder="Buscar vendedor..."
                        onChangeText={setCashierSearch}
                        value={cashierSearch}
                        style={{ marginBottom: 10, elevation: 0, backgroundColor: theme.colors.surfaceVariant }}
                    />

                    <ScrollView style={{ maxHeight: 300 }}>
                        <List.Item
                            title="Todas las Cajas"
                            onPress={() => {
                                setSelectedCashierId(null);
                                setCashierModalVisible(false);
                            }}
                            left={props => <List.Icon {...props} icon="all-inclusive" color={theme.colors.primary} />}
                            titleStyle={selectedCashierId === null ? { fontWeight: 'bold', color: theme.colors.primary } : {}}
                        />
                        {cashiers
                            .filter(c => c.displayName.toLowerCase().includes(cashierSearch.toLowerCase()))
                            .map(cashier => (
                                <List.Item
                                    key={cashier.id}
                                    title={cashier.displayName}
                                    description={cashier.role === 'admin' ? 'Administrador' : 'Vendedor'}
                                    onPress={() => {
                                        setSelectedCashierId(cashier.id);
                                        setCashierModalVisible(false);
                                    }}
                                    left={props => <List.Icon {...props} icon="account-cash" />}
                                    titleStyle={selectedCashierId === cashier.id ? { fontWeight: 'bold', color: theme.colors.primary } : {}}
                                />
                            ))}
                    </ScrollView>
                </Modal>
            </Portal>

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                    <Card style={[styles.metricCard, { backgroundColor: theme.dark ? '#1A237E' : '#E3F2FD' }]}>
                        <Card.Content>
                            <Avatar.Icon size={32} icon="currency-usd" style={{ backgroundColor: '#2196F3' }} color="white" />
                            <Text variant="labelMedium" style={{ marginTop: 8, color: theme.dark ? '#BBDEFB' : '#1976D2' }}>Ingresos</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.dark ? '#FFF' : '#0D47A1' }}>${metrics.revenue.toFixed(2)}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.metricCard, { backgroundColor: theme.dark ? '#4A148C' : '#FFEBEE' }]}>
                        <Card.Content>
                            <Avatar.Icon size={32} icon="account-cash" style={{ backgroundColor: '#F44336' }} color="white" />
                            <Text variant="labelMedium" style={{ marginTop: 8, color: theme.dark ? '#F8BBD0' : '#D32F2F' }}>Deuda</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.dark ? '#FFEBEE' : '#B71C1C' }}>${metrics.pending.toFixed(2)}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.metricCard, { backgroundColor: theme.dark ? '#1B5E20' : '#E8F5E9' }]}>
                        <Card.Content>
                            <Avatar.Icon size={32} icon="cart-outline" style={{ backgroundColor: '#4CAF50' }} color="white" />
                            <Text variant="labelMedium" style={{ marginTop: 8, color: theme.dark ? '#C8E6C9' : '#2E7D32' }}>Ventas</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.dark ? '#FFF' : '#1B5E20' }}>{metrics.count}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.metricCard, { backgroundColor: theme.dark ? '#4E342E' : '#FFF3E0' }]}>
                        <Card.Content>
                            <Avatar.Icon size={32} icon="trending-up" style={{ backgroundColor: '#FF9800' }} color="white" />
                            <Text variant="labelMedium" style={{ marginTop: 8, color: theme.dark ? '#FFE0B2' : '#EF6C00' }}>Promedio</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.dark ? '#FFF' : '#E65100' }}>${metrics.average.toFixed(2)}</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Charts Section */}
                {chartData.labels.length > 0 && (
                    <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Content>
                            <Text variant="titleMedium" style={{ marginBottom: 15 }}>Tendencia de Ventas</Text>
                            <LineChart
                                data={chartData}
                                width={Dimensions.get('window').width - 64}
                                height={220}
                                chartConfig={{
                                    backgroundColor: theme.colors.surface,
                                    backgroundGradientFrom: theme.colors.surface,
                                    backgroundGradientTo: theme.colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => theme.dark ? `rgba(144, 202, 249, ${opacity})` : `rgba(33, 150, 243, ${opacity})`,
                                    labelColor: (opacity = 1) => theme.colors.onSurface,
                                    propsForDots: { r: "5", strokeWidth: "2", stroke: "#2196F3" }
                                }}
                                bezier
                                style={{ borderRadius: 16 }}
                            />
                        </Card.Content>
                    </Card>
                )}

                <View style={styles.chartRow}>
                    <Card style={[styles.chartCard, { flex: 1, backgroundColor: theme.colors.surface }]}>
                        <Card.Content>
                            <Text variant="titleMedium">Métodos de Pago</Text>
                            <PieChart
                                data={pieData.map(p => ({ ...p, legendFontColor: theme.colors.onSurface }))}
                                width={Dimensions.get('window').width - 64}
                                height={180}
                                chartConfig={{ color: (opacity = 1) => theme.colors.onSurface }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                center={[10, 0]}
                                absolute
                            />
                        </Card.Content>
                    </Card>
                </View>

                {/* Cashbox Summary Table */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Resumen de Cajas</Text>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title>Caja / Vendedor</DataTable.Title>
                            <DataTable.Title numeric>Real (Pago)</DataTable.Title>
                            <DataTable.Title numeric>Teórico (+Deuda)</DataTable.Title>
                        </DataTable.Header>

                        {cashboxMetrics.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: theme.colors.outline }}>No hay datos de cajas en este período</Text>
                            </View>
                        ) : (
                            cashboxMetrics.map((box) => (
                                <DataTable.Row
                                    key={box.id}
                                    onPress={() => navigation.navigate('SalesHistoryFull', { cashboxId: box.id })}
                                >
                                    <DataTable.Cell>
                                        <View>
                                            <Text style={{ fontWeight: 'bold' }}>{box.name}</Text>
                                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                {box.salesCount} ventas
                                            </Text>
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>${box.real.toFixed(2)}</Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric>
                                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>${box.teorico.toFixed(2)}</Text>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))
                        )}
                    </DataTable>
                </Card>

                {/* Sales Table */}
                <Text variant="titleMedium" style={styles.sectionTitle}>Registro de Ventas</Text>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title><Text variant="labelMedium" style={{ fontWeight: 'bold' }}>Cliente/Detalle</Text></DataTable.Title>
                            <DataTable.Title numeric><Text variant="labelMedium" style={{ fontWeight: 'bold' }}>Pago</Text></DataTable.Title>
                            <DataTable.Title numeric><Text variant="labelMedium" style={{ fontWeight: 'bold' }}>Total</Text></DataTable.Title>
                        </DataTable.Header>

                        {filteredSales.slice(0, 5).map((sale) => (
                            <DataTable.Row
                                key={sale.id}
                                onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id! })}
                            >
                                <DataTable.Cell>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons
                                            name={getStatusIcon(sale.status)}
                                            size={16}
                                            color={getStatusColor(sale.status)}
                                            style={{ marginRight: 5 }}
                                        />
                                        <View>
                                            <Text numberOfLines={1} style={{ fontSize: 13, color: theme.colors.onSurface }}>
                                                {sale.clientName || 'Cons. Final'}
                                            </Text>
                                            {sale.cashboxName && (
                                                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}>
                                                    👤 {sale.cashboxName}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <MaterialCommunityIcons name={getPaymentIcon(sale.paymentMethod) as any} size={20} color={theme.colors.onSurfaceVariant} />
                                </DataTable.Cell>
                                <DataTable.Cell numeric>
                                    <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>${sale.total.toFixed(2)}</Text>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                    <Divider />
                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('SalesHistoryFull')}
                        style={styles.viewMore}
                        contentStyle={{ paddingVertical: 8 }}
                    >
                        VER TODO EL HISTORIAL
                    </Button>
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterSurface: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterLabel: {
        marginBottom: 10,
        fontWeight: 'bold',
        opacity: 0.8,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    filterButtons: {
        marginBottom: 12,
    },
    filterDivider: {
        marginVertical: 15,
        opacity: 0.3,
    },
    cashierFilter: {
        flexDirection: 'row',
    },
    filterChip: {
        marginRight: 8,
    },
    scroll: {
        padding: 16,
        paddingTop: 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        width: '48%',
        marginBottom: 12,
        borderRadius: 16,
        elevation: 0,
    },
    chartCard: {
        borderRadius: 16,
        marginBottom: 20,
        elevation: 0,
    },
    chartRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    viewMore: {
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
    },
    modalContent: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    }
});
