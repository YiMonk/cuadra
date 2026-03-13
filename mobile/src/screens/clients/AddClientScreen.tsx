import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ClientService } from '../../services/client.service';
import { useNotifications } from '../../context/NotificationContext';

type Props = NativeStackScreenProps<AppStackParamList, 'AddClient'>; // Defaulting type for now

export default function AddClientScreen({ navigation }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !phone) {
            showAlert({ title: 'Campo requerido', message: 'Nombre y Teléfono son requeridos' });
            return;
        }

        setLoading(true);
        try {
            await ClientService.addClient({
                name,
                phone,
            });
            showToast('Cliente guardado con éxito');
            navigation.goBack();
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo guardar el cliente' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Title style={[styles.title, { color: theme.colors.onBackground }]}>Nuevo Cliente</Title>

            <TextInput
                label="Nombre"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />

            <TextInput
                label="Teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />

            <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
            >
                Guardar Cliente
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    }
});
