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
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !price || !stock) {
            showAlert({ title: 'Campo requerido', message: 'Por favor llena todos los campos' });
            return;
        }

        setLoading(true);
        try {
            await ProductService.addProduct({
                name,
                price: parseFloat(price),
                stock: parseInt(stock),
                minStockAlert: parseInt(minStock),
                category: 'Cookies', // Default for now
                description: '',
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
