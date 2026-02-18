import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { List, Switch, Button, Avatar, Text, Divider, useTheme, Portal, Dialog, TextInput, SegmentedButtons, Card, IconButton, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useNotifications } from '../../context/NotificationContext';
import { UserService, UserMetadata } from '../../services/user.service';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AddUserModal from '../../components/modals/AddUserModal';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, signOut, reloadUser } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();

    const [activeTab, setActiveTab] = useState('profile');

    // Profile Edit State
    const [profileDialogVisible, setProfileDialogVisible] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [updating, setUpdating] = useState(false);

    // User Management State
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [addUserModalVisible, setAddUserModalVisible] = useState(false);

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUpdateProfile = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setUpdating(true);
        try {
            // Update Name
            if (newName.trim() !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newName.trim() });
            }

            // Update Email
            if (newEmail.trim() !== currentUser.email) {
                await updateEmail(currentUser, newEmail.trim());
            }

            // Update Password
            if (newPassword.trim()) {
                await updatePassword(currentUser, newPassword.trim());
            }

            // Sync with Firestore metadata
            await UserService.syncUserMetadata(currentUser.uid, {
                displayName: newName.trim(),
                email: newEmail.trim()
            });

            // RELOAD AUTH CONTEXT
            await reloadUser();

            showToast('Perfil actualizado correctamente');
            setProfileDialogVisible(false);
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                showAlert({
                    title: 'Seguridad',
                    message: 'Esta acción requiere un inicio de sesión reciente. Por favor, cierra sesión e ingresa de nuevo.'
                });
            } else {
                showAlert({ title: 'Error', message: error.message || 'No se pudo actualizar el perfil' });
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        showAlert({
            title: 'Cerrar Sesión',
            message: '¿Estás seguro que deseas salir?',
            showCancel: true,
            confirmText: 'Salir',
            onConfirm: signOut
        });
    };

    const toggleUserRole = async (uid: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'staff' : 'admin';
            await UserService.updateUser(uid, { role: newRole as any });
            showToast(`Rol actualizado a ${newRole}`);
            loadUsers();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo actualizar el rol' });
        }
    };

    const renderProfileTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.profileHeader}>
                <Avatar.Text
                    size={100}
                    label={user?.email ? user.email.substring(0, 2).toUpperCase() : 'UU'}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                />
                <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onBackground }]}>
                    {user?.displayName || 'Usuario'}
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    {user?.email}
                </Text>
                <Button
                    mode="contained"
                    icon="pencil"
                    onPress={() => setProfileDialogVisible(true)}
                    style={styles.editBtn}
                >
                    Editar Perfil
                </Button>
            </View>

            <Divider style={styles.divider} />

            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Preferencias</List.Subheader>
                <List.Item
                    title="Modo Oscuro"
                    description="Apariencia de la aplicación"
                    left={props => <List.Icon {...props} icon="theme-light-dark" />}
                    right={() => <Switch value={isDarkTheme} onValueChange={toggleTheme} />}
                />
            </List.Section>

            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Seguridad</List.Subheader>
                <List.Item
                    title="Cerrar Sesión"
                    onPress={handleLogout}
                    left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
                    titleStyle={{ color: theme.colors.error }}
                />
            </List.Section>

            <List.Section>
                <List.Subheader style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Otros</List.Subheader>
                <List.Item
                    title="Herramientas de Desarrollador"
                    left={props => <List.Icon {...props} icon="code-braces" />}
                    onPress={() => navigation.navigate('Simulation' as never)}
                />
            </List.Section>
        </ScrollView>
    );

    const renderUsersTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.userListHeader}>
                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Personal / Usuarios</Text>
                <Button icon="plus" mode="text" onPress={() => setAddUserModalVisible(true)}>
                    Agregar
                </Button>
            </View>

            <ScrollView style={{ flex: 1 }}>
                {users.map((u) => (
                    <Card key={u.id} style={styles.userCard}>
                        <Card.Content style={styles.userCardContent}>
                            <Avatar.Text size={40} label={u.displayName.substring(0, 2).toUpperCase()} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text variant="titleMedium">{u.displayName}</Text>
                                <Text variant="bodySmall">{u.email} • {u.role === 'admin' ? 'Administrador' : 'Vendedor'}</Text>
                            </View>
                            <IconButton
                                icon={u.role === 'admin' ? "shield-check" : "account-outline"}
                                iconColor={u.role === 'admin' ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                onPress={() => {
                                    showAlert({
                                        title: 'Cambiar Rol',
                                        message: `¿Deseas cambiar el rol de ${u.displayName} a ${u.role === 'admin' ? 'Vendedor' : 'Administrador'}?`,
                                        showCancel: true,
                                        onConfirm: () => toggleUserRole(u.id, u.role)
                                    });
                                }}
                            />
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>Configuración</Text>
            </View>

            <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                style={styles.tabs}
                buttons={[
                    { value: 'profile', label: 'Mi Perfil', icon: 'account' },
                    { value: 'users', label: 'Usuarios', icon: 'account-group' },
                ]}
            />

            {activeTab === 'profile' ? renderProfileTab() : renderUsersTab()}

            <AddUserModal
                visible={addUserModalVisible}
                onDismiss={() => setAddUserModalVisible(false)}
                onUserCreated={() => {
                    showToast('Usuario creado correctamente');
                    loadUsers();
                }}
            />

            <Portal>
                <Dialog visible={profileDialogVisible} onDismiss={() => setProfileDialogVisible(false)}>
                    <Dialog.Title>Editar Datos de Usuario</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Nombre"
                            value={newName}
                            onChangeText={setNewName}
                            mode="outlined"
                            style={styles.dialogInput}
                        />
                        <TextInput
                            label="Correo Electrónico"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            style={styles.dialogInput}
                        />
                        <TextInput
                            label="Nueva Contraseña (Opcional)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.dialogInput}
                            placeholder="Dejar vacío para no cambiar"
                        />
                        <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.outline }}>
                            Cambiar correo o contraseña puede requerir volver a iniciar sesión por seguridad.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setProfileDialogVisible(false)}>Cancelar</Button>
                        <Button onPress={handleUpdateProfile} loading={updating} mode="contained">Guardar Cambios</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <View style={styles.footer}>
                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Versión 1.1.0 • Cuadra Admin</Text>
            </View>
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
    title: {
        fontWeight: 'bold',
    },
    tabs: {
        marginHorizontal: 20,
        marginBottom: 10,
    },
    tabContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    userName: {
        marginTop: 15,
        fontWeight: 'bold',
    },
    editBtn: {
        marginTop: 20,
        borderRadius: 12,
        paddingHorizontal: 10,
    },
    divider: {
        marginVertical: 10,
    },
    dialogInput: {
        marginBottom: 10,
    },
    userListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 15,
    },
    userCard: {
        marginBottom: 10,
        borderRadius: 12,
    },
    userCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 15,
    }
});
