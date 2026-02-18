import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, Card, Button, Searchbar, Badge, Snackbar, IconButton, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductService } from '../../services/product.service';
import { Product } from '../../types/inventory';
import { useCart } from '../../context/CartContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { Chip, Portal, Modal, List, Divider } from 'react-native-paper';
import { ClientService } from '../../services/client.service';
import { Client } from '../../types/client';
import { useNotifications } from '../../context/NotificationContext';
import { SalesService } from '../../services/sales.service';
import { RadioButton } from 'react-native-paper';
import ClientFormModal from '../../components/modals/ClientFormModal';
import { UserService, UserMetadata } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'POS'>;

export default function SalesScreen({ navigation }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const { addToCart, removeFromCart, updateQuantity, items, total, selectedClient, setSelectedClient, clearCart } = useCart();
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const { user: currentUser } = useAuth();

    // Client search state
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [clientModalVisible, setClientModalVisible] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    // Checkout Modal state
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [addClientModalVisible, setAddClientModalVisible] = useState(false);

    // Cashier selection
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<{ id: string, name: string } | null>(null);
    const [cashierModalVisible, setCashierModalVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = ProductService.subscribeToProducts((list) => {
            setProducts(list);
            setFilteredProducts(list);
        });
        const unsubscribeClients = ClientService.subscribeToClients((list) => {
            setClients(list);
            setFilteredClients(list);
        });

        loadCashiers();

        return () => {
            unsubscribe();
            unsubscribeClients();
        };
    }, []);

    const loadCashiers = async () => {
        try {
            const users = await UserService.getUsers();
            setCashiers(users);
            if (currentUser && !selectedCashier) {
                setSelectedCashier({ id: currentUser.uid, name: currentUser.displayName || 'Vendedor' });
            }
        } catch (error) {
            console.error("Error loading cashiers:", error);
        }
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(query.toLowerCase())
            ));
        }
    };

    const handleAddToCart = (item: Product) => {
        addToCart(item);
        setSnackbarVisible(true);
    };

    const handleRemoveOne = (productId: string) => {
        const item = items.find(i => i.id === productId);
        if (item) {
            updateQuantity(productId, item.quantity - 1);
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

    const handleConfirmSale = async () => {
        if (paymentMethod === 'credit' && !selectedClient) {
            showAlert({ title: 'Atención', message: 'Se requiere un cliente para ventas a crédito/fiado.' });
            return;
        }

        setIsSaving(true);
        try {
            await SalesService.createSale({
                items,
                total,
                paymentMethod,
                clientId: selectedClient?.id || null,
                clientName: selectedClient?.name || null,
                evidenceUrl: paymentProof || null,
                cashboxId: selectedCashier?.id,
                cashboxName: selectedCashier?.name,
            });

            showToast('¡Venta registrada con éxito!');
            clearCart();
            setPaymentProof(null);
            setCheckoutModalVisible(false);
        } catch (error: any) {
            showAlert({ title: 'Error', message: error.message || 'No se pudo registrar la venta' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // Don't force cropping
            quality: 1, // Better quality for tickets/proofs
        });

        if (!result.canceled) {
            setPaymentProof(result.assets[0].uri);
        }
    };

    const getQuantityInCart = (productId: string) => {
        const item = items.find(i => i.id === productId);
        return item ? item.quantity : 0;
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const qty = getQuantityInCart(item.id);
        const isLowStock = item.stock < 10;
        const isOutOfStock = item.stock === 0;

        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Card.Content style={styles.cardContent}>
                    <Text variant="titleMedium" numberOfLines={2} style={[styles.productName, { color: theme.colors.onSurface }]}>
                        {item.name}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text variant="headlineSmall" style={[styles.price, { color: theme.colors.primary }]}>
                            ${item.price.toFixed(2)}
                        </Text>
                        <View style={styles.stockContainer}>
                            <Text variant="labelSmall" style={{
                                color: isOutOfStock ? theme.colors.error : isLowStock ? '#FF9800' : theme.colors.onSurfaceVariant,
                                fontWeight: 'bold'
                            }}>
                                {isOutOfStock ? 'AGOTADO' : `${item.stock}`}
                            </Text>
                            {!isOutOfStock && <Text variant="labelSmall" style={{ fontSize: 8, color: theme.colors.onSurfaceVariant }}>UND</Text>}
                        </View>
                    </View>
                </Card.Content>

                <Card.Actions style={styles.cardActions}>
                    {qty > 0 ? (
                        <View style={[styles.qtyControl, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <IconButton
                                icon="minus"
                                mode="contained"
                                size={24}
                                onPress={() => handleRemoveOne(item.id)}
                                containerColor={theme.colors.secondaryContainer}
                                iconColor={theme.colors.onSecondaryContainer}
                                style={styles.actionBtn}
                            />
                            <View style={styles.qtyDisplay}>
                                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{qty}</Text>
                            </View>
                            <IconButton
                                icon="plus"
                                mode="contained"
                                size={24}
                                onPress={() => handleAddToCart(item)}
                                disabled={item.stock <= qty}
                                containerColor={theme.colors.primary}
                                iconColor={theme.colors.onPrimary}
                                style={styles.actionBtn}
                            />
                        </View>
                    ) : (
                        <Button
                            mode="contained-tonal"
                            icon="cart-plus"
                            onPress={() => handleAddToCart(item)}
                            disabled={isOutOfStock}
                            style={styles.addBtn}
                            labelStyle={{ fontSize: 13 }}
                        >
                            Añadir
                        </Button>
                    )}
                </Card.Actions>
            </Card>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.clientSelectorContainer}>
                    {selectedClient ? (
                        <TouchableOpacity
                            style={[styles.selectedClientCard, { backgroundColor: theme.colors.primaryContainer }]}
                            onPress={() => setClientModalVisible(true)}
                        >
                            <View style={styles.clientInfoMain}>
                                <IconButton icon="account-circle" iconColor={theme.colors.onPrimaryContainer} size={24} style={{ margin: 0 }} />
                                <View style={{ marginLeft: 8, flex: 1 }}>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>CLIENTE SELECCIONADO</Text>
                                    <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                                        {selectedClient.name}
                                    </Text>
                                </View>
                            </View>
                            <IconButton
                                icon="close-circle"
                                iconColor={theme.colors.onPrimaryContainer}
                                size={20}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setSelectedClient(null);
                                }}
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.clientSearchBtn, { borderColor: theme.colors.outlineVariant }]}
                            onPress={() => setClientModalVisible(true)}
                        >
                            <View style={styles.clientSearchInner}>
                                <IconButton icon="account-search-outline" size={24} iconColor={theme.colors.primary} />
                                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Seleccionar Cliente...</Text>
                            </View>
                            <IconButton icon="chevron-down" size={20} />
                        </TouchableOpacity>
                    )}
                </View>

                <Searchbar
                    placeholder="Buscar productos..."
                    onChangeText={onChangeSearch}
                    value={searchQuery}
                    style={[styles.search, { backgroundColor: theme.colors.surfaceVariant }]}
                    elevation={0}
                    mode="bar"
                />
            </View>

            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            {items.length > 0 && (
                <View style={styles.cartBarContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setCheckoutModalVisible(true)}
                        style={[styles.cartBar, { backgroundColor: theme.colors.primary }]}
                    >
                        <View style={styles.cartLeft}>
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>
                                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                                </Text>
                            </View>
                            <Text style={styles.cartTotalLabel}>Total: ${total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.cartRight}>
                            <Text style={styles.cartActionText}>Generar Venta</Text>
                            <IconButton icon="chevron-right" iconColor="white" size={20} style={{ margin: 0 }} />
                        </View>
                    </TouchableOpacity>
                </View>
            )}

            {/* Payment / Checkout Modal */}
            <Portal>
                <Modal
                    visible={checkoutModalVisible}
                    onDismiss={() => setCheckoutModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge">Finalizar Venta</Text>
                        <IconButton icon="close" onPress={() => setCheckoutModalVisible(false)} />
                    </View>

                    <View style={styles.checkoutSummary}>
                        <Text variant="bodyLarge">Total a Cobrar:</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            ${total.toFixed(2)}
                        </Text>
                    </View>

                    <Divider style={{ marginVertical: 15 }} />


                    {paymentMethod !== 'credit' && (
                        <View style={{ marginBottom: 15 }}>
                            <Text variant="titleSmall" style={{ marginBottom: 8, color: theme.colors.onSurface }}>Recibido Por (Caja):</Text>
                            {selectedCashier ? (
                                <List.Item
                                    title={selectedCashier.name}
                                    left={props => <Avatar.Icon {...props} icon="account-cash" size={40} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />}
                                    right={props => <Button onPress={() => setCashierModalVisible(true)}>Cambiar</Button>}
                                    style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 }}
                                    titleStyle={{ color: theme.colors.onSurface }}
                                />
                            ) : (
                                <Button mode="outlined" onPress={() => setCashierModalVisible(true)}>Seleccionar Caja</Button>
                            )}
                        </View>
                    )}

                    <Text variant="titleMedium" style={{ marginBottom: 10 }}>Método de Pago</Text>
                    <RadioButton.Group onValueChange={val => setPaymentMethod(val as any)} value={paymentMethod}>
                        <View style={styles.radioRow}>
                            <RadioButton value="cash" color={theme.colors.primary} />
                            <Text>Efectivo</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="transfer" color={theme.colors.primary} />
                            <Text>Transferencia / Pago Móvil</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="credit" color={theme.colors.error} />
                            <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>Crédito (Fiado)</Text>
                        </View>
                    </RadioButton.Group>

                    {paymentMethod === 'transfer' && (
                        <View style={styles.proofSection}>
                            <Text variant="labelMedium" style={{ marginBottom: 8 }}>Comprobante de Pago</Text>
                            {paymentProof ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: paymentProof }} style={styles.imagePreview} />
                                    <IconButton
                                        icon="close-circle"
                                        size={24}
                                        iconColor={theme.colors.error}
                                        style={styles.removeImageBtn}
                                        onPress={() => setPaymentProof(null)}
                                    />
                                </View>
                            ) : (
                                <Button
                                    mode="outlined"
                                    icon="camera"
                                    onPress={handlePickImage}
                                >
                                    Agregar Foto del Comprobante
                                </Button>
                            )}
                        </View>
                    )}

                    {paymentMethod === 'credit' && !selectedClient && (
                        <View style={styles.alertBox}>
                            <IconButton icon="alert" iconColor={theme.colors.error} size={20} />
                            <Text style={{ color: theme.colors.error, flex: 1, fontSize: 12 }}>
                                Debes seleccionar un cliente para vender a crédito.
                            </Text>
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleConfirmSale}
                        loading={isSaving}
                        disabled={isSaving || (paymentMethod === 'credit' && !selectedClient)}
                        style={{ marginTop: 20 }}
                        contentStyle={{ height: 50 }}
                        icon="check-circle"
                    >
                        Confirmar Venta
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => setCheckoutModalVisible(false)}
                        style={{ marginTop: 8 }}
                    >
                        Volver
                    </Button>
                </Modal>
            </Portal>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={1000}
                style={{ marginBottom: 90 }}
            >
                Producto agregado al carrito
            </Snackbar>

            {/* Client Selection Modal */}
            <Portal>
                <Modal
                    visible={clientModalVisible}
                    onDismiss={() => setClientModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge">Seleccionar Cliente</Text>
                        <IconButton icon="close" onPress={() => setClientModalVisible(false)} />
                    </View>
                    <Searchbar
                        placeholder="Buscar..."
                        onChangeText={onSearchClient}
                        value={clientSearch}
                        style={{ marginBottom: 10, backgroundColor: theme.colors.surfaceVariant }}
                        elevation={0}
                    />
                    <FlatList
                        data={filteredClients}
                        style={{ maxHeight: 300 }}
                        keyExtractor={c => c.id}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.name}
                                description={item.phone}
                                onPress={() => handleSelectClient(item)}
                                left={() => <List.Icon icon="account" />}
                            />
                        )}
                        ItemSeparatorComponent={() => <Divider />}
                        ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center' }}>No se encontraron clientes.</Text>}
                    />
                    <Button
                        mode="text"
                        icon="plus"
                        onPress={() => {
                            setClientModalVisible(false);
                            setAddClientModalVisible(true);
                        }}
                    >
                        Crear Nuevo Cliente
                    </Button>

                    <Button
                        mode="outlined"
                        onPress={() => setClientModalVisible(false)}
                        style={{ marginTop: 8 }}
                    >
                        Volver
                    </Button>
                </Modal>
            </Portal>

            <ClientFormModal
                visible={addClientModalVisible}
                onDismiss={() => setAddClientModalVisible(false)}
                onSuccess={(clientId) => {
                    // Logic to automatically select the new client if needed
                    const newClient = clients.find(c => c.id === clientId);
                    if (newClient) setSelectedClient(newClient);
                }}
            />

            {/* Cashier Selection Modal */}
            <Portal>
                <Modal
                    visible={cashierModalVisible}
                    onDismiss={() => setCashierModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge">Seleccionar Recaudador</Text>
                        <IconButton icon="close" onPress={() => setCashierModalVisible(false)} />
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
                                left={() => <List.Icon icon="account" />}
                            />
                        ))}
                    </ScrollView>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    clientSelectorContainer: {
        marginBottom: 12,
    },
    selectedClientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        elevation: 1,
    },
    clientInfoMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    clientSearchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    clientSearchInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    search: {
        borderRadius: 12,
    },
    list: {
        padding: 8,
        paddingBottom: 200,
    },
    card: {
        flex: 1,
        margin: 6,
        marginBottom: 12,
        elevation: 2,
        position: 'relative',
        backgroundColor: 'white',
    },
    cardContent: {
        paddingBottom: 0,
    },
    productName: {
        height: 40,
    },
    price: {
        fontWeight: 'bold',
        marginVertical: 4,
        color: '#2e7d32'
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 10,
    },
    cartBarContainer: {
        position: 'absolute',
        bottom: 85, // Positioned above the tab bar
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    cartBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: 60,
        borderRadius: 30,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    cartLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 10,
    },
    cartBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cartTotalLabel: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    cartRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cartActionText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cartText: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    totalText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    checkoutBtn: {
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    stockContainer: {
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardActions: {
        padding: 8,
        justifyContent: 'center',
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        width: '100%',
        padding: 2,
    },
    qtyDisplay: {
        flex: 1,
        alignItems: 'center',
    },
    actionBtn: {
        margin: 0,
        borderRadius: 8,
    },
    addBtn: {
        width: '100%',
        borderRadius: 8,
    },
    modalContent: {
        margin: 20,
        padding: 20,
        borderRadius: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkoutSummary: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    proofSection: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
    }
});
