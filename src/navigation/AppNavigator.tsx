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
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
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
        </Stack.Navigator>
    );
}
