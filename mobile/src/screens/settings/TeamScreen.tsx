import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Avatar, Text, Card, IconButton, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService, UserMetadata } from '../../services/user.service';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EditUserModal from '../../components/modals/EditUserModal';
import AddUserModal from '../../components/modals/AddUserModal';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function TeamScreen() {
    const theme = useTheme();
    const { user } = useAuth(); // Add this hook
    const { showAlert, showToast } = useNotifications();
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [addUserModalVisible, setAddUserModalVisible] = useState(false);

    // Edit User State
    const [selectedUser, setSelectedUser] = useState<UserMetadata | null>(null);
    const [editUserModalVisible, setEditUserModalVisible] = useState(false);

    useEffect(() => {
        if (user) {
            loadUsers();
        }
    }, [user]);

    const loadUsers = async () => {
        if (!user) return;
        setLoadingUsers(true);
        try {
            // Only fetch members of this admin's team
            const data = await UserService.getTeamMembers(user.uid);
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleEditUser = (user: UserMetadata) => {
        setSelectedUser(user);
        setEditUserModalVisible(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>Equipo de Trabajo</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Gestiona los usuarios y sus permisos
                </Text>
            </View>

            <ScrollView style={styles.list}>
                {users.map((u) => (
                    <Card
                        key={u.id}
                        style={[styles.userCard, { backgroundColor: theme.colors.surface, opacity: u.active ? 1 : 0.6 }]}
                        mode="elevated"
                        onPress={() => handleEditUser(u)}
                    >
                        <Card.Content style={styles.userCardContent}>
                            <Avatar.Text
                                size={50}
                                label={u.displayName.substring(0, 2).toUpperCase()}
                                style={{ backgroundColor: theme.colors.secondaryContainer }}
                                color={theme.colors.onSecondaryContainer}
                            />
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{u.displayName}</Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{u.email}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <View style={[
                                        styles.roleBadge,
                                        { backgroundColor: u.role === 'admin' ? theme.colors.primaryContainer : theme.colors.surfaceVariant, marginRight: 8 }
                                    ]}>
                                        <Text variant="labelSmall" style={{
                                            color: u.role === 'admin' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
                                        }}>
                                            {u.role === 'admin' ? 'ADMINISTRADOR' : 'VENDEDOR'}
                                        </Text>
                                    </View>
                                    {!u.active && (
                                        <View style={[styles.roleBadge, { backgroundColor: theme.colors.errorContainer }]}>
                                            <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer }}>INACTIVO</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <IconButton
                                icon="pencil-outline"
                                iconColor={theme.colors.primary}
                                onPress={() => handleEditUser(u)}
                            />
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            <FAB
                icon="plus"
                label="Nuevo Usuario"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color={theme.colors.onPrimary}
                onPress={() => setAddUserModalVisible(true)}
            />

            <AddUserModal
                visible={addUserModalVisible}
                onDismiss={() => setAddUserModalVisible(false)}
                onUserCreated={() => {
                    showToast('Usuario creado correctamente');
                    loadUsers();
                }}
            />

            <EditUserModal
                visible={editUserModalVisible}
                user={selectedUser}
                onDismiss={() => setEditUserModalVisible(false)}
                onUserUpdated={() => {
                    showToast('Usuario actualizado');
                    loadUsers();
                    setEditUserModalVisible(false); // Ensure modal closes
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
    },
    list: {
        paddingHorizontal: 20,
    },
    userCard: {
        marginBottom: 12,
        borderRadius: 16,
    },
    userCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
