import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Portal, Modal, Text, useTheme, IconButton, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { ProductService } from '../../services/product.service';
import { useNotifications } from '../../context/NotificationContext';
import { Product } from '../../types/inventory';

interface Props {
    visible: boolean;
    productId: string | null;
    onDismiss: () => void;
    onSuccess?: () => void;
}

export default function EditProductModal({ visible, productId, onDismiss, onSuccess }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fetchingTags, setFetchingTags] = useState(false);

    useEffect(() => {
        if (visible && productId) {
            loadProduct();
            loadAvailableTags();
        }
    }, [visible, productId]);

    const loadProduct = async () => {
        setFetching(true);
        try {
            const products = await ProductService.getProducts();
            const product = products.find(p => p.id === productId);

            if (product) {
                setName(product.name);
                setPrice(product.price.toString());
                setStock(product.stock.toString());
                setMinStock((product.minStockAlert || 5).toString());
                setTags(product.tags || []);
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo cargar la información del producto.' });
        } finally {
            setFetching(false);
        }
    };

    const loadAvailableTags = async () => {
        setFetchingTags(true);
        try {
            const products = await ProductService.getProducts();
            const allTags = new Set<string>();
            products.forEach(p => {
                if (p.tags) p.tags.forEach(t => allTags.add(t));
            });
            setAvailableTags(Array.from(allTags).sort());
        } catch (error) {
            console.error("Error loading tags:", error);
        } finally {
            setFetchingTags(false);
        }
    };

    const handleAddTag = () => {
        const tag = newTag.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setNewTag('');
        }
    };

    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            setTags([...tags, tag]);
        }
    };

    const handleSave = async () => {
        if (!productId) return;
        if (!name || !price || !stock) {
            showAlert({ title: 'Atención', message: 'Nombre, precio y stock son obligatorios.' });
            return;
        }

        setLoading(true);
        try {
            await ProductService.updateProduct(productId, {
                name,
                price: parseFloat(price),
                stock: parseInt(stock),
                minStockAlert: parseInt(minStock),
                tags,
                updatedAt: Date.now(),
            });

            showToast('Producto actualizado con éxito');
            if (onSuccess) onSuccess();
            onDismiss();
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo actualizar el producto.' });
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
                        <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Editar Producto</Text>
                        <IconButton icon="close" onPress={onDismiss} disabled={loading} />
                    </View>

                    {fetching ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" />
                            <Text style={{ marginTop: 10 }}>Cargando datos...</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.form}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <TextInput
                                label="Nombre del Producto"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={styles.input}
                                left={<TextInput.Icon icon="package-variant" />}
                            />

                            <TextInput
                                label="Precio (USD)"
                                value={price}
                                onChangeText={setPrice}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                                left={<TextInput.Icon icon="currency-usd" />}
                            />

                            <View style={styles.row}>
                                <TextInput
                                    label="Stock"
                                    value={stock}
                                    onChangeText={setStock}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                                    left={<TextInput.Icon icon="numeric" />}
                                />
                                <TextInput
                                    label="Alerta Mín."
                                    value={minStock}
                                    onChangeText={setMinStock}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, { flex: 1 }]}
                                    left={<TextInput.Icon icon="alert-outline" />}
                                />
                            </View>

                            <Divider style={styles.divider} />

                            <Text variant="titleMedium" style={styles.sectionLabel}>Etiquetas / Categorías</Text>

                            <View style={styles.tagInputRow}>
                                <TextInput
                                    label="Nueva Etiqueta"
                                    value={newTag}
                                    onChangeText={setNewTag}
                                    mode="outlined"
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    onSubmitEditing={handleAddTag}
                                />
                                <IconButton
                                    icon="plus-circle"
                                    size={32}
                                    iconColor={theme.colors.primary}
                                    onPress={handleAddTag}
                                    style={{ margin: 0 }}
                                />
                            </View>

                            <View style={styles.tagsContainer}>
                                {tags.map(tag => (
                                    <Chip
                                        key={tag}
                                        onClose={() => toggleTag(tag)}
                                        style={styles.tagChip}
                                        selected
                                    >
                                        {tag}
                                    </Chip>
                                ))}
                            </View>

                            <Text variant="labelSmall" style={styles.hint}>Toca para añadir existentes:</Text>

                            {fetchingTags ? (
                                <ActivityIndicator size="small" style={{ marginVertical: 10 }} />
                            ) : (
                                <View style={styles.tagsContainer}>
                                    {availableTags
                                        .filter(t => !tags.includes(t))
                                        .map(tag => (
                                            <Chip
                                                key={tag}
                                                onPress={() => toggleTag(tag)}
                                                style={styles.availableTagChip}
                                                mode="outlined"
                                            >
                                                {tag}
                                            </Chip>
                                        ))}
                                </View>
                            )}

                            <Button
                                mode="contained"
                                onPress={handleSave}
                                loading={loading}
                                disabled={loading}
                                style={styles.saveBtn}
                                contentStyle={{ height: 48 }}
                            >
                                Guardar Cambios
                            </Button>

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
                    )}
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

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
    centered: {
        padding: 40,
        alignItems: 'center',
    },
    form: {
        marginTop: 8,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    row: {
        flexDirection: 'row',
    },
    divider: {
        marginVertical: 16,
    },
    sectionLabel: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    tagInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    tagChip: {
        marginRight: 6,
        marginBottom: 6,
    },
    availableTagChip: {
        marginRight: 6,
        marginBottom: 6,
        opacity: 0.8,
    },
    hint: {
        opacity: 0.6,
        marginBottom: 8,
        marginTop: 4,
    },
    saveBtn: {
        marginTop: 20,
        borderRadius: 12,
    }
});
