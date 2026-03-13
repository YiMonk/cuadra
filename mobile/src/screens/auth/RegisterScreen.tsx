import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, Text, useTheme, Surface, IconButton, Divider } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { UserService } from '../../services/user.service';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '208847202044-6p2j5q22354452264645224.apps.googleusercontent.com', // Placeholder
        iosClientId: '208847202044-ios-client-id.apps.googleusercontent.com', // Placeholder
        androidClientId: '208847202044-android-client-id.apps.googleusercontent.com', // Placeholder
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            setLoading(true);
            signInWithCredential(auth, credential)
                .then(async (userCredential) => {
                    await UserService.syncUserMetadata(userCredential.user.uid, {
                        id: userCredential.user.uid,
                        displayName: userCredential.user.displayName || 'Usuario Google',
                        email: userCredential.user.email || '',
                        role: 'admin', // Default to Admin (Store Owner)
                        ownerId: userCredential.user.uid, // Self-owned
                        active: true,
                        createdAt: Date.now()
                    });
                })
                .catch((error) => {
                    showAlert({ title: 'Error', message: 'No se pudo registrar con Google' });
                })
                .finally(() => setLoading(false));
        }
    }, [response]);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showToast('Todos los campos son obligatorios');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            showToast('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(userCredential.user, { displayName: name.trim() });

            // Sync with Firestore metadata
            await UserService.syncUserMetadata(userCredential.user.uid, {
                id: userCredential.user.uid,
                displayName: name.trim(),
                email: email.trim(),
                role: 'admin', // Default to Admin (Store Owner)
                ownerId: userCredential.user.uid, // Self-owned
                active: true,
                createdAt: Date.now()
            });

            // AuthContext takes over navigation
        } catch (error: any) {
            console.error(error);
            let message = 'Error en el registro';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este correo ya está registrado';
            }
            showAlert({ title: 'Error', message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        />
                        <Text variant="headlineMedium" style={styles.title}>Crear Cuenta</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            Únete a la plataforma para gestionar tu negocio
                        </Text>
                    </View>

                    <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <TextInput
                            label="Nombre Completo"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account-outline" />}
                            outlineColor={theme.colors.outlineVariant}
                        />

                        <TextInput
                            label="Correo Electrónico"
                            value={email}
                            onChangeText={setEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            left={<TextInput.Icon icon="email-outline" />}
                            outlineColor={theme.colors.outlineVariant}
                        />

                        <TextInput
                            label="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            left={<TextInput.Icon icon="lock-outline" />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            outlineColor={theme.colors.outlineVariant}
                        />

                        <TextInput
                            label="Confirmar Contraseña"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            mode="outlined"
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            left={<TextInput.Icon icon="lock-check-outline" />}
                            outlineColor={theme.colors.outlineVariant}
                        />

                        <Button
                            mode="contained"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.registerBtn}
                            contentStyle={{ height: 50 }}
                        >
                            Completar Registro
                        </Button>

                        <View style={styles.dividerContainer}>
                            <Divider style={styles.divider} />
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>O regístrate con</Text>
                            <Divider style={styles.divider} />
                        </View>

                        <Button
                            mode="outlined"
                            onPress={() => promptAsync()}
                            disabled={!request}
                            style={styles.googleBtn}
                            icon="google"
                        >
                            Google
                        </Button>
                    </Surface>

                    <View style={styles.footer}>
                        <Text variant="bodyMedium">¿Ya tienes una cuenta?</Text>
                        <Button
                            mode="text"
                            onPress={() => navigation.goBack()}
                            style={styles.loginBtn}
                        >
                            Iniciar Sesión
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 16,
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        marginLeft: -12,
        marginBottom: 16,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    formContainer: {
        padding: 24,
        borderRadius: 28,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    input: {
        marginBottom: 16,
    },
    registerBtn: {
        borderRadius: 12,
        marginTop: 8,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginBtn: {
        marginLeft: 4,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
        gap: 8,
    },
    divider: {
        flex: 1,
    },
    googleBtn: {
        borderRadius: 12,
    }
});
