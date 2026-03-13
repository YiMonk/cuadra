import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme, Surface, IconButton, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';

export default function MenuScreen() {
    const theme = useTheme();
    const navigation = useNavigation();
    const { user } = useAuth();

    const menuItems = user?.role === 'admingod' ? [
        {
            title: 'AdminGod Panel',
            icon: 'shield-crown',
            route: 'AdminGodDashboard',
            color: '#D32F2F',
            description: 'Control Maestro del Sistema'
        },
        {
            title: 'Gestión de Usuarios',
            icon: 'account-multiple-check',
            route: 'AdminUserManagement',
            color: '#4CAF50',
            description: 'Administrar todas las cuentas'
        },
        {
            title: 'Configuración',
            icon: 'cog-outline',
            route: 'Settings',
            color: '#607D8B',
            description: 'Opciones de la app'
        }
    ] : [
        {
            title: 'Reportes',
            icon: 'chart-box-outline',
            route: 'ReportsTab',
            color: '#4CAF50',
            description: 'Ventas y rendimientos'
        },
        {
            title: 'Historial',
            icon: 'history',
            route: 'SalesHistoryFull',
            color: '#2196F3',
            description: 'Registro de transacciones'
        },
        {
            title: 'Cobranzas',
            icon: 'wallet-outline',
            route: 'Collections',
            color: '#FF9800',
            description: 'Gestión de deudas'
        },
        {
            title: 'Categorías',
            icon: 'shape-outline',
            route: 'Categories',
            color: '#795548',
            description: 'Gestionar catálogo'
        },
        // Only Store Admins can see Team Management
        ...(user?.role === 'admin' ? [{
            title: 'Mi Equipo',
            icon: 'account-group',
            route: 'Team',
            color: '#9C27B0',
            description: 'Gestionar usuarios y roles'
        }] : []),
        {
            title: 'Configuración',
            icon: 'cog-outline',
            route: 'Settings',
            color: '#607D8B',
            description: 'Opciones de la app'
        }
    ];

    const renderMenuItem = (item: any) => (
        <TouchableOpacity
            key={item.title}
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate(item.route as never)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
            </View>
            <View style={styles.textContainer}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{item.title}</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>Menú</Text>
            </View>

            <View style={styles.profileSection}>
                <Avatar.Text
                    size={50}
                    label={user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                />
                <View style={{ marginLeft: 15 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{user?.displayName || 'Usuario'}</Text>
                    <Text variant="bodySmall">{user?.email}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {menuItems.map(renderMenuItem)}

                <View style={styles.versionContainer}>
                    <Text variant="labelSmall" style={{ color: theme.colors.outline }}>Cuadra App v1.1.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    grid: {
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        elevation: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    }
});
