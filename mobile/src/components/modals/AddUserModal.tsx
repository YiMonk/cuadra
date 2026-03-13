import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, useTheme, Card, RadioButton, ActivityIndicator } from 'react-native-paper';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, createUserWithEmailAndPassword, updateProfile, signOut as signOff } from 'firebase/auth';
import { UserService } from '../../services/user.service';
import { useAuth } from '../../context/AuthContext';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onUserCreated: () => void;
}

// Config reused for the secondary app
const firebaseConfig = {
    apiKey: "AIzaSyD_jNJs7O6jevUsJiSg4cSD_WeaxS5NxVA",
    authDomain: "cuadra-bf832.firebaseapp.com",
    projectId: "cuadra-bf832",
    storageBucket: "cuadra-bf832.firebasestorage.app",
    messagingSenderId: "208847202044",
    appId: "1:208847202044:web:46803c98dccdb5307d9979",
    measurementId: "G-VKVPWXTJKZ"
};

export default function AddUserModal({ visible, onDismiss, onUserCreated }: Props) {
    const theme = useTheme();
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'staff'>('staff');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateUser = async () => {
        if (!name || !email || !password) {
            setError('Todos los campos son obligatorios');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Initialize a secondary Firebase app to avoid logging out the current admin
            const secondaryAppName = `secondary-app-${Date.now()}`;
            const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            // Use initializeAuth with no persistence to avoid warnings on React Native
            const secondaryAuth = initializeAuth(secondaryApp, {});

            // 2. Create the user
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            // 3. Update the profile (Display Name)
            await updateProfile(newUser, { displayName: name });

            // 4. Sync metadata in Firestore (using the primary DB instance is fine)
            await UserService.syncUserMetadata(newUser.uid, {
                id: newUser.uid,
                displayName: name,
                email: email,
                role: role,
                active: true,
                ownerId: user?.uid, // The admin who created this user
                createdAt: Date.now()
            });

            // 5. Sign out from the secondary app and clean up
            await signOff(secondaryAuth);
            // We don't delete the app instance as it's not strictly necessary in JS SDK, 
            // and we used a unique name.

            onUserCreated();
            handleDismiss();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'No se pudo crear el usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setName('');
        setEmail('');
        setPassword('');
        setRole('staff');
        setError('');
        onDismiss();
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={styles.container}>
                <Card style={{ backgroundColor: theme.colors.surface }}>
                    <Card.Title title="Agregar Nuevo Usuario" subtitle="Registrar personal" />
                    <Card.Content>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Nombre Completo"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Correo Electrónico"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />

                        <TextInput
                            label="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry
                            style={styles.input}
                        />

                        {/* Role is automatically assigned as Staff (Seller) for team members */}
                        <Text variant="bodySmall" style={{ marginTop: 10, color: theme.colors.outline }}>
                            El usuario será registrado como Vendedor / Staff vinculado a tu cuenta.
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={handleDismiss} disabled={loading}>Cancelar</Button>
                        <Button
                            mode="contained"
                            onPress={handleCreateUser}
                            loading={loading}
                            disabled={loading}
                        >
                            Crear Usuario
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
