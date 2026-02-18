import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { List, FAB, Text, ActivityIndicator, useTheme, Chip, Portal, Dialog, Divider, Paragraph, Button as PaperButton, IconButton, Searchbar, SegmentedButtons, Card } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ProductService } from '../../services/product.service';
import { Product } from '../../types/inventory';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import ProductFormModal from '../../components/modals/ProductFormModal';
import EditProductModal from '../../components/modals/EditProductModal';
import StockAdjustmentModal from '../../components/modals/StockAdjustmentModal';
import DismissKeyboard from '../../components/DismissKeyboard';

type Props = NativeStackScreenProps<AppStackParamList, 'Inventory'>;

export default function ProductListScreen({ navigation }: Props) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [open, setOpen] = useState(false); // For FAB Group
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

    // Modals state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [productToEditId, setProductToEditId] = useState<string | null>(null);
    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const { showAlert, showToast } = useNotifications();

    useEffect(() => {
        const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
            setProducts(updatedProducts);

            // Extract all unique tags
            const tags = new Set<string>();
            updatedProducts.forEach(p => {
                if (p.tags) p.tags.forEach(t => tags.add(t));
            });
            setAllTags(Array.from(tags).sort());

            applyFilters(searchQuery, selectedTag, stockFilter, updatedProducts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const applyFilters = (query: string, tag: string | null, stock: 'all' | 'low' | 'out', sourceData?: Product[]) => {
        const dataToFilter = sourceData || products;
        let filtered = dataToFilter;

        if (query) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (tag) {
            filtered = filtered.filter(p => p.tags && p.tags.includes(tag));
        }

        if (stock === 'low') {
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= (p.minStockAlert || 5));
        } else if (stock === 'out') {
            filtered = filtered.filter(p => p.stock === 0);
        }

        setFilteredProducts(filtered);
    };

    const onSearch = (query: string) => {
        setSearchQuery(query);
        applyFilters(query, selectedTag, stockFilter);
    };

    const onSelectTag = (tag: string | null) => {
        setSelectedTag(tag);
        applyFilters(searchQuery, tag, stockFilter);
    };

    const onSelectStockFilter = (val: string) => {
        const filter = val as 'all' | 'low' | 'out';
        setStockFilter(filter);
        applyFilters(searchQuery, selectedTag, filter);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        try {
            await ProductService.deleteProduct(productToDelete.id);
            showToast('Producto eliminado');
            setDeleteVisible(false);
            setProductToDelete(null);
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo eliminar el producto' });
        }
    };

    const theme = useTheme();

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <DismissKeyboard style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Inventario</Text>

                    <Searchbar
                        placeholder="Buscar producto..."
                        onChangeText={onSearch}
                        value={searchQuery}
                        style={styles.search}
                        elevation={0}
                    />

                    {allTags.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterScroll}>
                            <Chip
                                selected={selectedTag === null}
                                onPress={() => onSelectTag(null)}
                                style={styles.filterChip}
                                mode="outlined"
                            >
                                Todos
                            </Chip>
                            {allTags.map(tag => (
                                <Chip
                                    key={tag}
                                    selected={selectedTag === tag}
                                    onPress={() => onSelectTag(tag)}
                                    style={styles.filterChip}
                                    mode="outlined"
                                >
                                    {tag}
                                </Chip>
                            ))}
                        </ScrollView>
                    )}

                    <SegmentedButtons
                        value={stockFilter}
                        onValueChange={onSelectStockFilter}
                        style={styles.stockFilter}
                        buttons={[
                            { value: 'all', label: 'Todos' },
                            { value: 'low', label: 'Bajo Stock', icon: 'alert-circle' },
                            { value: 'out', label: 'Agotados', icon: 'close-circle' },
                        ]}
                    />
                </View>

                {filteredProducts.length === 0 ? (
                    <View style={styles.centered}>
                        <IconButton icon="package-variant" size={60} iconColor={theme.colors.outline} />
                        <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
                            {searchQuery || selectedTag || stockFilter !== 'all' ? 'No se encontraron resultados.' : 'Tu inventario está vacío.'}
                        </Text>
                        {!searchQuery && !selectedTag && stockFilter === 'all' && (
                            <PaperButton
                                mode="contained"
                                style={{ marginTop: 20 }}
                                onPress={() => setProductModalVisible(true)}
                            >
                                Añadir mi primer producto
                            </PaperButton>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => {
                            const isLowStock = item.stock <= (item.minStockAlert || 5);
                            const isOutOfStock = item.stock === 0;

                            return (
                                <Card style={styles.productCard} mode="elevated">
                                    <Card.Content style={styles.cardContent}>
                                        <View style={styles.infoContainer}>
                                            <Text variant="titleMedium" style={styles.productName}>{item.name}</Text>
                                            <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                                ${item.price.toFixed(2)}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.stockRow}
                                                onPress={() => {
                                                    setProductToEditId(item.id);
                                                    setStockModalVisible(true);
                                                }}
                                            >
                                                <MaterialCommunityIcons
                                                    name={isOutOfStock ? "package-variant" : isLowStock ? "alert-circle-outline" : "package-variant-closed"}
                                                    size={16}
                                                    color={isOutOfStock ? theme.colors.error : isLowStock ? "#FFA000" : theme.colors.secondary}
                                                />
                                                <Text variant="bodySmall" style={[
                                                    styles.stockText,
                                                    isOutOfStock ? { color: theme.colors.error } : isLowStock ? { color: "#FFA000" } : null
                                                ]}>
                                                    Stock: {item.stock} {isOutOfStock ? '(Agotado)' : isLowStock ? '(Bajo)' : ''}
                                                </Text>
                                            </TouchableOpacity>
                                            <View style={styles.cardTags}>
                                                {item.tags?.map(t => (
                                                    <View key={t} style={[styles.miniTag, { backgroundColor: theme.colors.secondaryContainer }]}>
                                                        <Text style={{ fontSize: 10, color: theme.colors.onSecondaryContainer, fontWeight: '600' }}>{t}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.actionsColumn}>
                                            <IconButton
                                                icon="pencil"
                                                mode="contained"
                                                containerColor={theme.colors.primaryContainer}
                                                iconColor={theme.colors.onPrimaryContainer}
                                                size={20}
                                                onPress={() => {
                                                    setProductToEditId(item.id);
                                                    setEditModalVisible(true);
                                                }}
                                            />
                                            <IconButton
                                                icon="trash-can"
                                                mode="contained"
                                                containerColor={theme.colors.errorContainer}
                                                iconColor={theme.colors.onErrorContainer}
                                                size={20}
                                                onPress={() => {
                                                    setProductToDelete(item);
                                                    setDeleteVisible(true);
                                                }}
                                            />
                                        </View>
                                    </Card.Content>
                                </Card>
                            );
                        }}
                    />
                )}
            </DismissKeyboard>

            <Portal>
                <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
                    <Dialog.Title>Eliminar Producto</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>¿Estás seguro de que quieres eliminar "{productToDelete?.name}"? Esta acción no se puede deshacer.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <PaperButton onPress={() => setDeleteVisible(false)}>Cancelar</PaperButton>
                        <PaperButton textColor={theme.colors.error} onPress={handleDelete}>Eliminar</PaperButton>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB.Group
                visible
                open={open}
                icon={open ? 'close' : 'plus'}
                style={{
                    paddingBottom: 85, // Adjust this so the FAB sits above the navbar
                }}
                fabStyle={{
                    backgroundColor: theme.colors.primary,
                    elevation: 5,
                }}
                color={theme.colors.onPrimary}
                actions={[
                    {
                        icon: 'package-variant-closed',
                        label: 'Ajustar Stock',
                        onPress: () => setStockModalVisible(true),
                        style: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 12 },
                        labelStyle: { fontWeight: 'bold', color: theme.colors.onSecondaryContainer },
                        containerStyle: { backgroundColor: theme.colors.secondaryContainer, borderRadius: 12 },
                    },
                    {
                        icon: 'plus',
                        label: 'Nuevo Producto',
                        onPress: () => setProductModalVisible(true),
                        style: { backgroundColor: theme.colors.primaryContainer, borderRadius: 12 },
                        labelStyle: { fontWeight: 'bold', color: theme.colors.onPrimaryContainer },
                        containerStyle: { backgroundColor: theme.colors.primaryContainer, borderRadius: 12 },
                    },
                ]}
                onStateChange={({ open }) => setOpen(open)}
                onPress={() => { }}
            />

            <ProductFormModal
                visible={productModalVisible}
                onDismiss={() => setProductModalVisible(false)}
            />

            <EditProductModal
                visible={editModalVisible}
                productId={productToEditId}
                onDismiss={() => {
                    setEditModalVisible(false);
                    setProductToEditId(null);
                }}
            />

            <StockAdjustmentModal
                visible={stockModalVisible}
                productId={null}
                onDismiss={() => setStockModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 28,
        marginBottom: 12,
    },
    search: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
    },
    list: {
        padding: 16,
        paddingBottom: 120,
    },
    productCard: {
        marginBottom: 12,
        borderRadius: 16,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoContainer: {
        flex: 1,
    },
    productName: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    stockText: {
        marginLeft: 4,
        color: '#666',
    },
    actionsColumn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    tagFilterScroll: {
        marginTop: 12,
        flexDirection: 'row',
    },
    filterChip: {
        marginRight: 8,
        borderRadius: 20,
    },
    cardTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    miniTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 6,
        marginBottom: 4,
    },
    stockFilter: {
        marginTop: 12,
    }
});
