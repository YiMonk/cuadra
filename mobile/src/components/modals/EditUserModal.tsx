import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, useTheme, Card, RadioButton } from 'react-native-paper';
import { UserService, UserMetadata } from '../../services/user.service';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    user: UserMetadata | null;
    onUserUpdated: () => void;
}

export default function EditUserModal({ visible, onDismiss, user, onUserUpdated }: Props) {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'staff'>('staff');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            setRole(user.role || 'staff');
        }
    }, [user]);

    const handleUpdateUser = async () => {
        if (!user) return;
        if (!name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Update Firestore Metadata
            await UserService.updateUser(user.id, {
                displayName: name.trim(),
                role: role
            });

            onUserUpdated();
            handleDismiss();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'No se pudo actualizar el usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user || !user.email) return;
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, user.email);
            alert(`Se ha enviado un correo de restablecimiento de contraseña a ${user.email}`);
        } catch (error: any) {
            console.error(error);
            alert('Error al enviar el correo: ' + error.message);
        }
    };

    const handleDisableUser = async () => {
        if (!user) return;
        // Logic to deactivate user in metadata
        try {
            await UserService.updateUser(user.id, {
                active: !user.active // Toggle
            });
            onUserUpdated();
            handleDismiss();
        } catch (err: any) {
            console.error(err);
            setError('Error al cambiar estado del usuario');
        }
    };

    const handleDismiss = () => {
        setError('');
        onDismiss();
    };

    if (!user) return null;

    return (
        <Portal>
            <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={styles.container}>
                <Card style={{ backgroundColor: theme.colors.surface }}>
                    <Card.Title title="Editar Usuario" subtitle={user.email} />
                    <Card.Content>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Nombre Completo"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                        />

                        <Text variant="titleSmall" style={{ marginTop: 10 }}>Rol del Usuario</Text>
                        <RadioButton.Group onValueChange={value => setRole(value as any)} value={role}>
                            <View style={styles.radioRow}>
                                <RadioButton value="staff" />
                                <Text>Vendedor / Staff</Text>
                            </View>
                            <View style={styles.radioRow}>
                                <RadioButton value="admin" />
                                <Text>Administrador</Text>
                            </View>
                        </RadioButton.Group>

                        <Button
                            mode="text"
                            icon="email-lock"
                            onPress={handleResetPassword}
                            style={{ marginTop: 10, alignSelf: 'flex-start' }}
                        >
                            Restablecer Contraseña
                        </Button>

                        <Button
                            mode="text"
                            icon={user.active ? "account-off" : "account-check"}
                            onPress={handleDisableUser}
                            textColor={user.active ? theme.colors.error : theme.colors.primary}
                            style={{ marginTop: 5, alignSelf: 'flex-start' }}
                        >
                            {user.active ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                        </Button>

                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={handleDismiss} disabled={loading}>Cancelar</Button>
                        <Button
                            mode="contained"
                            onPress={handleUpdateUser}
                            loading={loading}
                            disabled={loading}
                        >
                            Guardar Cambios
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
        marginBottom: 10,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
