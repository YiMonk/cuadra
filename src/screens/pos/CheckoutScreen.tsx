import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, RadioButton, Divider, List, Portal, Modal, Searchbar, Avatar, useTheme } from 'react-native-paper';
import { useCart } from '../../context/CartContext';
import { SalesService } from '../../services/sales.service';
import { ClientService } from '../../services/client.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Client } from '../../types/client';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { UserService, UserMetadata } from '../../services/user.service';

type Props = NativeStackScreenProps<AppStackParamList, 'Checkout'>;

export default function CheckoutScreen({ navigation }: Props) {
    const { items, total, clearCart, selectedClient, setSelectedClient } = useCart();
    const { user: currentUser } = useAuth();
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    // Cashier selection
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<{ id: string, name: string } | null>(null);
    const [cashierModalVisible, setCashierModalVisible] = useState(false);

    // Client selection
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    useEffect(() => {
        const unsubscribe = ClientService.subscribeToClients((list) => {
            setClients(list);
            setFilteredClients(list);
        });

        // Load cashiers
        loadCashiers();

        return () => unsubscribe();
    }, []);

    const loadCashiers = async () => {
        try {
            const users = await UserService.getUsers();
            setCashiers(users);

            // Auto-select current user if available
            if (currentUser && !selectedCashier) {
                setSelectedCashier({ id: currentUser.uid, name: currentUser.displayName || 'Vendedor' });
            }
        } catch (error) {
            console.error("Error loading cashiers:", error);
        }
    };

    const onSearchClient = (query: string) => {
        setClientSearch(query);
        if (!query) {
            setFilteredClients(clients);
        } else {
            setFilteredClients(clients.filter(c =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.phone.includes(query)
            ));
        }
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientModalVisible(false);
        setClientSearch('');
        setFilteredClients(clients);
    };

    const handleConfirm = async () => {
        if (paymentMethod === 'credit' && !selectedClient) {
            showAlert({ title: 'Atención', message: 'Se requiere un cliente para ventas a crédito/fiado.' });
            return;
        }

        setLoading(true);
        try {
            await SalesService.createSale({
                items,
                total,
                paymentMethod: paymentMethod as any,
                clientId: selectedClient?.id,
                clientName: selectedClient?.name,
                cashboxId: selectedCashier?.id,
                cashboxName: selectedCashier?.name,
            }, currentUser ? { id: currentUser.uid, name: currentUser.displayName || 'Vendedor' } : undefined);

            showToast('¡Venta registrada con éxito!');
            clearCart();
            navigation.navigate('MainTabs' as any);
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message || 'No se pudo registrar la venta' });
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.onBackground }}>El carrito está vacío</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Client Selector */}
                <CardSection title="Cliente">
                    {selectedClient ? (
                        <List.Item
                            title={selectedClient.name}
                            description={selectedClient.phone}
                            left={() => <Avatar.Icon size={40} icon="account" style={{ backgroundColor: theme.colors.primary }} />}
                            right={() => <Button onPress={() => setClientModalVisible(true)}>Cambiar</Button>}
                            titleStyle={{ color: theme.colors.onSurface }}
                            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                        />
                    ) : (
                        <Button
                            mode="outlined"
                            icon="account-plus"
                            onPress={() => setClientModalVisible(true)}
                            style={[styles.selectClientBtn, { borderColor: theme.colors.outline }]}
                            textColor={theme.colors.primary}
                        >
                            Seleccionar Cliente (Opcional)
                        </Button>
                    )}
                </CardSection>

                {/* Order Summary */}
                <CardSection title="Resumen del Pedido">
                    {items.map((item) => (
                        <List.Item
                            key={item.id}
                            title={item.name}
                            description={`Cant: ${item.quantity}`}
                            right={() => <Text style={[styles.price, { color: theme.colors.onSurface }]}>${(item.finalPrice * item.quantity).toFixed(2)}</Text>}
                            titleStyle={{ color: theme.colors.onSurface }}
                            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                        />
                    ))}
                    <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
                    <View style={styles.totalRow}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Total:</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>${total.toFixed(2)}</Text>
                    </View>
                </CardSection>

                {/* Payment Method */}
                <CardSection title="Método de Pago">
                    <RadioButton.Group onValueChange={newValue => setPaymentMethod(newValue)} value={paymentMethod}>
                        <View style={styles.radioRow}>
                            <RadioButton value="cash" color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.onSurface }}>Efectivo</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="transfer" color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.onSurface }}>Transferencia / Pago Móvil</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="credit" color={theme.colors.error} />
                            <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>Crédito (Fiado)</Text>
                        </View>
                    </RadioButton.Group>

                    {paymentMethod !== 'credit' && (
                        <View style={{ marginTop: 12, padding: 12, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }}>
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Recibido Por (Caja):</Text>
                            {selectedCashier ? (
                                <List.Item
                                    title={selectedCashier.name}
                                    left={() => <Avatar.Icon size={32} icon="account-cash" style={{ backgroundColor: theme.colors.primary }} />}
                                    right={() => <Button mode="text" onPress={() => setCashierModalVisible(true)}>Cambiar</Button>}
                                    titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                                    style={{ padding: 0 }}
                                />
                            ) : (
                                <Button mode="outlined" onPress={() => setCashierModalVisible(true)}>Seleccionar Caja</Button>
                            )}
                        </View>
                    )}

                    {paymentMethod === 'transfer' && (
                        <View style={[styles.proofSection, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant }]}>
                            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 5 }}>Referencia / Comprobante (Opcional)</Text>
                            <Button mode="outlined" icon="camera">Agregar Foto</Button>
                        </View>
                    )}
                </CardSection>

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
                <Button
                    mode="contained"
                    onPress={handleConfirm}
                    loading={loading}
                    disabled={loading || items.length === 0}
                    style={[styles.confirmBtn, { backgroundColor: theme.colors.primary }]}
                    contentStyle={{ height: 50 }}
                    icon="check-circle"
                >
                    Registrar Venta (${total.toFixed(2)})
                </Button>
            </View>

            {/* Cashier Selection Modal */}
            <Portal>
                <Modal
                    visible={cashierModalVisible}
                    onDismiss={() => setCashierModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Seleccionar Responsable</Text>
                        <Button onPress={() => setCashierModalVisible(false)}>Cerrar</Button>
                    </View>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {cashiers.map(cashier => (
                            <List.Item
                                key={cashier.id}
                                title={cashier.displayName}
                                description={cashier.role === 'admin' ? 'Administrador' : 'Vendedor'}
                                onPress={() => {
                                    setSelectedCashier({ id: cashier.id, name: cashier.displayName });
                                    setCashierModalVisible(false);
                                }}
                                left={() => <List.Icon icon="account" color={theme.colors.secondary} />}
                                titleStyle={{ color: theme.colors.onSurface }}
                                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                            />
                        ))}
                    </ScrollView>
                </Modal>
            </Portal>

            {/* Client Selection Modal */}
            <Portal>
                <Modal
                    visible={clientModalVisible}
                    onDismiss={() => setClientModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Seleccionar Cliente</Text>
                        <Button onPress={() => setClientModalVisible(false)}>Cerrar</Button>
                    </View>
                    <Searchbar
                        placeholder="Buscar..."
                        onChangeText={onSearchClient}
                        value={clientSearch}
                        style={[styles.modalSearch, { backgroundColor: theme.colors.surfaceVariant }]}
                        elevation={0}
                    />
                    <ScrollView style={{ maxHeight: 300 }}>
                        {filteredClients.map(client => (
                            <List.Item
                                key={client.id}
                                title={client.name}
                                description={client.phone}
                                onPress={() => handleSelectClient(client)}
                                left={() => <List.Icon icon="account" color={theme.colors.primary} />}
                                titleStyle={{ color: theme.colors.onSurface }}
                                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                            />
                        ))}
                        {filteredClients.length === 0 && (
                            <Text style={{ padding: 20, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>No se encontraron clientes.</Text>
                        )}
                    </ScrollView>
                    <Button
                        mode="text"
                        icon="plus"
                        onPress={() => {
                            setClientModalVisible(false);
                            navigation.navigate('AddClient' as any);
                        }}
                    >
                        Crear Nuevo Cliente
                    </Button>
                </Modal>
            </Portal>

        </SafeAreaView>
    );
}

const CardSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const theme = useTheme();
    return (
        <View style={[styles.cardSection, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>{title}</Text>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scroll: {
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardSection: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: 'bold',
        color: '#444',
    },
    price: {
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    proofSection: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24, // Extra padding for safe area logic
        backgroundColor: 'white',
        borderTopWidth: 1,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    confirmBtn: {
        borderRadius: 8,
    },
    selectClientBtn: {
        borderColor: '#ddd',
    },
    // Modal
    modalContent: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        padding: 10,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    modalSearch: {
        marginBottom: 10,
        elevation: 0,
        backgroundColor: '#f0f0f0',
    }
});
