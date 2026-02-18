import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
    Text,
    TextInput,
    Button,
    Card,
    DataTable,
    IconButton,
    ActivityIndicator,
    useTheme,
    Divider,
    Avatar,
    Portal,
    Modal,
    RadioButton,
    List
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ClientService } from '../../services/client.service';
import { SalesService } from '../../services/sales.service';
import { Client } from '../../types/client';
import { Sale } from '../../types/sales';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { UserService, UserMetadata } from '../../services/user.service';

type Props = NativeStackScreenProps<AppStackParamList, 'ClientProfile'>;

export default function ClientProfileScreen({ route, navigation }: Props) {
    const { clientId } = route.params;
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const { setSelectedClient } = useCart();

    const [client, setClient] = useState<Client | null>(null);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Payment states
    const [payModalVisible, setPayModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mobile_pay'>('cash');
    const [paymentProof, setPaymentProof] = useState<string | null>(null);
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    // Cashier selection for payments
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<{ id: string, name: string } | null>(null);
    const [cashierModalVisible, setCashierModalVisible] = useState(false);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        loadData();
        loadCashiers();
    }, [clientId]);

    const loadCashiers = async () => {
        try {
            const users = await UserService.getUsers();
            setCashiers(users);
            if (currentUser && !selectedCashier) {
                setSelectedCashier({ id: currentUser.uid, name: currentUser.displayName || 'Vendedor' });
            }
        } catch (error) {
            console.error("Error loading cashiers", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const clientData = await ClientService.getClientById(clientId);
            if (clientData) {
                setClient(clientData);
                setName(clientData.name);
                setPhone(clientData.phone);

                const clientSales = await SalesService.getSalesByClient(clientId);
                setSales(clientSales);
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo cargar la información del cliente' });
        } finally {
            setLoading(false);
        }
    };

    const handleNewSale = () => {
        if (client) {
            setSelectedClient(client);
            navigation.navigate('MainTabs' as any, { screen: 'POS' });
        }
    };

    const handleSave = async () => {
        if (!name || !phone) {
            showAlert({ title: 'Campo requerido', message: 'Nombre y teléfono son obligatorios' });
            return;
        }

        try {
            await ClientService.updateClient(clientId, {
                name,
                phone,
            });
            showToast('Perfil actualizado correctamente');
            setIsEditing(false);
            setClient(prev => prev ? { ...prev, name, phone } : null);
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo actualizar el perfil' });
        }
    };

    const handlePayAll = () => {
        setPayModalVisible(true);
    };

    const handlePickProof = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setPaymentProof(result.assets[0].uri);
        }
    };

    const handleConfirmPayment = async () => {
        setIsSavingPayment(true);
        try {
            const bulkNote = paymentNotes ? `[PAGO MASIVO] ${paymentNotes}` : '[PAGO MASIVO] Saldo total de crédito.';

            await SalesService.payAllDebts(clientId, {
                paymentMethod,
                evidenceUrl: paymentProof || null,
                notes: bulkNote,
                cashboxId: selectedCashier?.id,
                cashboxName: selectedCashier?.name,
            });
            showToast('Todas las deudas han sido pagadas');
            setPayModalVisible(false);
            setPaymentProof(null);
            setPaymentNotes('');
            loadData();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo procesar el pago' });
        } finally {
            setIsSavingPayment(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!client) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text>Cliente no encontrado</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, flex: 1 }}>Perfil</Text>

                {!isEditing && (
                    <Button
                        icon="cart-plus"
                        mode="contained"
                        onPress={handleNewSale}
                        style={{ marginRight: 8 }}
                    >
                        Venta
                    </Button>
                )}

                <IconButton
                    icon={isEditing ? "close" : "pencil"}
                    onPress={() => setIsEditing(!isEditing)}
                    mode="contained-tonal"
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Info */}
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
                    <Card.Content>
                        <View style={styles.profileHeader}>
                            <Avatar.Icon size={64} icon="account" />
                            <View style={styles.profileHeaderText}>
                                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>{client.name}</Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Cliente desde {new Date(client.createdAt).toLocaleDateString()}</Text>
                            </View>
                            {sales.filter(s => s.status === 'pending').length > 0 && (
                                <View style={styles.debtBadge}>
                                    <Text variant="labelSmall" style={{ color: '#fff' }}>DEUDA TOTAL</Text>
                                    <Text variant="titleMedium" style={{ color: '#fff', fontWeight: 'bold' }}>
                                        ${sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.total, 0).toFixed(2)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.form}>
                            <TextInput
                                label="Nombre"
                                value={name}
                                onChangeText={setName}
                                disabled={!isEditing}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Teléfono"
                                value={phone}
                                onChangeText={setPhone}
                                disabled={!isEditing}
                                mode="outlined"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />
                        </View>

                        {isEditing ? (
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveBtn}
                            >
                                Guardar Cambios
                            </Button>
                        ) : (
                            sales.filter(s => s.status === 'pending').length > 0 && (
                                <Button
                                    mode="contained"
                                    icon="cash-check"
                                    onPress={handlePayAll}
                                    style={[styles.saveBtn, { backgroundColor: '#4CAF50' }]}
                                >
                                    Pagar Todas las Deudas
                                </Button>
                            )
                        )}
                    </Card.Content>
                </Card>

                {/* Purchase History */}
                <Text variant="titleLarge" style={styles.sectionTitle}>Historial de Compras</Text>

                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title>Fecha</DataTable.Title>
                            <DataTable.Title numeric>Total</DataTable.Title>
                            <DataTable.Title>Estado</DataTable.Title>
                        </DataTable.Header>

                        {sales.map((sale) => (
                            <DataTable.Row
                                key={sale.id}
                                onPress={() => navigation.navigate('SaleDetail', { saleId: sale.id! })}
                            >
                                <DataTable.Cell>{new Date(sale.createdAt).toLocaleDateString()}</DataTable.Cell>
                                <DataTable.Cell numeric>${sale.total.toFixed(2)}</DataTable.Cell>
                                <DataTable.Cell>
                                    <Text style={{ color: sale.status === 'paid' ? theme.colors.primary : theme.colors.error, fontWeight: 'bold', fontSize: 12 }}>
                                        {sale.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                                    </Text>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}

                        {sales.length === 0 && (
                            <View style={{ padding: 20 }}>
                                <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>No hay compras registradas.</Text>
                            </View>
                        )}
                    </DataTable>
                </Card>
            </ScrollView>

            {/* Payment Modal */}
            <Portal>
                <Modal
                    visible={payModalVisible}
                    onDismiss={() => !isSavingPayment && setPayModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Saldar Deuda Total</Text>
                        <IconButton
                            icon="close"
                            onPress={() => setPayModalVisible(false)}
                            disabled={isSavingPayment}
                        />
                    </View>

                    <View style={styles.paymentSummary}>
                        <Text variant="bodyMedium">Total a cobrar:</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            ${sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.total, 0).toFixed(2)}
                        </Text>
                    </View>

                    <Divider style={{ marginVertical: 16 }} />

                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>Método de Pago</Text>
                    <RadioButton.Group
                        onValueChange={val => setPaymentMethod(val as any)}
                        value={paymentMethod}
                    >
                        <TouchableOpacity
                            style={styles.radioRow}
                            onPress={() => setPaymentMethod('cash')}
                        >
                            <RadioButton value="cash" color={theme.colors.primary} />
                            <Text>Efectivo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.radioRow}
                            onPress={() => setPaymentMethod('transfer')}
                        >
                            <RadioButton value="transfer" color={theme.colors.primary} />
                            <Text>Transferencia / Pago Móvil</Text>
                        </TouchableOpacity>
                    </RadioButton.Group>

                    <Divider style={{ marginVertical: 12 }} />
                    <Text variant="titleSmall">Recibido por (Caja)</Text>
                    {selectedCashier ? (
                        <List.Item
                            title={selectedCashier.name}
                            left={() => <Avatar.Icon size={32} icon="account-cash" style={{ backgroundColor: theme.colors.secondary }} />}
                            right={() => <IconButton icon="chevron-right" onPress={() => setCashierModalVisible(true)} />}
                            onPress={() => setCashierModalVisible(true)}
                        />
                    ) : (
                        <Button mode="outlined" onPress={() => setCashierModalVisible(true)} style={{ marginTop: 8 }}>
                            Seleccionar Caja
                        </Button>
                    )}

                    <TextInput
                        label="Descripción / Notas (Opcional)"
                        value={paymentNotes}
                        onChangeText={setPaymentNotes}
                        mode="outlined"
                        placeholder="Ej: Pago de todo lo que debía de enero..."
                        style={{ marginTop: 12 }}
                        multiline
                        numberOfLines={2}
                    />

                    {(paymentMethod === 'transfer' || paymentMethod === 'mobile_pay') && (
                        <View style={styles.proofSection}>
                            <Text variant="labelMedium" style={{ marginBottom: 8 }}>Comprobante (Opcional)</Text>
                            {paymentProof ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: paymentProof }} style={styles.imagePreview} />
                                    <IconButton
                                        icon="close-circle"
                                        size={20}
                                        iconColor={theme.colors.error}
                                        style={styles.removeImageBtn}
                                        onPress={() => setPaymentProof(null)}
                                    />
                                </View>
                            ) : (
                                <Button
                                    mode="outlined"
                                    icon="camera"
                                    onPress={handlePickProof}
                                    style={{ borderRadius: 8 }}
                                >
                                    Subir Foto
                                </Button>
                            )}
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleConfirmPayment}
                        loading={isSavingPayment}
                        disabled={isSavingPayment}
                        style={styles.confirmBtn}
                        contentStyle={{ height: 48 }}
                    >
                        Confirmar Pago de Todo
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => setPayModalVisible(false)}
                        disabled={isSavingPayment}
                        style={{ marginTop: 8 }}
                    >
                        Volver
                    </Button>
                </Modal>
            </Portal>

            {/* Cashier Selection Modal */}
            <Portal>
                <Modal
                    visible={cashierModalVisible}
                    onDismiss={() => setCashierModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface, elevation: 5 }]}
                >
                    <View style={styles.modalHeader}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Seleccionar Recaudador</Text>
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
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        marginBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileHeaderText: {
        marginLeft: 16,
    },
    divider: {
        marginVertical: 12,
    },
    form: {
        marginTop: 8,
    },
    input: {
        marginBottom: 12,
    },
    saveBtn: {
        marginTop: 8,
        borderRadius: 8,
    },
    sectionTitle: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    debtBadge: {
        backgroundColor: '#F44336',
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentSummary: {
        alignItems: 'center',
        marginVertical: 8,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    proofSection: {
        marginTop: 16,
    },
    imagePreviewContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    confirmBtn: {
        marginTop: 24,
        borderRadius: 12,
    }
});
