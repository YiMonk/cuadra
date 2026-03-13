import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import AddProductScreen from '../screens/inventory/AddProductScreen';
import AddClientScreen from '../screens/clients/AddClientScreen';
import ClientProfileScreen from '../screens/clients/ClientProfileScreen';
import CheckoutScreen from '../screens/pos/CheckoutScreen';
import SalesHistoryScreen from '../screens/pos/SalesHistoryScreen';
import SaleDetailScreen from '../screens/pos/SaleDetailScreen';
import SimulationScreen from '../screens/debug/SimulationScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import CollectionsScreen from '../screens/collections/CollectionsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import TeamScreen from '../screens/settings/TeamScreen';
import CategoryListScreen from '../screens/inventory/CategoryListScreen';
import AdminGodDashboardScreen from '../screens/admin/AdminGodDashboardScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
    const { user } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            {user?.role === 'admingod' && (
                <>
                    <Stack.Screen
                        name="AdminGodDashboard"
                        component={AdminGodDashboardScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="AdminUserManagement"
                        component={AdminUserManagementScreen}
                        options={{ headerShown: true, title: 'Gestión de Usuarios' }}
                    />
                    <Stack.Screen
                        name="AdminUserDetail"
                        component={AdminUserDetailScreen}
                        options={{ headerShown: true, title: 'Detalle de Usuario' }}
                    />
                </>
            )}
            <Stack.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ headerShown: true, title: 'Nuevo Producto' }}
            />
            <Stack.Screen
                name="AddClient"
                component={AddClientScreen}
                options={{ headerShown: true, title: 'Nuevo Cliente' }}
            />
            <Stack.Screen
                name="ClientProfile"
                component={ClientProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ headerShown: true, title: 'Cobrar' }}
            />
            <Stack.Screen
                name="SaleDetail"
                component={SaleDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Simulation"
                component={SimulationScreen}
                options={{ headerShown: true, title: 'Simulación del Sistema' }}
            />
            <Stack.Screen
                name="SalesHistoryFull"
                component={SalesHistoryScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ReportsTab"
                component={ReportsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Collections"
                component={CollectionsScreen}
                options={{ headerShown: true, title: 'Cobranzas' }}
            />
            <Stack.Screen
                name="Team"
                component={TeamScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Categories"
                component={CategoryListScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
