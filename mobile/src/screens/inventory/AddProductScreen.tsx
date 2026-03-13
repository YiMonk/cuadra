import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ProductService } from '../../services/product.service';
import { useNotifications } from '../../context/NotificationContext';

type Props = NativeStackScreenProps<AppStackParamList, 'AddProduct'>; // We need to update types

export default function AddProductScreen({ navigation }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [variants, setVariants] = useState<{ id: string, name: string, stock: string }[]>([]);
    const [hasVariants, setHasVariants] = useState(false);

    const addVariant = () => {
        setVariants([...variants, { id: Date.now().toString(), name: '', stock: '' }]);
        setHasVariants(true);
    };

    const removeVariant = (id: string) => {
        const updated = variants.filter(v => v.id !== id);
        setVariants(updated);
        if (updated.length === 0) setHasVariants(false);
    };

    const updateVariant = (id: string, field: 'name' | 'stock', value: string) => {
        setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const handleSave = async () => {
        if (!name || !price) {
            showAlert({ title: 'Campo requerido', message: 'Por favor llena nombre y precio' });
            return;
        }

        if (!hasVariants && !stock) {
            showAlert({ title: 'Campo requerido', message: 'Por favor ingresa el stock' });
            return;
        }

        if (hasVariants && variants.some(v => !v.name || !v.stock)) {
            showAlert({ title: 'Error', message: 'Completa todas las variantes' });
            return;
        }

        setLoading(true);
        try {
            const finalStock = hasVariants
                ? variants.reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0)
                : parseInt(stock);

            const finalVariants = hasVariants ? variants.map(v => ({
                id: v.id,
                name: v.name,
                stock: parseInt(v.stock) || 0
            })) : undefined;

            await ProductService.addProduct({
                name,
                price: parseFloat(price),
                stock: finalStock,
                minStockAlert: parseInt(minStock),
                category: 'Cookies',
                description: '',
                variants: finalVariants
            });
            showToast('Producto guardado con éxito');
            navigation.goBack();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo guardar el producto' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Title style={[styles.title, { color: theme.colors.onBackground }]}>Nuevo Producto</Title>

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

            {!hasVariants && (
                <View style={styles.row}>
                    <TextInput
                        label="Stock Inicial"
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
            )}

            <View style={{ marginVertical: 10 }}>
                <Button mode="outlined" onPress={addVariant} icon="plus">
                    Agregar Variante (Talla/Color/etc)
                </Button>
            </View>

            {hasVariants && variants.map((variant, index) => (
                <View key={variant.id} style={[styles.row, { marginBottom: 10, alignItems: 'center' }]}>
                    <TextInput
                        label={`Variante ${index + 1}`}
                        value={variant.name}
                        onChangeText={(t) => updateVariant(variant.id, 'name', t)}
                        mode="outlined"
                        style={[styles.input, { flex: 2, marginRight: 5, backgroundColor: theme.colors.surface }]}
                        placeholder="Ej: XL, Rojo"
                    />
                    <TextInput
                        label="Cant."
                        value={variant.stock}
                        onChangeText={(t) => updateVariant(variant.id, 'stock', t)}
                        keyboardType="numeric"
                        mode="outlined"
                        style={[styles.input, { flex: 1, marginRight: 5, backgroundColor: theme.colors.surface }]}
                    />
                    <Button
                        icon="delete"
                        onPress={() => removeVariant(variant.id)}
                        textColor={theme.colors.error}
                        compact
                    >
                    </Button>
                </View>
            ))}

            <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
                Guardar Producto
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
    }
});
