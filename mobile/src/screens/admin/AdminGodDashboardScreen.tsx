import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, useTheme, IconButton, Button, Divider, ActivityIndicator, List, Chip, Menu, Portal, Dialog, TextInput, SegmentedButtons, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { UserService, UserMetadata } from '../../services/user.service';
import { DataManager } from '../../services/DataManager';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../types/sales';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

type Props = NativeStackScreenProps<AppStackParamList, 'AdminGodDashboard'>;

export default function AdminGodDashboardScreen({ navigation }: Props) {
    const theme = useTheme();
    const { user } = useAuth();
    const { showToast } = useNotifications();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | 'all'>('all');
    const [menuVisible, setMenuVisible] = useState(false);
    const [ownerMenuVisible, setOwnerMenuVisible] = useState(false);

    // Edit User State
    const [selectedUser, setSelectedUser] = useState<UserMetadata | null>(null);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'admingod' | 'admin' | 'staff'>('staff');
    const [wipeDialogVisible, setWipeDialogVisible] = useState(false);
    const [wiping, setWiping] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const handleWipeDatabase = async () => {
        if (!user) return;
        setWiping(true);
        try {
            await DataManager.wipeDatabase(user.uid);
            showToast('Base de datos limpiada con éxito');
            setWipeDialogVisible(false);
            loadData();
        } catch (error) {
            console.error(error);
            showToast('Error al limpiar la base de datos');
        } finally {
            setWiping(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [allUsers, allSales] = await Promise.all([
                UserService.getUsers(),
                SalesService.getAllSales ? SalesService.getAllSales() : []
            ]);
            setUsers(allUsers);
            // Fallback if getSales doesn't exist (need to check sales.service.ts more thoroughly)
            setSales(allSales as Sale[]);
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Owners (Principal Users: Role admin and no ownerId OR ownerId == self)
    const owners = useMemo(() => {
        return users.filter(u => u.role === 'admin' && (!u.ownerId || u.ownerId === u.id));
    }, [users]);

    // Get the whole team for a selected owner
    const activeTeamIds = useMemo(() => {
        if (selectedOwnerId === 'all') return users.map(u => u.id);
        const team = users.filter(u => u.ownerId === selectedOwnerId || u.id === selectedOwnerId);
        return team.map(u => u.id);
    }, [selectedOwnerId, users]);

    // Filter data by time and selected team
    const filteredData = useMemo(() => {
        let startTime = 0;
        const now = Date.now();
        if (timeRange === '7d') startTime = subDays(now, 7).getTime();
        else if (timeRange === '30d') startTime = subDays(now, 30).getTime();

        const filteredSales = sales.filter(s => {
            const inTime = s.createdAt >= startTime;
            const byTeam = activeTeamIds.includes(s.createdBy || '');
            return inTime && byTeam;
        });

        const filteredUsers = users.filter(u => {
            const inTime = u.createdAt >= startTime;
            const byTeam = selectedOwnerId === 'all' ? true : activeTeamIds.includes(u.id);
            return inTime && byTeam;
        });

        return { filteredSales, filteredUsers };
    }, [sales, users, timeRange, activeTeamIds, selectedOwnerId]);

    // Graph Data Preparation
    const chartData = useMemo(() => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 10;
        const labels: string[] = [];
        const datasets: number[] = [];
        const userDatasets: number[] = [];

        const interval = eachDayOfInterval({
            start: subDays(new Date(), days - 1),
            end: new Date()
        });

        interval.forEach(day => {
            labels.push(format(day, 'dd/MM', { locale: es }));

            const daySales = filteredData.filteredSales.filter(s =>
                isWithinInterval(new Date(s.createdAt), {
                    start: startOfDay(day),
                    end: endOfDay(day)
                })
            );
            datasets.push(daySales.length);

            const dayUsers = filteredData.filteredUsers.filter(u =>
                isWithinInterval(new Date(u.createdAt), {
                    start: startOfDay(day),
                    end: endOfDay(day)
                })
            );
            userDatasets.push(dayUsers.length);
        });

        return { labels, datasets, userDatasets };
    }, [filteredData, timeRange]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Cargando Panel de Control...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} iconColor={theme.colors.onSurface} />
                        <View>
                            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>AdminGod</Text>
                            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>Gestión Global</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <IconButton
                            icon="database-remove"
                            iconColor={theme.colors.error}
                            onPress={() => setWipeDialogVisible(true)}
                        />
                        <IconButton icon="refresh" onPress={loadData} />
                    </View>
                </View>

                {/* Filters Row */}
                <View style={styles.filterRow}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={() => setMenuVisible(false)}
                        anchor={
                            <Chip
                                icon="calendar"
                                onPress={() => setMenuVisible(true)}
                                style={styles.chip}
                            >
                                {timeRange === '7d' ? 'Últimos 7 días' : timeRange === '30d' ? 'Últimos 30 días' : 'Todo'}
                            </Chip>
                        }
                    >
                        <Menu.Item onPress={() => { setTimeRange('7d'); setMenuVisible(false); }} title="7 días" />
                        <Menu.Item onPress={() => { setTimeRange('30d'); setMenuVisible(false); }} title="30 días" />
                        <Menu.Item onPress={() => { setTimeRange('all'); setMenuVisible(false); }} title="Todo el tiempo" />
                    </Menu>

                    <Menu
                        visible={ownerMenuVisible}
                        onDismiss={() => setOwnerMenuVisible(false)}
                        anchor={
                            <Chip
                                icon="account-group"
                                onPress={() => setOwnerMenuVisible(true)}
                                style={[styles.chip, { backgroundColor: theme.colors.surface }]}
                                textStyle={{ color: theme.colors.onSurface }}
                            >
                                {selectedOwnerId === 'all' ? 'Todos los Negocios' : owners.find(o => o.id === selectedOwnerId)?.displayName || 'Negocio'}
                            </Chip>
                        }
                    >
                        <Menu.Item onPress={() => { setSelectedOwnerId('all'); setOwnerMenuVisible(false); }} title="Todos" titleStyle={{ color: theme.colors.onSurface }} />
                        {owners.map(o => (
                            <Menu.Item
                                key={o.id}
                                onPress={() => { setSelectedOwnerId(o.id); setOwnerMenuVisible(false); }}
                                title={o.displayName}
                                titleStyle={{ color: theme.colors.onSurface }}
                            />
                        ))}
                    </Menu>
                </View>

                {/* Jump to User Management */}
                <Card style={styles.manageCard} mode="contained">
                    <TouchableRipple
                        onPress={() => navigation.navigate('AdminUserManagement')}
                        style={styles.manageRipple}
                    >
                        <View style={styles.manageContent}>
                            <View style={styles.manageIconCircle}>
                                <IconButton icon="account-group" iconColor="white" size={24} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Gestión de Usuarios</Text>
                                <Text variant="bodySmall">Administra cuentas, roles y bloqueos</Text>
                            </View>
                            <IconButton icon="chevron-right" />
                        </View>
                    </TouchableRipple>
                </Card>

                {/* KPI Cards Section */}
                <View style={styles.kpiGrid}>
                    <Card style={[styles.kpiCard, { backgroundColor: theme.dark ? '#1e213a' : '#E3F2FD' }]}>
                        <Card.Content>
                            <IconButton icon="storefront" iconColor="#1565C0" size={24} style={styles.kpiIcon} />
                            <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.dark ? '#90CAF9' : '#1565C0' }]}>Tiendas (Admins)</Text>
                            <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.dark ? '#E3F2FD' : '#0D47A1' }]}>{owners.length}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.kpiCard, { backgroundColor: theme.dark ? '#2d213a' : '#F3E5F5' }]}>
                        <Card.Content>
                            <IconButton icon="account-multiple" iconColor="#7B1FA2" size={24} style={styles.kpiIcon} />
                            <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.dark ? '#CE93D8' : '#7B1FA2' }]}>Usuarios Totales</Text>
                            <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.dark ? '#F3E5F5' : '#4A148C' }]}>{users.length}</Text>
                        </Card.Content>
                    </Card>
                </View>

                <View style={styles.kpiGrid}>
                    <Card style={[styles.kpiCard, { backgroundColor: theme.dark ? '#1b2e1e' : '#E8F5E9' }]}>
                        <Card.Content>
                            <IconButton icon="cash-multiple" iconColor="#1B5E20" size={24} style={styles.kpiIcon} />
                            <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.dark ? '#A5D6A7' : '#1B5E20' }]}>Volumen Ventas</Text>
                            <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.dark ? '#E8F5E9' : '#1B5E20' }]}>
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(filteredData.filteredSales.reduce((acc, s) => acc + (s.total || 0), 0))}
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                <View style={styles.kpiGrid}>
                    <Card style={[styles.kpiCard, { backgroundColor: theme.dark ? '#1b2e1e' : '#F1F8E9' }]}>
                        <Card.Content>
                            <IconButton icon="cart-check" iconColor="#2E7D32" size={24} style={styles.kpiIcon} />
                            <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.dark ? '#A5D6A7' : '#2E7D32' }]}>Cant. Ventas</Text>
                            <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.dark ? '#E8F5E9' : '#1B5E20' }]}>{sales.length}</Text>
                        </Card.Content>
                    </Card>
                    <Card style={[styles.kpiCard, { backgroundColor: theme.dark ? '#33261a' : '#FFF3E0' }]}>
                        <Card.Content>
                            <IconButton icon="account-plus" iconColor="#EF6C00" size={24} style={styles.kpiIcon} />
                            <Text variant="labelMedium" style={[styles.kpiLabel, { color: theme.dark ? '#FFCC80' : '#EF6C00' }]}>Registros Recientes</Text>
                            <Text variant="headlineMedium" style={[styles.kpiValue, { color: theme.dark ? '#FFF3E0' : '#E65100' }]}>{filteredData.filteredUsers.length}</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Charts */}
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} mode="elevated" elevation={1}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>Actividad de Ventas</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={{
                                    labels: chartData.labels,
                                    datasets: [{ data: chartData.datasets }]
                                }}
                                width={Math.max(Dimensions.get('window').width - 60, chartData.labels.length * 60)}
                                height={220}
                                chartConfig={{
                                    backgroundColor: theme.colors.surface,
                                    backgroundGradientFrom: theme.colors.surface,
                                    backgroundGradientTo: theme.colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => theme.dark ? `rgba(208, 188, 255, ${opacity})` : `rgba(103, 80, 164, ${opacity})`,
                                    labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity * 0.5})` : `rgba(0, 0, 0, ${opacity * 0.5})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "5", strokeWidth: "2", stroke: theme.colors.primary }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </ScrollView>
                    </Card.Content>
                </Card>

                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} mode="elevated" elevation={1}>
                    <Card.Content>
                        <Text variant="titleMedium" style={[styles.chartTitle, { color: theme.colors.onSurface }]}>Nuevos Registros (Usuarios)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={{
                                    labels: chartData.labels,
                                    datasets: [{ data: chartData.userDatasets }]
                                }}
                                width={Math.max(Dimensions.get('window').width - 60, chartData.labels.length * 60)}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero
                                chartConfig={{
                                    backgroundColor: theme.colors.surface,
                                    backgroundGradientFrom: theme.colors.surface,
                                    backgroundGradientTo: theme.colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => theme.dark ? `rgba(129, 199, 132, ${opacity})` : `rgba(50, 200, 100, ${opacity})`,
                                    labelColor: (opacity = 1) => theme.dark ? `rgba(255, 255, 255, ${opacity * 0.5})` : `rgba(0, 0, 0, ${opacity * 0.5})`,
                                }}
                                style={styles.chart}
                            />
                        </ScrollView>
                    </Card.Content>
                </Card>

                <Portal>
                    <Dialog visible={wipeDialogVisible} onDismiss={() => !wiping && setWipeDialogVisible(false)}>
                        <Dialog.Title style={{ color: theme.colors.error }}>⚠️ LIMPIAR BASE DE DATOS</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={{ fontWeight: 'bold' }}>¿Estás seguro de que quieres eliminar TODOS los datos?</Paragraph>
                            <Paragraph>Se eliminarán:</Paragraph>
                            <List.Item title="Todos los usuarios (excepto tú)" left={props => <List.Icon {...props} icon="account-multiple-remove" />} />
                            <List.Item title="Todas las ventas" left={props => <List.Icon {...props} icon="cart-remove" />} />
                            <List.Item title="Todo el inventario" left={props => <List.Icon {...props} icon="package-variant-remove" />} />
                            <List.Item title="Todos los clientes" left={props => <List.Icon {...props} icon="account-group" />} />
                            <Paragraph style={{ color: theme.colors.error, marginTop: 10 }}>
                                Esta acción NO se puede deshacer.
                            </Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setWipeDialogVisible(false)} disabled={wiping}>Cancelar</Button>
                            <Button
                                onPress={handleWipeDatabase}
                                loading={wiping}
                                disabled={wiping}
                                mode="contained"
                                buttonColor={theme.colors.error}
                            >
                                ¡SÍ, BORRAR TODO!
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal >

                <View style={{ height: 40 }} />
            </ScrollView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        opacity: 0.5,
        fontWeight: '600',
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    chip: {
        backgroundColor: 'white',
        borderRadius: 12,
        elevation: 1,
    },
    manageCard: {
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(103, 80, 164, 0.05)',
        overflow: 'hidden',
    },
    manageRipple: {
        padding: 15,
    },
    manageContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    manageIconCircle: {
        backgroundColor: '#6750A4',
        borderRadius: 15,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kpiGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    kpiCard: {
        flex: 1,
        borderRadius: 24,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    kpiIcon: {
        margin: -8,
        marginBottom: 4,
    },
    kpiLabel: {
        opacity: 0.6,
        fontWeight: 'bold',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    kpiValue: {
        fontSize: 26,
        fontWeight: '900',
    },
    chartCard: {
        marginTop: 10,
        marginBottom: 15,
        borderRadius: 24,
        padding: 5,
        backgroundColor: 'white',
        borderWidth: 0,
        elevation: 1,
    },
    chartTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        opacity: 0.8,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 20,
        paddingRight: 40,
    },
});
