import React, { createContext, useContext, useState, useCallback } from 'react';
import { Portal, Dialog, Button, Text, Snackbar, useTheme } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

interface AlertOptions {
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

interface NotificationContextType {
    showAlert: (options: AlertOptions) => void;
    showToast: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme();

    // Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertOptions, setAlertOptions] = useState<AlertOptions>({
        title: '',
        message: '',
    });

    // Snackbar State
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showAlert = useCallback((options: AlertOptions) => {
        setAlertOptions(options);
        setAlertVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setAlertVisible(false);
    }, []);

    const handleConfirm = useCallback(() => {
        hideAlert();
        if (alertOptions.onConfirm) {
            alertOptions.onConfirm();
        }
    }, [alertOptions, hideAlert]);

    const showToast = useCallback((message: string) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    }, []);

    const hideToast = useCallback(() => {
        setSnackbarVisible(false);
    }, []);

    return (
        <NotificationContext.Provider value={{ showAlert, showToast }}>
            {children}

            {/* Custom Styled Dialog */}
            <Portal>
                <Dialog
                    visible={alertVisible}
                    onDismiss={hideAlert}
                    style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
                >
                    <Dialog.Title style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                        {alertOptions.title}
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                            {alertOptions.message}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        {alertOptions.showCancel && (
                            <Button onPress={hideAlert} textColor={theme.colors.secondary}>
                                {alertOptions.cancelText || 'Cancelar'}
                            </Button>
                        )}
                        <Button
                            onPress={handleConfirm}
                            mode="contained"
                            style={styles.confirmBtn}
                        >
                            {alertOptions.confirmText || 'Aceptar'}
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Custom Styled Snackbar */}
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={hideToast}
                    duration={3000}
                    action={{
                        label: 'OK',
                        onPress: hideToast,
                    }}
                    style={[styles.snackbar, { backgroundColor: theme.colors.inverseSurface }]}
                >
                    {snackbarMessage}
                </Snackbar>
            </Portal>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 24,
        padding: 8,
    },
    confirmBtn: {
        borderRadius: 12,
        marginLeft: 8,
    },
    snackbar: {
        marginBottom: 100, // Show above the floating nav bar
        borderRadius: 12,
    }
});
