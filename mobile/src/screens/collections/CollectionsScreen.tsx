import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { List, Text, ActivityIndicator, Button, Chip, Card, Avatar, useTheme, Searchbar, SegmentedButtons, Divider } from 'react-native-paper';
import { SalesService } from '../../services/sales.service';
import { ClientService } from '../../services/client.service';
import { Sale } from '../../types/sales';
import { Client } from '../../types/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../navigation/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Debtor {
    client: Client;
    debt: number;
    sales: Sale[];
    lastSaleDate: number;
}

export default function CollectionsScreen() {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert, showToast } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [debtors, setDebtors] = useState<Debtor[]>([]);
    const [filteredDebtors, setFilteredDebtors] = useState<Debtor[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('debt'); // 'debt' or 'date'

    useEffect(() => {
        setLoading(true);
        const unsubscribe = SalesService.subscribeToPendingSales(async (pendingSales) => {
            try {
                const uniqueClientIds = Array.from(new Set(pendingSales.map(s => s.clientId).filter(Boolean))) as string[];
                const debtorsMap: Record<string, { debt: number, sales: Sale[], lastDate: number }> = {};

                pendingSales.forEach(sale => {
                    if (sale.clientId) {
                        if (!debtorsMap[sale.clientId]) {
                            debtorsMap[sale.clientId] = { debt: 0, sales: [], lastDate: 0 };
                        }
                        debtorsMap[sale.clientId].debt += sale.total;
                        debtorsMap[sale.clientId].sales.push(sale);
                        if (sale.createdAt > debtorsMap[sale.clientId].lastDate) {
                            debtorsMap[sale.clientId].lastDate = sale.createdAt;
                        }
                    }
                });

                const debtorsList: Debtor[] = [];
                for (const clientId of uniqueClientIds) {
                    const client = await ClientService.getClientById(clientId);
                    if (client) {
                        debtorsList.push({
                            client,
                            debt: debtorsMap[clientId].debt,
                            sales: debtorsMap[clientId].sales,
                            lastSaleDate: debtorsMap[clientId].lastDate
                        });
                    }
                }
                setDebtors(debtorsList);
            } catch (error) {
                console.error(error);
                showAlert({ title: 'Error', message: 'No se pudieron actualizar los deudores' });
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, debtors, sortBy]);

    const applyFilters = () => {
        let filtered = debtors.filter(d =>
            d.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.client.phone && d.client.phone.includes(searchQuery))
        );

        if (sortBy === 'debt') {
            filtered.sort((a, b) => b.debt - a.debt);
        } else {
            filtered.sort((a, b) => b.lastSaleDate - a.lastSaleDate);
        }

        setFilteredDebtors(filtered);
    };

    const handleRemind = (client: Client, debt: number) => {
        const message = `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${debt.toFixed(2)} en Cuadra.`;
        showAlert({
            title: 'Enviar Recordatorio',
            message: `Esta acción abrirá WhatsApp con el siguiente mensaje:\n\n"${message}"`,
            confirmText: 'Abrir WhatsApp',
            showCancel: true,
            onConfirm: () => showToast('Abriendo WhatsApp...')
        });
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.headerTop}>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>Cobranzas</Text>
                    <View style={styles.totalBadge}>
                        <Text variant="labelSmall" style={{ color: '#fff' }}>TOTAL DEUDA</Text>
                        <Text variant="titleMedium" style={{ color: '#fff', fontWeight: 'bold' }}>${totalDebt.toFixed(2)}</Text>
                    </View>
                </View>

                <Searchbar
                    placeholder="Buscar deudor..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.search, { backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }]}
                    elevation={0}
                />

                <SegmentedButtons
                    value={sortBy}
                    onValueChange={setSortBy}
                    buttons={[
                        { value: 'debt', label: 'Mayor Deuda', icon: 'sort-numeric-descending' },
                        { value: 'date', label: 'Más Reciente', icon: 'calendar-clock' },
                    ]}
                    style={styles.sortButtons}
                />
            </View>

            <FlatList
                data={filteredDebtors}
                keyExtractor={item => item.client.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ClientProfile', { clientId: item.client.id })}
                            activeOpacity={0.7}
                        >
                            <Card.Content style={styles.cardContent}>
                                <View style={styles.clientRow}>
                                    <Avatar.Text
                                        size={48}
                                        label={item.client.name.substring(0, 2).toUpperCase()}
                                        style={{ backgroundColor: theme.dark ? '#311B92' : '#FFEBEE' }}
                                        color={theme.dark ? '#D1C4E9' : '#F44336'}
                                    />
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{item.client.name}</Text>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
                                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>
                                                Último crédito: {new Date(item.lastSaleDate).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.debtBox}>
                                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>DEBE</Text>
                                        <Text variant="titleLarge" style={{ color: theme.dark ? '#FF8A80' : '#D32F2F', fontWeight: 'bold' }}>
                                            ${item.debt.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </TouchableOpacity>
                        <Divider />
                        <Card.Actions>
                            <Button
                                icon="whatsapp"
                                mode="text"
                                onPress={() => handleRemind(item.client, item.debt)}
                                textColor="#25D366"
                            >
                                Recordar
                            </Button>
                            <Button
                                icon="chevron-right"
                                mode="contained"
                                onPress={() => navigation.navigate('ClientProfile', { clientId: item.client.id })}
                                style={{ borderRadius: 8 }}
                            >
                                Gestionar
                            </Button>
                        </Card.Actions>
                    </Card>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-check-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>No hay deudas pendientes en este momento.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
    },
    totalBadge: {
        backgroundColor: '#F44336',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    search: {
        borderRadius: 12,
        marginBottom: 12,
    },
    sortButtons: {
        marginBottom: 4,
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardContent: {
        paddingVertical: 16,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    debtBox: {
        alignItems: 'flex-end',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        padding: 40,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
        color: '#999',
        fontSize: 16,
    }
});
