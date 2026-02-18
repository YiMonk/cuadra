import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tooltip, useTheme, Surface, TouchableRipple, FAB, Portal } from 'react-native-paper';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';

// Screens
import ClientListScreen from '../screens/clients/ClientListScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import CollectionsScreen from '../screens/collections/CollectionsScreen';
import SalesScreen from '../screens/pos/SalesScreen';
import ProductListScreen from '../screens/inventory/ProductListScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SalesHistoryScreen from '../screens/pos/SalesHistoryScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="POS"
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
        >
            <Tab.Screen
                name="Clients"
                component={ClientListScreen as any}
                options={{
                    tabBarLabel: 'Clientes',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="account-group" {...props} />,
                }}
            />
            <Tab.Screen
                name="ReportsTab"
                component={ReportsScreen as any}
                options={{
                    tabBarLabel: 'Reportes',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="chart-box-outline" {...props} />,
                }}
            />
            <Tab.Screen
                name="SalesHistoryFull"
                component={SalesHistoryScreen as any}
                options={{
                    tabBarLabel: 'Historial',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="history" {...props} />,
                }}
            />
            <Tab.Screen
                name="Collections"
                component={CollectionsScreen as any}
                options={{
                    tabBarLabel: 'Cobranzas',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="wallet-outline" {...props} />,
                }}
            />
            <Tab.Screen
                name="POS"
                component={SalesScreen as any}
                options={{
                    tabBarLabel: 'Nueva Venta',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="cart-plus" {...props} />,
                }}
            />
            <Tab.Screen
                name="Inventory"
                component={ProductListScreen as any}
                options={{
                    tabBarLabel: 'Inventario',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="package-variant-closed" {...props} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen as any}
                options={{
                    tabBarLabel: 'Configuración',
                    tabBarIcon: (props: any) => <MaterialCommunityIcons name="cog-outline" {...props} />,
                }}
            />
        </Tab.Navigator>
    );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const theme = useTheme();
    const tabWidth = width / state.routes.length;

    // Animation for the indicator position
    const animation = useRef(new Animated.Value(state.index)).current;
    // Animation for the label visibility
    const labelOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slide the circle
        Animated.spring(animation, {
            toValue: state.index,
            useNativeDriver: true,
            friction: 8,
            tension: 50,
        }).start();

        // Show and then hide the label
        labelOpacity.setValue(0);
        Animated.sequence([
            Animated.timing(labelOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(labelOpacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [state.index]);

    const translateX = animation.interpolate({
        inputRange: state.routes.map((_: any, i: number) => i),
        outputRange: state.routes.map((_: any, i: number) => i * tabWidth),
    });

    const tooltipLabels: Record<string, string> = {
        Clients: 'Clientes',
        ReportsTab: 'Reportes',
        SalesHistoryFull: 'Historial',
        Collections: 'Cobranzas',
        POS: 'Nueva Venta',
        Inventory: 'Inventario',
        Settings: 'Ajustes'
    };

    return (
        <View style={styles.tabBarContainer}>
            {/* The Main Bar Background with Elevation */}
            <Surface style={[styles.barBackground, { backgroundColor: theme.colors.surface }]} elevation={4}>
                <View style={{ flex: 1 }} />
            </Surface>

            {/* Animated Active Indicator & Label */}
            <Animated.View
                style={[
                    styles.animatedIndicatorContainer,
                    {
                        width: tabWidth,
                        transform: [{ translateX }],
                    }
                ]}
            >
                {/* Temporary Label */}
                <Animated.View style={[styles.labelWrapper, { opacity: labelOpacity }]}>
                    <View style={styles.labelContainer}>
                        <Animated.Text style={[styles.labelText, { color: theme.colors.onBackground }]}>
                            {tooltipLabels[state.routes[state.index].name] || state.routes[state.index].name}
                        </Animated.Text>
                    </View>
                </Animated.View>

                <Surface style={[styles.activeCircle, { backgroundColor: theme.colors.primary }]} elevation={5}>
                    {descriptors[state.routes[state.index].key].options.tabBarIcon &&
                        descriptors[state.routes[state.index].key].options.tabBarIcon!({
                            focused: true,
                            color: 'white',
                            size: 30
                        })}
                </Surface>
            </Animated.View>

            <View style={styles.tabsRow}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const label = tooltipLabels[route.name] || route.name;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Tooltip title={label} key={route.key}>
                            <View style={[styles.tabItem, { width: tabWidth }]}>
                                <TouchableRipple
                                    onPress={onPress}
                                    style={styles.rippleArea}
                                    borderless
                                    rippleColor="rgba(255, 255, 255, 0.1)"
                                >
                                    <View style={styles.iconContainer}>
                                        {!isFocused && options.tabBarIcon &&
                                            options.tabBarIcon({
                                                focused: false,
                                                color: theme.colors.onSurfaceVariant,
                                                size: 26 // Slightly larger for better detail
                                            })
                                        }
                                    </View>
                                </TouchableRipple>
                            </View>
                        </Tooltip>
                    );
                })}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140, // Increased height for the labels
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    barBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 75, // Slightly taller for better icon centering
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
    },
    tabsRow: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        height: 75,
        width: '100%',
        alignItems: 'center', // Center icons vertically in the bar
    },
    tabItem: {
        height: 75,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rippleArea: {
        width: 56, // Circular ripple for icons
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedIndicatorContainer: {
        position: 'absolute',
        top: 0,
        height: 140,
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 1,
    },
    labelWrapper: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
        width: 150,
    },
    labelContainer: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    labelText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    activeCircle: {
        width: 68, // Slightly larger circle
        height: 68,
        borderRadius: 34,
        marginTop: 40, // Space for the label
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
});
