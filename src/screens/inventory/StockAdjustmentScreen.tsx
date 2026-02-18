import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput, RadioButton, List, Divider, Menu, Searchbar, useTheme } from 'react-native-paper';
import { ProductService } from '../../services/product.service';
import { Product } from '../../types/inventory';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'StockAdjustment'>;

export default function StockAdjustmentScreen({ route }: Props) {
    const params = route.params;
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

    useEffect(() => {
        const unsubscribe = ProductService.subscribeToProducts((list) => {
            setProducts(list);
            setFilteredProducts(list);

            // If we have a productId in params, select it automatically
            if (params?.productId && !selectedProduct) {
                const preSelected = list.find(p => p.id === params.productId);
                if (preSelected) setSelectedProduct(preSelected);
            }
        });
        return () => unsubscribe();
    }, [params?.productId]);

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
        setFilteredProducts([]); // Hide list
    };

    const handleSave = async () => {
        if (!selectedProduct) {
            showAlert({ title: 'Selección pendiente', message: 'Por favor selecciona un producto' });
            return;
        }
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            showAlert({ title: 'Cantidad inválida', message: 'Por favor ingresa una cantidad válida' });
            return;
        }

        setLoading(true);
        try {
            const adjustment = reason === 'waste' ? -Number(quantity) : Number(quantity);

            await ProductService.adjustStock(selectedProduct.id, adjustment, reason, notes);

            showToast('Stock actualizado correctamente');
            // Reset form
            setSelectedProduct(null);
            setQuantity('');
            setNotes('');
            setReason('restock');
            setFilteredProducts(products); // Show list again
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo actualizar el stock' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Gestión de Stock</Text>

                {!selectedProduct ? (
                    <View>
                        <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>Selecciona un producto para ajustar:</Text>
                        <Searchbar
                            placeholder="Buscar producto..."
                            onChangeText={onChangeSearch}
                            value={searchQuery}
                            style={[styles.search, { backgroundColor: theme.colors.surface }]}
                            elevation={1}
                        />
                        {filteredProducts.map(p => (
                            <List.Item
                                key={p.id}
                                title={p.name}
                                description={`Stock Actual: ${p.stock}`}
                                onPress={() => handleSelectProduct(p)}
                                left={props => <List.Icon {...props} icon="package-variant" color={theme.colors.primary} />}
                                style={{ backgroundColor: theme.colors.surface, marginBottom: 2 }}
                                titleStyle={{ color: theme.colors.onSurface }}
                                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                            />
                        ))}
                    </View>
                ) : (
                    <View>
                        <List.Item
                            title={selectedProduct.name}
                            description={`Stock Actual: ${selectedProduct.stock}`}
                            left={props => <List.Icon {...props} icon="package-variant" color={theme.colors.primary} />}
                            right={props => <Button onPress={() => setSelectedProduct(null)}>Cambiar</Button>}
                            style={[styles.selectedItem, { backgroundColor: theme.colors.surface }]}
                            titleStyle={{ color: theme.colors.onSurface }}
                            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                        />

                        <Divider style={{ marginVertical: 20 }} />

                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Tipo de Acción</Text>
                        <RadioButton.Group onValueChange={value => setReason(value as any)} value={reason}>
                            <View style={styles.radioRow}>
                                <RadioButton value="restock" color={theme.colors.primary} />
                                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Reabastecer (Entrada)</Text>
                            </View>
                            <View style={styles.radioRow}>
                                <RadioButton value="waste" color={theme.colors.error} />
                                <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>Merma / Desperdicio (Salida)</Text>
                            </View>
                        </RadioButton.Group>

                        <TextInput
                            label="Cantidad"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                            mode="outlined"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            textColor={theme.colors.onSurface}
                        />

                        <TextInput
                            label="Notas (Opcional)"
                            value={notes}
                            onChangeText={setNotes}
                            mode="outlined"
                            style={[styles.input, { backgroundColor: theme.colors.surface }]}
                            textColor={theme.colors.onSurface}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            buttonColor={reason === 'waste' ? theme.colors.error : theme.colors.primary}
                        >
                            Confirmar {reason === 'waste' ? 'Salida' : 'Entrada'}
                        </Button>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scroll: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        fontWeight: 'bold',
    },
    search: {
        marginBottom: 10,
    },
    selectedItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        elevation: 2,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        marginBottom: 15,
        backgroundColor: 'white',
    },
    button: {
        marginTop: 10,
        padding: 5,
    }
});
