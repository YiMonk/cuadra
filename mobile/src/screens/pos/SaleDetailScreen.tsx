import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import {
    Text,
    Card,
    List,
    Divider,
    useTheme,
    IconButton,
    Chip,
    Avatar,
    Button,
    Portal,
    Modal,
    TextInput,
    RadioButton
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../types/sales';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import * as ImagePicker from 'expo-image-picker';
import { UserService, UserMetadata } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'SaleDetail'>;

export default function SaleDetailScreen({ route, navigation }: Props) {
    const { saleId } = route.params;
    const { user: currentUser } = useAuth();
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);

    // Payment Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mobile_pay'>('cash');
    const [reference, setReference] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [savingPayment, setSavingPayment] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    // Cashier Selection for Payment
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<{ id: string, name: string } | null>(null);
    const [showCashierList, setShowCashierList] = useState(false);

    // Cancellation State
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellingSale, setCancellingSale] = useState(false);

    useEffect(() => {
        fetchSale();
        loadCashiers();
    }, [saleId]);

    const loadCashiers = async () => {
        try {
            const users = await UserService.getUsers();
            setCashiers(users);
            // Default to current user
            if (currentUser && !selectedCashier) {
                // Find current user metadata if possible, or just use auth data
                const found = users.find(u => u.id === currentUser.uid);
                setSelectedCashier({
                    id: currentUser.uid,
                    name: found?.displayName || currentUser.displayName || 'Usuario Actual'
                });
            }
        } catch (error) {
            console.error("Error loading cashiers:", error);
        }
    };

    const fetchSale = async () => {
        setLoading(true);
        try {
            const data = await SalesService.getSaleById(saleId);
            setSale(data);
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo cargar la venta' });
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSavePayment = async () => {
        if (!sale) return;

        setSavingPayment(true);
        try {
            const updates: any = {
                status: 'paid',
                paymentMethod: paymentMethod,
                paymentData: {
                    reference: reference,
                    date: new Date().toISOString()
                },
                notes: notes,
                // Assign Cashier/Cashbox
                cashboxId: selectedCashier?.id || null,
                cashboxName: selectedCashier?.name || null,
            };

            if (image) {
                updates.evidenceUrl = image;
            }

            await SalesService.updateSaleStatus(sale.id!, updates);
            showToast('Pago registrado correctamente');
            setModalVisible(false);
            setNotes('');
            setReference('');
            setImage(null);
            fetchSale();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo registrar el pago' });
        } finally {
            setSavingPayment(false);
        }
    };

    const handleCancelSale = async () => {
        if (!sale || !cancelReason.trim()) return;

        setCancellingSale(true);
        try {
            await SalesService.cancelSale(sale.id!, cancelReason.trim());
            showToast('Venta cancelada exitosamente');
            setCancelModalVisible(false);
            setCancelReason('');
            fetchSale();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo cancelar la venta' });
        } finally {
            setCancellingSale(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!sale) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <Text>Venta no encontrada</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
                <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, flex: 1 }}>Detalle</Text>
                <Chip
                    selectedColor={sale.status === 'paid' ? '#4CAF50' : sale.status === 'cancelled' ? theme.colors.error : '#FF9800'}
                    style={{ backgroundColor: sale.status === 'paid' ? '#E8F5E9' : sale.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0' }}
                    textStyle={{ fontWeight: 'bold' }}
                >
                    {sale.status === 'paid' ? 'PAGADA' : sale.status === 'cancelled' ? 'CANCELADA' : 'PENDIENTE'}
                </Chip>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {sale.status === 'pending' && (
                    <Button
                        mode="contained"
                        icon="currency-usd"
                        onPress={() => setModalVisible(true)}
                        style={styles.paymentBtn}
                        buttonColor={theme.colors.primary}
                    >
                        Registrar Pago
                    </Button>
                )}

                {sale.status !== 'cancelled' && (
                    <Button
                        mode="outlined"
                        icon="close-circle-outline"
                        onPress={() => setCancelModalVisible(true)}
                        style={[styles.paymentBtn, { borderColor: theme.colors.error }]}
                        textColor={theme.colors.error}
                    >
                        Cancelar Venta
                    </Button>
                )}

                <Card style={styles.card} elevation={2}>
                    <Card.Content>
                        <View style={styles.summaryRow}>
                            <View>
                                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Fecha</Text>
                                <Text variant="titleMedium">{new Date(sale.createdAt).toLocaleString()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Total</Text>
                                <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                    ${sale.total.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <View>
                                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Método de Pago</Text>
                                <Text variant="titleMedium" style={{ textTransform: 'capitalize' }}>
                                    {sale.paymentMethod.replace('_', ' ')}
                                </Text>
                            </View>
                            {sale.cashboxName && (
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Caja / Recibió</Text>
                                    <Text variant="titleMedium">{sale.cashboxName}</Text>
                                </View>
                            )}
                        </View>

                        {sale.notes && (
                            <>
                                <Divider style={styles.divider} />
                                <View>
                                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Notas / Descripción</Text>
                                    <View style={[styles.notesContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                                        <Text variant="bodyLarge" style={{ fontStyle: 'italic', color: theme.colors.onSurface }}>
                                            {sale.notes}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}

                        {sale.status === 'cancelled' && sale.cancellationReason && (
                            <>
                                <Divider style={styles.divider} />
                                <View>
                                    <Text variant="labelLarge" style={{ color: theme.colors.error }}>Motivo de Cancelación</Text>
                                    <View style={[styles.notesContainer, { backgroundColor: '#FFEBEE' }]}>
                                        <Text variant="bodyLarge" style={{ color: '#C62828', fontWeight: 'bold' }}>
                                            {sale.cancellationReason}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: '#D32F2F', marginTop: 4 }}>
                                            Cancelada el: {new Date(sale.cancelledAt!).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </Card.Content>
                </Card>

                <Text variant="titleMedium" style={styles.sectionTitle}>Productos</Text>
                <Card style={styles.card} elevation={1}>
                    {sale.items.map((item, index) => (
                        <View key={item.id ? `${item.id}-${index}` : `idx-${index}`}>
                            <List.Item
                                title={item.name}
                                description={`Cantidad: ${item.quantity} x $${item.finalPrice.toFixed(2)}`}
                                right={() => <Text variant="bodyLarge" style={{ alignSelf: 'center', fontWeight: 'bold' }}>${(item.quantity * item.finalPrice).toFixed(2)}</Text>}
                            />
                            {index < sale.items.length - 1 && <Divider />}
                        </View>
                    ))}
                </Card>

                {(sale.paymentMethod === 'transfer' || sale.paymentMethod === 'mobile_pay' || sale.evidenceUrl) && (
                    <>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Comprobante de Pago</Text>
                        <Card style={styles.card} elevation={1}>
                            <Card.Content>
                                {sale.paymentData?.reference && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>Referencia</Text>
                                        <Text variant="titleMedium">{sale.paymentData.reference}</Text>
                                    </View>
                                )}

                                {sale.evidenceUrl ? (
                                    <View style={styles.imageContainer}>
                                        <IconButton
                                            icon="magnify-plus"
                                            mode="contained"
                                            style={styles.expandIcon}
                                            onPress={() => setFullScreenImage(sale!.evidenceUrl || null)}
                                        />
                                        <Image
                                            source={{ uri: sale.evidenceUrl }}
                                            style={styles.evidenceImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.noImage}>
                                        <Avatar.Icon size={48} icon="image-off" style={{ backgroundColor: theme.colors.surfaceVariant }} />
                                        <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                                            No se adjuntó imagen
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    </>
                )}
            </ScrollView>

            <Portal>
                <Modal
                    visible={!!fullScreenImage}
                    onDismiss={() => setFullScreenImage(null)}
                    contentContainerStyle={styles.fullScreenModal}
                >
                    <IconButton
                        icon="close"
                        mode="contained"
                        onPress={() => setFullScreenImage(null)}
                        style={styles.closeFullBtn}
                        iconColor="white"
                    />
                    {fullScreenImage && (
                        <Image
                            source={{ uri: fullScreenImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </Modal>
            </Portal>

            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={{ margin: 20 }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flexShrink: 1 }}
                    >
                        <View style={{ backgroundColor: theme.colors.surface, borderRadius: 12, padding: 20, maxHeight: '90%' }}>
                            <Text variant="headlineSmall" style={{ marginBottom: 4, color: theme.colors.onSurface }}>Registrar Pago</Text>
                            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.primary }}>Total a pagar: ${sale.total.toFixed(2)}</Text>

                            <ScrollView
                                contentContainerStyle={{ paddingBottom: 20 }}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text variant="titleSmall" style={{ marginTop: 10, color: theme.colors.onSurface }}>Recibido Por (Caja):</Text>

                                {!showCashierList ? (
                                    <List.Item
                                        title={selectedCashier?.name || 'Seleccionar Caja'}
                                        left={props => <Avatar.Icon {...props} icon="account-cash" size={40} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />}
                                        right={props => <Button onPress={() => setShowCashierList(true)}>Cambiar</Button>}
                                        style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, marginBottom: 10, marginTop: 5 }}
                                        titleStyle={{ color: theme.colors.onSurface }}
                                    />
                                ) : (
                                    <View style={{ borderColor: theme.colors.outline, borderWidth: 1, borderRadius: 8, marginBottom: 10, marginTop: 5 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, alignItems: 'center', backgroundColor: theme.colors.surfaceVariant }}>
                                            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>Seleccionar Caja:</Text>
                                            <IconButton icon="close" size={20} onPress={() => setShowCashierList(false)} iconColor={theme.colors.onSurface} />
                                        </View>
                                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                                            {cashiers.map(c => (
                                                <List.Item
                                                    key={c.id}
                                                    title={c.displayName}
                                                    onPress={() => {
                                                        setSelectedCashier({ id: c.id, name: c.displayName });
                                                        setShowCashierList(false);
                                                    }}
                                                    left={props => <List.Icon {...props} icon="account" color={theme.colors.secondary} />}
                                                    style={selectedCashier?.id === c.id ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
                                                    titleStyle={{ color: theme.colors.onSurface }}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                <Text variant="titleSmall" style={{ marginTop: 10, color: theme.colors.onSurface }}>Método de Pago</Text>
                                <RadioButton.Group onValueChange={value => setPaymentMethod(value as any)} value={paymentMethod}>
                                    <View style={styles.radioRow}>
                                        <RadioButton value="cash" color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.onSurface }}>Efectivo</Text>
                                    </View>
                                    <View style={styles.radioRow}>
                                        <RadioButton value="transfer" color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.onSurface }}>Transferencia</Text>
                                    </View>
                                    <View style={styles.radioRow}>
                                        <RadioButton value="mobile_pay" color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.onSurface }}>Pago Móvil</Text>
                                    </View>
                                </RadioButton.Group>

                                {paymentMethod !== 'cash' && (
                                    <View style={{ marginTop: 10 }}>
                                        <TextInput
                                            label="Número de Referencia"
                                            value={reference}
                                            onChangeText={setReference}
                                            mode="outlined"
                                            style={styles.inputModal}
                                        />

                                        <Button
                                            mode="outlined"
                                            icon="camera"
                                            onPress={handlePickImage}
                                            style={{ marginTop: 10 }}
                                        >
                                            {image ? 'Cambiar Foto' : 'Subir Comprobante'}
                                        </Button>

                                        {image && (
                                            <View style={styles.previewContainer}>
                                                <Image source={{ uri: image }} style={styles.previewImage} />
                                                <IconButton
                                                    icon="close-circle"
                                                    size={20}
                                                    style={styles.removeImage}
                                                    onPress={() => setImage(null)}
                                                />
                                            </View>
                                        )}
                                    </View>
                                )}

                                <TextInput
                                    label="Notas / Descripción"
                                    value={notes}
                                    onChangeText={setNotes}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={3}
                                    style={{ marginTop: 15 }}
                                    placeholder="Agregar información adicional..."
                                />
                            </ScrollView>

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                                <Button onPress={() => setModalVisible(false)} style={{ marginRight: 8 }}>Cancelar</Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSavePayment}
                                    loading={savingPayment}
                                    disabled={savingPayment}
                                >
                                    Confirmar Pago
                                </Button>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </Portal>

            {/* Cancellation Modal */}
            <Portal>
                <Modal
                    visible={cancelModalVisible}
                    onDismiss={() => setCancelModalVisible(false)}
                    contentContainerStyle={styles.modalContent}
                >
                    <Card style={{ backgroundColor: theme.colors.surface }}>
                        <Card.Title
                            title="Cancelar Venta"
                            subtitle="Esta acción restablecerá el stock de los productos."
                            left={(props) => <Avatar.Icon {...props} icon="alert" style={{ backgroundColor: theme.colors.error }} />}
                            titleStyle={{ color: theme.colors.error }}
                        />
                        <Card.Content>
                            <Text variant="bodyMedium" style={{ marginBottom: 15 }}>
                                Por favor, indique el motivo de la cancelación. Esta información es obligatoria.
                            </Text>
                            <TextInput
                                label="Motivo de Cancelación"
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                placeholder="Ej: Error en el pedido, Cliente desistió, etc..."
                                error={!cancelReason.trim() && cancelReason !== ''}
                            />
                        </Card.Content>
                        <Card.Actions>
                            <Button onPress={() => setCancelModalVisible(false)}>Cerrar</Button>
                            <Button
                                mode="contained"
                                onPress={handleCancelSale}
                                loading={cancellingSale}
                                disabled={cancellingSale || !cancelReason.trim()}
                                buttonColor={theme.colors.error}
                            >
                                Confirmar Cancelación
                            </Button>
                        </Card.Actions>
                    </Card>
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
        paddingRight: 16,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    divider: {
        marginVertical: 12,
    },
    sectionTitle: {
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: 'bold',
    },
    paymentBtn: {
        marginBottom: 16,
        padding: 4,
    },
    modalContent: {
        padding: 20,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputModal: {
        marginBottom: 10,
    },
    previewContainer: {
        marginTop: 10,
        width: '100%',
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    removeImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    imageContainer: {
        width: '100%',
        height: 350,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    expandIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    evidenceImage: {
        width: '100%',
        height: '100%',
    },
    noImage: {
        alignItems: 'center',
        padding: 24,
    },
    fullScreenModal: {
        backgroundColor: 'black',
        margin: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '90%',
    },
    closeFullBtn: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    notesContainer: {
        marginTop: 4,
        padding: 12,
        borderRadius: 8,
    }
});
