import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, useTheme, Card, Menu, IconButton, Divider } from 'react-native-paper';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../types/category';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    category?: Category | null;
    onSaved: () => void;
}

export default function CategoryFormModal({ visible, onDismiss, category, onSaved }: Props) {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string | undefined>(undefined);
    const [categories, setCategories] = useState<Category[]>([]);
    const [parentMenuVisible, setParentMenuVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadCategories();
        if (category) {
            setName(category.name || '');
            setDescription(category.description || '');
            setParentId(category.parentId);
        } else {
            setName('');
            setDescription('');
            setParentId(undefined);
        }
    }, [category, visible]);

    const loadCategories = async () => {
        const cats = await CategoryService.getCategories();
        // Filter out current category to avoid circular dependency
        // Also only allow selection of categories that don't have a parent themselves (keep it 2 levels deep for simplicity)
        // or allow multi-level but let's stick to 2 for now as sub-categories
        setCategories(cats.filter(c => c.id !== category?.id && !c.parentId));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (category) {
                await CategoryService.updateCategory(category.id, {
                    name: name.trim(),
                    description: description.trim(),
                    parentId: parentId || null as any // Use null to clear parent
                });
            } else {
                await CategoryService.addCategory({
                    name: name.trim(),
                    description: description.trim(),
                    parentId: parentId
                });
            }

            onSaved();
            handleDismiss();
        } catch (err: any) {
            console.error(err);
            setError('No se pudo guardar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setError('');
        if (!category) {
            setName('');
            setDescription('');
            setParentId(undefined);
        }
        onDismiss();
    };

    const parentCategoryName = categories.find(c => c.id === parentId)?.name || 'Ninguna (Categoría Principal)';

    return (
        <Portal>
            <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={styles.container}>
                <Card style={{ backgroundColor: theme.colors.surface }}>
                    <Card.Title
                        title={category ? "Editar Categoría" : "Nueva Categoría"}
                        subtitle="Gestión de catálogo"
                    />
                    <Card.Content>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Nombre"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Descripción (Opcional)"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />

                        <Divider style={{ marginVertical: 10 }} />

                        <Text variant="titleSmall" style={{ marginBottom: 5 }}>Categoría Superior (Opcional)</Text>
                        <Text variant="bodySmall" style={{ marginBottom: 10, color: theme.colors.outline }}>
                            Si seleccionas una, esta será una Sub-categoría.
                        </Text>

                        <Menu
                            visible={parentMenuVisible}
                            onDismiss={() => setParentMenuVisible(false)}
                            anchor={
                                <Button
                                    mode="outlined"
                                    onPress={() => setParentMenuVisible(true)}
                                    icon="family-tree"
                                    style={{ marginBottom: 10 }}
                                >
                                    {parentCategoryName}
                                </Button>
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    setParentId(undefined);
                                    setParentMenuVisible(false);
                                }}
                                title="Ninguna (Categoría Principal)"
                            />
                            {categories.map((cat) => (
                                <Menu.Item
                                    key={cat.id}
                                    onPress={() => {
                                        setParentId(cat.id);
                                        setParentMenuVisible(false);
                                    }}
                                    title={cat.name}
                                />
                            ))}
                        </Menu>

                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={handleDismiss} disabled={loading}>Cancelar</Button>
                        <Button
                            mode="contained"
                            onPress={handleSave}
                            loading={loading}
                            disabled={loading}
                        >
                            Guardar
                        </Button>
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    input: {
        marginBottom: 15,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    }
});
