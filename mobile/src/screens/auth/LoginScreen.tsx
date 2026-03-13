import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, TextInput, Text, useTheme, Surface, Divider } from 'react-native-paper';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { UserService } from '../../services/user.service';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                    // Sync user metadata on Google Login
                    await UserService.syncUserMetadata(userCredential.user.uid, {
                        id: userCredential.user.uid,
                        displayName: userCredential.user.displayName || 'Usuario Google',
                        email: userCredential.user.email || '',
                        role: 'staff',
                        active: true,
                        createdAt: Date.now()
                    });
                })
                .catch((error) => {
                    showAlert({ title: 'Error', message: 'No se pudo iniciar sesión con Google' });
                })
                .finally(() => setLoading(false));
        }
    }, [response]);

    const handleLogin = async () => {
        if (!email || !password) {
            showToast('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const userMeta = await UserService.getUserById(userCredential.user.uid);

            if (userMeta) {
                if (!userMeta.active) {
                    await auth.signOut();
                    showAlert({
                        title: 'Cuenta Bloqueada',
                        message: 'Tu cuenta ha sido deshabilitada. Por favor comunícate con el equipo de soporte.'
                    });
                    return;
                }

                if (userMeta.role === 'staff' && userMeta.ownerId) {
                    const owner = await UserService.getUserById(userMeta.ownerId);
                    if (owner && !owner.active) {
                        await auth.signOut();
                        showAlert({
                            title: 'Cuenta Principal Suspendida',
                            message: 'La cuenta principal de tu negocio ha sido suspendida. No puedes acceder al sistema.'
                        });
                        return;
                    }
                }
            }
        } catch (error: any) {
            let message = 'Ocurrió un error al iniciar sesión';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Correo o contraseña incorrectos';
            } else if (error.code === 'auth/invalid-email') {
                message = 'El formato del correo es inválido';
            }
            showAlert({ title: 'Error', message });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            showAlert({
                title: 'Correo requerido',
                message: 'Ingresa tu correo en el campo superior para enviarte instrucciones de recuperación.'
            });
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());
            showAlert({
                title: 'Correo Enviado',
                message: 'Revisa tu bandeja de entrada para restablecer tu contraseña.'
            });
        } catch (error: any) {
            showAlert({ title: 'Error', message: 'No se pudo enviar el correo de recuperación' });
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
                        <Surface style={styles.logoContainer} elevation={4}>
                            <Image
                                source={require('../../../assets/icon.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </Surface>
                        <Text variant="headlineMedium" style={styles.appName}>Cuadra</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            Gestiona tus ventas de forma simple
                        </Text>
                    </View>

                    <Surface style={[styles.formContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
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

                        <Button
                            mode="text"
                            onPress={handleResetPassword}
                            style={styles.forgotBtn}
                            labelStyle={{ fontSize: 13 }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.loginBtn}
                            contentStyle={{ height: 50 }}
                        >
                            Iniciar Sesión
                        </Button>

                        <View style={styles.dividerContainer}>
                            <Divider style={styles.divider} />
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>O continúa con</Text>
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
                        <Text variant="bodyMedium">¿Aún no tienes cuenta?</Text>
                        <Button
                            mode="outlined"
                            onPress={() => navigation.navigate('Register')}
                            style={styles.registerBtn}
                        >
                            Crear una cuenta
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    appName: {
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
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
    },
    loginBtn: {
        borderRadius: 12,
        marginTop: 8,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        gap: 8,
    },
    registerBtn: {
        width: '100%',
        maxWidth: 200,
        borderRadius: 12,
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
