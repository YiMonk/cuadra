import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Portal, Modal, Text, useTheme, IconButton } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import { ClientService } from '../../services/client.service';
import { useNotifications } from '../../context/NotificationContext';

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSuccess?: (clientId: string) => void;
}

export default function ClientFormModal({ visible, onDismiss, onSuccess }: Props) {
    const theme = useTheme();
    const { showAlert, showToast } = useNotifications();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleImportContact = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
                });

                if (data.length > 0) {
                    const contact = await Contacts.presentContactPickerAsync();
                    if (contact && contact.name) {
                        setName(contact.name);
                        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                            // Take the first phone number and clean it (remove spaces, dashes)
                            const rawPhone = contact.phoneNumbers[0].number || '';
                            const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
                            setPhone(cleanPhone);
                        }
                    }
                } else {
                    showAlert({ title: 'Sin contactos', message: 'No se encontraron contactos en el teléfono.' });
                }
            } else {
                showAlert({ title: 'Permiso denegado', message: 'Necesitamos permiso para acceder a tus contactos.' });
            }
        } catch (error) {
            console.error(error);
            showToast('No se pudo abrir el selector de contactos');
        }
    };

    const handleSave = async () => {
        if (!name || !phone) {
            showAlert({ title: 'Atención', message: 'Nombre y teléfono son obligatorios.' });
            return;
        }

        setLoading(true);
        try {
            const clientId = await ClientService.addClient({
                name,
                phone,
            });
            showToast('Cliente registrado con éxito');
            setName('');
            setPhone('');
            if (onSuccess) onSuccess(clientId);
            onDismiss();
        } catch (error) {
            console.error(error);
            showAlert({ title: 'Error', message: 'No se pudo registrar el cliente.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface }
                ]}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Nuevo Cliente</Text>
                            <IconButton icon="close" onPress={onDismiss} />
                        </View>

                        <View style={styles.form}>
                            <Button
                                mode="outlined"
                                icon="contacts"
                                onPress={handleImportContact}
                                style={styles.importBtn}
                            >
                                Importar de Contactos
                            </Button>

                            <Text variant="labelSmall" style={styles.dividerText}>O COMPLETA MANUALLY</Text>

                            <TextInput
                                label="Nombre Completo"
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={styles.input}
                                placeholder="Ej: Juan Pérez"
                                left={<TextInput.Icon icon="account" />}
                            />

                            <TextInput
                                label="Teléfono"
                                value={phone}
                                onChangeText={setPhone}
                                mode="outlined"
                                style={styles.input}
                                keyboardType="phone-pad"
                                placeholder="Ej: 04121234567"
                                left={<TextInput.Icon icon="phone" />}
                            />

                            <Button
                                mode="contained"
                                onPress={handleSave}
                                loading={loading}
                                disabled={loading}
                                style={styles.saveBtn}
                                contentStyle={{ height: 48 }}
                            >
                                Registrar Cliente
                            </Button>

                            <Button
                                mode="text"
                                onPress={() => {
                                    onDismiss();
                                }}
                                style={{ marginTop: 8 }}
                            >
                                Volver
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        margin: 20,
        padding: 24,
        borderRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    form: {
        gap: 12,
    },
    importBtn: {
        borderRadius: 12,
        marginBottom: 4,
    },
    dividerText: {
        textAlign: 'center',
        opacity: 0.5,
        marginVertical: 4,
    },
    input: {
        backgroundColor: 'transparent',
    },
    saveBtn: {
        marginTop: 8,
        borderRadius: 12,
    }
});
