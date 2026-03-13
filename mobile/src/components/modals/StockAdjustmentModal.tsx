import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, RadioButton, List, Divider, Searchbar, useTheme, Portal, Modal, IconButton } from 'react-native-paper';
import { ProductService } from '../../services/product.service';
import { Product } from '../../types/inventory';
import { useNotifications } from '../../context/NotificationContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Props {
    visible: boolean;
    productId: string | null;
    onDismiss: () => void;
    onSuccess?: () => void;
}

export default function StockAdjustmentModal({ visible, productId, onDismiss, onSuccess }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [reason, setReason] = useState<'restock' | 'waste' | 'correction'>('restock');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (visible) {
            loadProducts();
            if (productId) {
                // If a productId is passed, we wait for products to load and select it
            } else {
                setSelectedProduct(null);
                setSearchQuery('');
                setQuantity('');
                setNotes('');
                setReason('restock');
            }
        }
    }, [visible, productId]);

    useEffect(() => {
        if (products.length > 0 && productId && !selectedProduct) {
            const preSelected = products.find(p => p.id === productId);
            if (preSelected) setSelectedProduct(preSelected);
        }
    }, [products, productId]);

    const loadProducts = async () => {
        setFetching(true);
        try {
            const list = await ProductService.getProducts();
            setProducts(list);
            setFilteredProducts(list);
        } catch (error) {
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())));
        }
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setFilteredProducts([]);
    };

    const handleSave = async () => {
        if (!selectedProduct) {
            showAlert({ title: 'Atención', message: 'Por favor selecciona un producto' });
            return;
        }
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            showAlert({ title: 'Cantidad', message: 'Por favor ingresa una cantidad válida válida' });
            return;
        }

        setLoading(true);
        try {
            const adjustment = reason === 'waste' ? -Number(quantity) : Number(quantity);
            await ProductService.adjustStock(selectedProduct.id, adjustment, reason, notes);

            showToast('Stock actualizado correctamente');
            if (onSuccess) onSuccess();
            onDismiss();
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo actualizar el stock' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.header}>
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Ajustar Stock</Text>
                        <IconButton icon="close" onPress={onDismiss} disabled={loading} />
                    </View>

                    <ScrollView
                        style={styles.form}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {!selectedProduct ? (
                            <View>
                                <Searchbar
                                    placeholder="Buscar producto..."
                                    onChangeText={onChangeSearch}
                                    value={searchQuery}
                                    style={styles.search}
                                    elevation={0}
                                />
                                <View style={{ maxHeight: 300 }}>
                                    <ScrollView nestedScrollEnabled>
                                        {filteredProducts.map(p => (
                                            <List.Item
                                                key={p.id}
                                                title={p.name}
                                                description={`Stock: ${p.stock}`}
                                                onPress={() => handleSelectProduct(p)}
                                                left={props => <List.Icon {...props} icon="package-variant" />}
                                                style={styles.listItem}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Card style={styles.selectedProductCard}>
                                    <Card.Content style={styles.cardInfo}>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{selectedProduct.name}</Text>
                                            <Text variant="bodySmall">Stock Actual: {selectedProduct.stock}</Text>
                                        </View>
                                        {!productId && (
                                            <Button mode="text" compact onPress={() => setSelectedProduct(null)}>
                                                Cambiar
                                            </Button>
                                        )}
                                    </Card.Content>
                                </Card>

                                <Divider style={styles.divider} />

                                <Text variant="titleSmall" style={styles.sectionLabel}>Tipo de Movimiento</Text>
                                <RadioButton.Group onValueChange={value => setReason(value as any)} value={reason}>
                                    <View style={styles.radioRow}>
                                        <RadioButton value="restock" color={theme.colors.primary} />
                                        <Text variant="bodyMedium">Entrada (Reabastecer)</Text>
                                    </View>
                                    <View style={styles.radioRow}>
                                        <RadioButton value="waste" color={theme.colors.error} />
                                        <Text variant="bodyMedium">Salida (Merma / Desperdicio)</Text>
                                    </View>
                                </RadioButton.Group>

                                <TextInput
                                    label="Cantidad"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.input}
                                    left={<TextInput.Icon icon="numeric" />}
                                />

                                <TextInput
                                    label="Notas / Razón"
                                    value={notes}
                                    onChangeText={setNotes}
                                    mode="outlined"
                                    multiline
                                    numberOfLines={2}
                                    style={styles.input}
                                    left={<TextInput.Icon icon="note-text-outline" />}
                                />

                                <Button
                                    mode="contained"
                                    onPress={handleSave}
                                    loading={loading}
                                    disabled={loading}
                                    style={[
                                        styles.saveBtn,
                                        { backgroundColor: reason === 'waste' ? theme.colors.error : theme.colors.primary }
                                    ]}
                                    contentStyle={{ height: 48 }}
                                >
                                    Confirmar {reason === 'waste' ? 'Salida' : 'Entrada'}
                                </Button>
                            </View>
                        )}

                        <Button
                            mode="text"
                            onPress={onDismiss}
                            disabled={loading}
                            style={{ marginVertical: 8 }}
                        >
                            Cancelar
                        </Button>
                        <View style={{ height: 20 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

import { Card } from 'react-native-paper';

const styles = StyleSheet.create({
    modalContent: {
        margin: 20,
        padding: 24,
        borderRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    form: {
        marginTop: 8,
    },
    search: {
        marginBottom: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    listItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    selectedProductCard: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        marginBottom: 10,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 16,
    },
    sectionLabel: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    input: {
        marginTop: 12,
        backgroundColor: 'transparent',
    },
    saveBtn: {
        marginTop: 24,
        borderRadius: 12,
    }
});
