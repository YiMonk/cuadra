import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView as RNScrollView } from 'react-native';
import { Text, Searchbar, Card, Chip, IconButton, useTheme, ActivityIndicator, Divider, Button, Portal, Modal, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../types/sales';
import { AppStackParamList } from '../../navigation/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserService, UserMetadata } from '../../services/user.service';

const formatDate = (timestamp: number) => {
    try {
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(timestamp));
    } catch (e) {
        return new Date(timestamp).toLocaleDateString();
    }
};

type Props = NativeStackScreenProps<AppStackParamList, 'SalesHistoryFull'>;

export default function SalesHistoryScreen({ route }: Props) {
    const params = route.params;
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const [sales, setSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
    const [showFilters, setShowFilters] = useState(params?.cashboxId ? true : false);
    const [selectedCashboxId, setSelectedCashboxId] = useState<string | null>(params?.cashboxId || null);
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [cashierModalVisible, setCashierModalVisible] = useState(false);
    const [cashierSearch, setCashierSearch] = useState('');

    useEffect(() => {
        loadSales();
        loadCashiers();
    }, []);

    const loadCashiers = async () => {
        try {
            const data = await UserService.getUsers();
            setCashiers(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (params?.cashboxId) {
            setSelectedCashboxId(params.cashboxId);
            setShowFilters(true);
        }
    }, [params?.cashboxId]);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, filterStatus, sales, selectedCashboxId]);

    const loadSales = async () => {
        setLoading(true);
        try {
            const data = await SalesService.getAllSales();
            setSales(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = sales;

        if (filterStatus !== 'all') {
            result = result.filter(s => s.status === filterStatus);
        }

        if (selectedCashboxId) {
            if (selectedCashboxId === 'default') {
                result = result.filter(s => !s.cashboxId);
            } else {
                result = result.filter(s => s.cashboxId === selectedCashboxId);
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.id || '').toLowerCase().includes(query) ||
                (s.clientId || '').toLowerCase().includes(query) ||
                (s.clientName || '').toLowerCase().includes(query) ||
                s.items.some(item => item.name.toLowerCase().includes(query))
            );
        }

        setFilteredSales(result);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return '#4CAF50';
            case 'pending': return '#FF9800';
            case 'cancelled': return theme.colors.error;
            default: return theme.colors.outline;
        }
    };

    const renderSaleItem = ({ item }: { item: Sale }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('SaleDetail', { saleId: item.id || '' })}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                            {formatDate(item.createdAt)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                            ID: ...{(item.id || '').slice(-8)}
                        </Text>
                    </View>
                    <Chip
                        textStyle={{ color: 'white', fontWeight: 'bold' }}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                    >
                        {item.status === 'paid' ? 'Pagado' : item.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                    </Chip>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
                        <Text variant="bodyLarge" style={styles.totalText}>
                            Total: ${item.total.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="credit-card-outline" size={16} color={theme.colors.secondary} />
                        <Text variant="bodyMedium">
                            {item.paymentMethod === 'cash' ? 'Efectivo' : item.paymentMethod === 'credit' ? 'Crédito' : 'Transferencia'}
                        </Text>
                    </View>

                    {item.cashboxName && (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="account-cash-outline" size={16} color={theme.colors.onSurfaceVariant} />
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Caja: {item.cashboxName}
                            </Text>
                        </View>
                    )}

                    {item.notes && (
                        <View style={styles.notesRow}>
                            <MaterialCommunityIcons name="note-outline" size={14} color={theme.colors.outline} />
                            <Text variant="bodySmall" numberOfLines={1} style={styles.notesText}>
                                {item.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                        icon="arrow-left"
                        onPress={() => navigation.goBack()}
                    />
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Historial</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                        icon={showFilters ? "filter-variant-remove" : "filter-menu"}
                        mode={showFilters ? "contained" : "contained-tonal"}
                        containerColor={showFilters ? theme.colors.primary : theme.colors.surfaceVariant}
                        iconColor={showFilters ? "#fff" : theme.colors.primary}
                        onPress={() => setShowFilters(!showFilters)}
                    />
                    <IconButton
                        icon="refresh"
                        onPress={loadSales}
                        loading={loading}
                    />
                </View>
            </View>

            {showFilters && (
                <View style={styles.filterSection}>
                    <Searchbar
                        placeholder="Buscar por ID, producto o cliente..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchbar}
                        elevation={0}
                    />

                    <View style={styles.chipRow}>
                        <Chip
                            selected={filterStatus === 'all'}
                            onPress={() => setFilterStatus('all')}
                            style={styles.filterChip}
                            showSelectedOverlay
                        >Todos</Chip>
                        <Chip
                            selected={filterStatus === 'paid'}
                            onPress={() => setFilterStatus('paid')}
                            style={styles.filterChip}
                            showSelectedOverlay
                        >Pagados</Chip>
                        <Chip
                            selected={filterStatus === 'pending'}
                            onPress={() => setFilterStatus('pending')}
                            style={styles.filterChip}
                            showSelectedOverlay
                        >Pendientes</Chip>
                        <Chip
                            selected={filterStatus === 'cancelled'}
                            onPress={() => setFilterStatus('cancelled')}
                            style={styles.filterChip}
                            showSelectedOverlay
                        >Cancelados</Chip>
                    </View>

                    <Divider style={{ marginVertical: 10, opacity: 0.2 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>Filtrar por Caja / Vendedor</Text>
                        <Button
                            mode="text"
                            compact
                            onPress={() => {
                                setCashierSearch('');
                                setCashierModalVisible(true);
                            }}
                            icon="account-search"
                        >
                            {selectedCashboxId === 'default'
                                ? 'Ventas Generales'
                                : selectedCashboxId
                                    ? cashiers.find(c => c.id === selectedCashboxId)?.displayName || 'Seleccionar...'
                                    : 'Todas las Cajas'
                            }
                        </Button>
                    </View>
                </View>
            )}

            <Portal>
                <Modal
                    visible={cashierModalVisible}
                    onDismiss={() => setCashierModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleMedium">Seleccionar Caja</Text>
                        <IconButton icon="close" size={20} onPress={() => setCashierModalVisible(false)} />
                    </View>

                    <Searchbar
                        placeholder="Buscar vendedor..."
                        onChangeText={setCashierSearch}
                        value={cashierSearch}
                        style={{ marginBottom: 10, elevation: 0, backgroundColor: theme.colors.surfaceVariant }}
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        iconColor={theme.colors.primary}
                    />

                    <RNScrollView style={{ maxHeight: 300 }}>
                        <List.Item
                            title="Todas las Cajas"
                            onPress={() => {
                                setSelectedCashboxId(null);
                                setCashierModalVisible(false);
                            }}
                            left={props => <List.Icon {...props} icon="all-inclusive" color={theme.colors.primary} />}
                            titleStyle={!selectedCashboxId ? { fontWeight: 'bold', color: theme.colors.primary } : {}}
                        />
                        <List.Item
                            title="Ventas Generales (Sin Caja)"
                            onPress={() => {
                                setSelectedCashboxId('default');
                                setCashierModalVisible(false);
                            }}
                            left={props => <List.Icon {...props} icon="account-question" color={theme.colors.secondary} />}
                            titleStyle={selectedCashboxId === 'default' ? { fontWeight: 'bold', color: theme.colors.primary } : {}}
                        />
                        {cashiers
                            .filter(c => c.displayName.toLowerCase().includes(cashierSearch.toLowerCase()))
                            .map(cashier => (
                                <List.Item
                                    key={cashier.id}
                                    title={cashier.displayName}
                                    description={cashier.role === 'admin' ? 'Administrador' : 'Vendedor'}
                                    onPress={() => {
                                        setSelectedCashboxId(cashier.id);
                                        setCashierModalVisible(false);
                                    }}
                                    left={props => <List.Icon {...props} icon="account-cash" />}
                                    titleStyle={selectedCashboxId === cashier.id ? { fontWeight: 'bold', color: theme.colors.primary } : {}}
                                />
                            ))}
                    </RNScrollView>
                </Modal>
            </Portal>

            {selectedCashboxId && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                    <Chip
                        icon="account-cash"
                        onClose={() => setSelectedCashboxId(null)}
                        style={{ backgroundColor: theme.colors.secondaryContainer, alignSelf: 'flex-start' }}
                        mode="flat"
                    >
                        {selectedCashboxId === 'default' ? 'Filtrando: Ventas Generales' : `Filtrando: ${cashiers.find(c => c.id === selectedCashboxId)?.displayName || 'Caja'}`}
                    </Chip>
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" />
                    <Text style={{ marginTop: 10 }}>Cargando ventas...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSales}
                    renderItem={renderSaleItem}
                    keyExtractor={item => item.id || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="cart-off" size={64} color={theme.colors.outline} />
                            <Text variant="titleMedium" style={{ color: theme.colors.outline, marginTop: 10 }}>
                                {selectedCashboxId ? 'No hay ventas en esta caja' : 'No se encontraron ventas'}
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 8,
        paddingVertical: 10,
        justifyContent: 'space-between'
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        paddingTop: 8,
        marginHorizontal: 16,
        borderRadius: 20,
        marginBottom: 8,
    },
    searchbar: {
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        height: 45,
    },
    chipRow: {
        flexDirection: 'row',
        marginTop: 10,
        flexWrap: 'wrap',
        gap: 4
    },
    filterChip: {
        marginRight: 4,
        marginBottom: 4
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardBody: {
        gap: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    totalText: {
        fontWeight: 'bold',
    },
    notesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    notesText: {
        color: '#757575',
        fontStyle: 'italic',
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
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
