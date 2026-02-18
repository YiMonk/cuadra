import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, useTheme, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ProductService } from '../../services/product.service';
import { useNotifications } from '../../context/NotificationContext';
import { Product } from '../../types/inventory';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProduct'>;

export default function EditProductScreen({ route, navigation }: Props) {
    const { productId } = route.params;
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Since we don't have a getProductById in the service that simplifies it, 
                // we can just use the getProducts and filter or add a method.
                // For simplicity and speed, let's assume we can get it.
                const products = await ProductService.getProducts();
                const product = products.find(p => p.id === productId);

                if (product) {
                    setName(product.name);
                    setPrice(product.price.toString());
                    setStock(product.stock.toString());
                    setMinStock((product.minStockAlert || 5).toString());
                } else {
                    showAlert({ title: 'Error', message: 'Producto no encontrado' });
                    navigation.goBack();
                }
            } catch (error) {
                showAlert({ title: 'Error', message: 'No se pudo cargar el producto' });
                navigation.goBack();
            } finally {
                setFetching(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleSave = async () => {
        if (!name || !price || !stock) {
            showAlert({ title: 'Campo requerido', message: 'Por favor llena todos los campos' });
            return;
        }

        setLoading(true);
        try {
            await ProductService.updateProduct(productId, {
                name,
                price: parseFloat(price),
                stock: parseInt(stock),
                minStockAlert: parseInt(minStock),
                updatedAt: Date.now(),
            });
            showToast('Producto actualizado con éxito');
            navigation.goBack();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo actualizar el producto' });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Title style={[styles.title, { color: theme.colors.onBackground }]}>Editar Producto</Title>

            <TextInput
                label="Nombre del Producto"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />

            <TextInput
                label="Precio (USD)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />

            <View style={styles.row}>
                <TextInput
                    label="Stock Actual"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.input, styles.half, { backgroundColor: theme.colors.surface }]}
                    textColor={theme.colors.onSurface}
                />

                <TextInput
                    label="Alerta Stock Mín."
                    value={minStock}
                    onChangeText={setMinStock}
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.input, styles.half, { backgroundColor: theme.colors.surface }]}
                    textColor={theme.colors.onSurface}
                />
            </View>

            <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
                Guardar Cambios
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    half: {
        width: '48%',
    },
    button: {
        marginTop: 10,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
