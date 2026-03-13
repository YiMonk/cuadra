import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Card, IconButton, useTheme, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../types/category';
import CategoryFormModal from '../../components/modals/CategoryFormModal';
import { useNotifications } from '../../context/NotificationContext';

export default function CategoryListScreen() {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [formVisible, setFormVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        const unsubscribe = CategoryService.subscribeToCategories((data) => {
            setCategories(data);
            setFilteredCategories(data);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredCategories(
                categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        } else {
            setFilteredCategories(categories);
        }
    }, [searchQuery, categories]);

    const handleDelete = (category: Category) => {
        showAlert({
            title: 'Eliminar Categoría',
            message: `¿Estás seguro de eliminar "${category.name}"? Esto no eliminará los productos asociados, pero quedarán sin categoría.`,
            showCancel: true,
            confirmText: 'Eliminar',
            onConfirm: async () => {
                try {
                    await CategoryService.deleteCategory(category.id);
                    showToast('Categoría eliminada');
                } catch (error) {
                    showToast('Error al eliminar');
                }
            }
        });
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setFormVisible(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setFormVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>Categorías</Text>
            </View>

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Buscar categoría..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={{ backgroundColor: theme.colors.surface }}
                />
            </View>

            <FlatList
                data={filteredCategories}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const isSubCategory = !!item.parentId;
                    const parentCategory = categories.find(c => c.id === item.parentId);

                    return (
                        <Card
                            style={[
                                styles.card,
                                {
                                    backgroundColor: theme.colors.surface,
                                    marginLeft: isSubCategory ? 40 : 20,
                                    marginRight: 20
                                }
                            ]}
                            mode="elevated"
                        >
                            <Card.Content style={styles.cardContent}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {isSubCategory && <IconButton icon="subdirectory-arrow-right" size={16} style={{ margin: 0 }} />}
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.name}</Text>
                                    </View>
                                    {isSubCategory && parentCategory && (
                                        <Text variant="labelSmall" style={{ color: theme.colors.primary, marginBottom: 4 }}>
                                            En {parentCategory.name}
                                        </Text>
                                    )}
                                    {item.description ? (
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>
                                <View style={styles.actions}>
                                    <IconButton
                                        icon="pencil-outline"
                                        iconColor={theme.colors.primary}
                                        onPress={() => handleEdit(item)}
                                    />
                                    <IconButton
                                        icon="trash-can-outline"
                                        iconColor={theme.colors.error}
                                        onPress={() => handleDelete(item)}
                                    />
                                </View>
                            </Card.Content>
                        </Card>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ color: theme.colors.outline }}>No hay categorías registradas</Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={handleAdd}
            />

            <CategoryFormModal
                visible={formVisible}
                category={selectedCategory}
                onDismiss={() => setFormVisible(false)}
                onSaved={() => {
                    showToast(selectedCategory ? 'Categoría actualizada' : 'Categoría creada');
                    setFormVisible(false); // Ensure close
                }}
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
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    list: {
        paddingVertical: 10,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 10,
        borderRadius: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actions: {
        flexDirection: 'row',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    empty: {
        alignItems: 'center',
        marginTop: 50,
    }
});
