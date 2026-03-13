import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Portal, Modal, Text, useTheme, IconButton, Chip, Divider, ActivityIndicator, Menu } from 'react-native-paper';
import { ProductService } from '../../services/product.service';
import { useNotifications } from '../../context/NotificationContext';
import { Product } from '../../types/inventory';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../types/category';

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
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Categories State
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
    const [categoryName, setCategoryName] = useState<string>('');
    const [subCategoryId, setSubCategoryId] = useState<string | undefined>(undefined);
    const [subCategoryName, setSubCategoryName] = useState<string>('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [subMenuVisible, setSubMenuVisible] = useState(false);

    // Variants State
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

    useEffect(() => {
        if (visible) {
            loadCategories();
            if (productId) {
                loadProduct();
            }
        }
    }, [visible, productId]);

    const loadCategories = async () => {
        try {
            const data = await CategoryService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

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
                setCategoryName(product.category || '');
                setSubCategoryName(product.subCategory || '');

                if (product.variants && product.variants.length > 0) {
                    setVariants(product.variants.map(v => ({
                        id: v.id,
                        name: v.name,
                        stock: v.stock.toString()
                    })));
                    setHasVariants(true);
                } else {
                    setVariants([]);
                    setHasVariants(false);
                }
            }
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo cargar la información del producto.' });
        } finally {
            setFetching(false);
        }
    };



    const handleSave = async () => {
        if (!productId) return;
        if (!name || !price) {
            showAlert({ title: 'Atención', message: 'Nombre y precio son obligatorios.' });
            return;
        }

        if (!hasVariants && !stock) {
            showAlert({ title: 'Atención', message: 'Ingresa el stock o agrega variantes.' });
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
            })) : []; // Empty array if no variants to clear them if they existed

            await ProductService.updateProduct(productId, {
                name,
                price: parseFloat(price),
                stock: finalStock,
                minStockAlert: parseInt(minStock),
                category: categoryName,
                subCategory: subCategoryName || undefined,
                variants: finalVariants,
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

                            <Divider style={styles.divider} />

                            <View style={{ marginBottom: 15 }}>
                                <Button mode="outlined" onPress={addVariant} icon="plus">
                                    Agregar Variante (Talla/Color/etc)
                                </Button>
                            </View>

                            {hasVariants ? (
                                <View style={{ marginBottom: 15 }}>
                                    {variants.map((variant, index) => (
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
                                            <IconButton
                                                icon="delete"
                                                onPress={() => removeVariant(variant.id)}
                                                iconColor={theme.colors.error}
                                            />
                                        </View>
                                    ))}
                                </View>
                            ) : (
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
                            )}

                            <Divider style={styles.divider} />

                            <Divider style={styles.divider} />

                            <Text variant="titleMedium" style={styles.sectionLabel}>Categoría</Text>
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setMenuVisible(true)}
                                        style={{ marginBottom: 15, borderColor: theme.colors.outline }}
                                        textColor={theme.colors.onSurface}
                                        icon="shape"
                                    >
                                        {categoryName || 'Seleccionar Categoría'}
                                    </Button>
                                }
                            >
                                {categories
                                    .filter(c => !c.parentId)
                                    .map((cat) => (
                                        <Menu.Item
                                            key={cat.id}
                                            onPress={() => {
                                                setCategoryId(cat.id);
                                                setCategoryName(cat.name);
                                                setSubCategoryId(undefined);
                                                setSubCategoryName('');
                                                setMenuVisible(false);
                                            }}
                                            title={cat.name}
                                        />
                                    ))}
                            </Menu>

                            {(categoryId || categoryName) && (
                                <View>
                                    <Text variant="titleMedium" style={styles.sectionLabel}>Sub-categoría (Opcional)</Text>
                                    <Menu
                                        visible={subMenuVisible}
                                        onDismiss={() => setSubMenuVisible(false)}
                                        anchor={
                                            <Button
                                                mode="outlined"
                                                onPress={() => setSubMenuVisible(true)}
                                                style={{ marginBottom: 15, borderColor: theme.colors.outline }}
                                                textColor={theme.colors.onSurface}
                                                icon="family-tree"
                                            >
                                                {subCategoryName || 'Seleccionar Sub-categoría'}
                                            </Button>
                                        }
                                    >
                                        <Menu.Item
                                            onPress={() => {
                                                setSubCategoryId(undefined);
                                                setSubCategoryName('');
                                                setSubMenuVisible(false);
                                            }}
                                            title="Ninguna"
                                        />
                                        {categories
                                            .filter(c => {
                                                const parent = categories.find(cat => cat.name === categoryName);
                                                return c.parentId === (categoryId || parent?.id);
                                            })
                                            .map((sub) => (
                                                <Menu.Item
                                                    key={sub.id}
                                                    onPress={() => {
                                                        setSubCategoryId(sub.id);
                                                        setSubCategoryName(sub.name);
                                                        setSubMenuVisible(false);
                                                    }}
                                                    title={sub.name}
                                                />
                                            ))}
                                    </Menu>
                                </View>
                            )}

                            <Divider style={styles.divider} />

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
