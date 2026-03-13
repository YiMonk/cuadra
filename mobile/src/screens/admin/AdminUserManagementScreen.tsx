import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Avatar, IconButton, useTheme, Searchbar, Chip, ActivityIndicator, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserService, UserMetadata } from '../../services/user.service';
import { useNotifications } from '../../context/NotificationContext';
import { AppStackParamList } from '../../navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'AdminUserManagement'>;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        elevation: 2,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    titleText: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    searchbar: {
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 15,
        height: 45,
    },
    filterTabs: {
        marginBottom: 8,
    },
    filterScroll: {
        paddingHorizontal: 15,
        gap: 10,
    },
    filterChip: {
        borderRadius: 15,
        borderWidth: 0,
        height: 34,
    },
    chipText: {
        fontSize: 12,
    },
    listContent: {
        padding: 15,
        paddingBottom: 40,
    },
    userCard: {
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    chip: {
        height: 22,
        justifyContent: 'center',
    },
    actions: {
        flexDirection: 'row',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
});

const UserListItem = ({ item, navigation, user }: { item: UserMetadata, navigation: any, user: any }) => {
    const theme = useTheme();
    return (
        <Card
            style={[styles.userCard, { opacity: item.active ? 1 : 0.6 }]}
            mode="elevated"
            elevation={1}
        >
            <TouchableRipple
                onPress={() => {
                    navigation.navigate('AdminUserDetail', { userId: item.id });
                }}
                rippleColor="rgba(0,0,0,0.05)"
            >
                <View style={styles.cardContent}>
                    <Avatar.Text
                        size={45}
                        label={item.displayName.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: item.role === 'admin' ? '#E3F2FD' : '#F5F5F5' }}
                        color={item.role === 'admin' ? '#1565C0' : '#757575'}
                    />
                    <View style={styles.userInfo}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{item.displayName}</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.5 }}>{item.email}</Text>
                        <View style={styles.badgeRow}>
                            <Chip
                                compact
                                style={[styles.chip, { backgroundColor: item.role === 'admin' ? '#E3F2FD' : '#f0f0f0' }]}
                                textStyle={{ fontSize: 10, color: item.role === 'admin' ? '#1565C0' : '#666', fontWeight: 'bold' }}
                                mode="flat"
                            >
                                {item.role === 'admin' ? 'TIENDA' : item.role === 'admingod' ? 'ADMGOD' : 'STAFF'}
                            </Chip>
                            {item.id === user?.uid && (
                                <Chip
                                    compact
                                    style={[styles.chip, { backgroundColor: '#FFF9C4' }]}
                                    textStyle={{ fontSize: 10, color: '#FBC02D', fontWeight: 'bold' }}
                                >
                                    TU CUENTA
                                </Chip>
                            )}
                            {!item.active && (
                                <Chip
                                    compact
                                    style={[styles.chip, { backgroundColor: '#FFEBEE' }]}
                                    textStyle={{ fontSize: 10, color: '#C62828', fontWeight: 'bold' }}
                                >
                                    BLOQUEADO
                                </Chip>
                            )}
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <IconButton icon="chevron-right" size={24} />
                    </View>
                </View>
            </TouchableRipple>
        </Card>
    );
};

export default function AdminUserManagementScreen({ navigation }: Props) {
    const { user } = useAuth();
    const theme = useTheme();
    const { showToast } = useNotifications();
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admingod' | 'admin' | 'staff'>('all');

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadUsers();
        });
        return unsubscribe;
    }, [navigation]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesQuery =
                user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;

            return matchesQuery && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
            <View style={[styles.header, { backgroundColor: theme.colors.elevation.level2, borderBottomColor: theme.colors.outlineVariant }]}>
                <View style={styles.headerTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {navigation.canGoBack() && (
                            <IconButton icon="arrow-left-circle" iconColor={theme.colors.onSurfaceVariant} size={28} onPress={() => navigation.goBack()} />
                        )}
                        <Text variant="headlineSmall" style={[styles.titleText, { color: theme.colors.onSurface }]}>
                            Directorio Usuarios
                        </Text>
                    </View>
                    <IconButton icon="refresh-circle" iconColor={theme.colors.primary} size={28} onPress={loadUsers} />
                </View>
                <Searchbar
                    placeholder="Buscar por nombre o email..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchbar, { backgroundColor: theme.colors.surfaceVariant }]}
                    elevation={0}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    iconColor={theme.colors.onSurfaceVariant}
                    inputStyle={{ color: theme.colors.onSurface }}
                />
                <View style={styles.filterTabs}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <Chip
                            selected={roleFilter === 'all'}
                            onPress={() => setRoleFilter('all')}
                            style={[styles.filterChip, { backgroundColor: theme.colors.surface }, roleFilter === 'all' && { backgroundColor: theme.colors.primaryContainer }]}
                            showSelectedOverlay={false}
                            textStyle={[styles.chipText, { color: theme.colors.onSurfaceVariant }, roleFilter === 'all' && { color: theme.colors.primary, fontWeight: 'bold' }]}
                        >Todos</Chip>
                        <Chip
                            selected={roleFilter === 'admin'}
                            onPress={() => setRoleFilter('admin')}
                            style={[styles.filterChip, { backgroundColor: theme.colors.surface }, roleFilter === 'admin' && { backgroundColor: theme.dark ? '#1e2d3a' : '#E3F2FD' }]}
                            showSelectedOverlay={false}
                            textStyle={[styles.chipText, { color: theme.colors.onSurfaceVariant }, roleFilter === 'admin' && { color: theme.dark ? '#90CAF9' : '#1565C0', fontWeight: 'bold' }]}
                        >Tiendas</Chip>
                        <Chip
                            selected={roleFilter === 'staff'}
                            onPress={() => setRoleFilter('staff')}
                            style={[styles.filterChip, { backgroundColor: theme.colors.surface }, roleFilter === 'staff' && { backgroundColor: theme.dark ? '#2b2b2b' : '#F5F5F5' }]}
                            showSelectedOverlay={false}
                            textStyle={[styles.chipText, { color: theme.colors.onSurfaceVariant }, roleFilter === 'staff' && { color: theme.dark ? '#E0E0E0' : '#616161', fontWeight: 'bold' }]}
                        >Vendedores</Chip>
                        <Chip
                            selected={roleFilter === 'admingod'}
                            onPress={() => setRoleFilter('admingod')}
                            style={[styles.filterChip, { backgroundColor: theme.colors.surface }, roleFilter === 'admingod' && { backgroundColor: theme.dark ? '#2d1e3a' : '#F3E5F5' }]}
                            showSelectedOverlay={false}
                            textStyle={[styles.chipText, { color: theme.colors.onSurfaceVariant }, roleFilter === 'admingod' && { color: theme.dark ? '#CE93D8' : '#7B1FA2', fontWeight: 'bold' }]}
                        >AdminGods</Chip>
                    </ScrollView>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={({ item }) => <UserListItem item={item} navigation={navigation} user={user} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <IconButton icon="account-search-outline" size={60} style={{ opacity: 0.2 }} />
                            <Text style={{ opacity: 0.5 }}>No se encontraron usuarios</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
