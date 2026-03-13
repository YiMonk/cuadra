import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { List, Switch, Button, Avatar, Text, Divider, useTheme, Portal, Dialog, TextInput, SegmentedButtons, Card, IconButton, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../config/firebaseConfig';
import { updateProfile, verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNotifications } from '../../context/NotificationContext';
import { UserService } from '../../services/user.service';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import AddUserModal from '../../components/modals/AddUserModal'; // Removed
// import AddUserModal from '../../components/modals/AddUserModal'; // Removed

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { user, signOut, reloadUser } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();

    // Profile Edit State
    const [profileDialogVisible, setProfileDialogVisible] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updating, setUpdating] = useState(false);

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleUpdateProfile = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        if (newEmail.trim() !== currentUser.email && !validateEmail(newEmail.trim())) {
            showAlert({ title: 'Error', message: 'Por favor, ingresa un correo electrónico válido.' });
            return;
        }

        setUpdating(true);
        let emailChanged = false;
        try {
            // 1. Re-authenticate if changing email or password
            if ((newEmail.trim() !== currentUser.email || newPassword.trim()) && currentPassword) {
                const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
            } else if ((newEmail.trim() !== currentUser.email || newPassword.trim()) && !currentPassword) {
                showAlert({
                    title: 'Seguridad',
                    message: 'Para cambiar tu correo o contraseña, debes ingresar tu contraseña actual.'
                });
                setUpdating(false);
                return;
            }

            // 2. Update Name
            if (newName.trim() !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newName.trim() });
            }

            // 3. Update Email (Requires verification)
            if (newEmail.trim() !== currentUser.email) {
                await verifyBeforeUpdateEmail(currentUser, newEmail.trim());
                emailChanged = true;
            }

            // 4. Update Password
            if (newPassword.trim()) {
                await updatePassword(currentUser, newPassword.trim());
            }

            // 5. Sync with Firestore metadata
            await UserService.syncUserMetadata(currentUser.uid, {
                displayName: newName.trim(),
                email: emailChanged ? (currentUser.email || '') : newEmail.trim()
            });

            // 6. RELOAD AUTH CONTEXT
            await reloadUser();

            if (emailChanged) {
                showAlert({
                    title: 'Verificación enviada',
                    message: `Se ha enviado un correo de verificación a ${newEmail}. Debes verificarlo para que el cambio sea efectivo.`
                });
            } else {
                showToast('Perfil actualizado correctamente');
            }

            setProfileDialogVisible(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showAlert({
                    title: 'Error de Autenticación',
                    message: 'La contraseña actual es incorrecta o la sesión ha expirado.'
                });
            } else if (error.code === 'auth/operation-not-allowed') {
                showAlert({
                    title: 'Función Deshabilitada',
                    message: 'El cambio de correo debe habilitarse en la consola de Firebase (User Actions > Email address change).'
                });
            } else if (error.code === 'auth/invalid-new-email' || error.code === 'auth/invalid-email') {
                showAlert({
                    title: 'Correo Inválido',
                    message: 'El nuevo correo electrónico tiene un formato incorrecto.'
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
                <Chip mode="flat" style={{ marginTop: 5, backgroundColor: theme.colors.primaryContainer }}>
                    {user?.role === 'admingod' ? 'Modo: AdminGod 👑' : `Rol: ${user?.role}`}
                </Chip>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 5 }}>
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>Configuración</Text>
            </View>

            {renderProfileTab()}

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

                        <Divider style={{ marginVertical: 10 }} />
                        <Text variant="labelMedium" style={{ marginBottom: 5, color: theme.colors.primary }}>Verificación de Seguridad</Text>

                        <TextInput
                            label="Contraseña Actual"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.dialogInput}
                            placeholder="Necesaria para cambios sensibles"
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
                            Cambiar correo o contraseña requiere tu contraseña actual y verificación por correo.
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
