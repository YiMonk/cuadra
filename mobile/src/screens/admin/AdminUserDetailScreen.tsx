import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
    Text,
    Card,
    Avatar,
    IconButton,
    useTheme,
    ActivityIndicator,
    Button,
    TextInput,
    Divider,
    List,
    Chip,
    Portal,
    Dialog,
    Paragraph
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { UserService, UserMetadata } from '../../services/user.service';
import { useNotifications } from '../../context/NotificationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Props = NativeStackScreenProps<AppStackParamList, 'AdminUserDetail'>;

export default function AdminUserDetailScreen({ route, navigation }: Props) {
    const { userId } = route.params;
    const theme = useTheme();
    const { showToast } = useNotifications();
    const [user, setUser] = useState<UserMetadata | null>(null);
    const [team, setTeam] = useState<UserMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editName, setEditName] = useState('');
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await UserService.getUserById(userId);
            if (userData) {
                setUser(userData);
                setEditName(userData.displayName);

                // If it's a shop admin, load their team
                if (userData.role === 'admin') {
                    const teamData = await UserService.getTeamMembers(userId);
                    // Filter out the owner if they appear in their own team query
                    setTeam(teamData.filter(m => m.id !== userId));
                }
            } else {
                showToast('Usuario no encontrado');
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await UserService.updateUser(userId, { displayName: editName });
            showToast('Perfil actualizado');
            setUser({ ...user, displayName: editName });
        } catch (error) {
            showToast('Error al actualizar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!user) return;
        try {
            const newStatus = !user.active;
            await UserService.updateUser(userId, { active: newStatus });
            setUser({ ...user, active: newStatus });
            showToast(newStatus ? 'Usuario activado' : 'Usuario bloqueado');
        } catch (error) {
            showToast('Error al cambiar estado');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!user) return null;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Profile */}
                <View style={styles.profileHeader}>
                    <Avatar.Text
                        size={80}
                        label={user.displayName.substring(0, 2).toUpperCase()}
                        style={{ backgroundColor: user.role === 'admin' ? (theme.dark ? '#1e2d3a' : '#E3F2FD') : (theme.dark ? '#2b2b2b' : '#F5F5F5') }}
                        color={user.role === 'admin' ? (theme.dark ? '#90CAF9' : '#1565C0') : (theme.dark ? '#E0E0E0' : '#757575')}
                    />
                    <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onSurface }]}>{user.displayName}</Text>
                    <Chip
                        style={[styles.roleChip, { backgroundColor: user.role === 'admin' ? (theme.dark ? '#1e2d3a' : '#E3F2FD') : (theme.dark ? '#2b2b2b' : '#f0f0f0') }]}
                        textStyle={{ color: user.role === 'admin' ? (theme.dark ? '#90CAF9' : '#1565C0') : (theme.dark ? '#E0E0E0' : '#666'), fontWeight: 'bold' }}
                    >
                        {user.role.toUpperCase()}
                    </Chip>
                </View>

                {/* Main Info Card */}
                <Card style={styles.card} mode="elevated">
                    <Card.Content>
                        <TextInput
                            label="Nombre Completo"
                            value={editName}
                            onChangeText={setEditName}
                            mode="outlined"
                            style={styles.input}
                        />
                        <View style={styles.infoRow}>
                            <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Email:</Text>
                            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>{user.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Fecha Registro:</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                {format(user.createdAt, "dd 'de' MMMM, yyyy", { locale: es })}
                            </Text>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleUpdateUser}
                            loading={saving}
                            style={styles.saveButton}
                        >
                            Guardar Cambios
                        </Button>
                    </Card.Content>
                </Card>

                {/* Status Section */}
                <Card style={[styles.card, { backgroundColor: user.active ? (theme.dark ? '#1b2e1e' : '#E8F5E9') : (theme.dark ? '#3a1e1e' : '#FFEBEE') }]} mode="contained">
                    <Card.Content style={styles.statusContent}>
                        <View style={{ flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: user.active ? (theme.dark ? '#A5D6A7' : '#1B5E20') : (theme.dark ? '#EF9A9A' : '#C62828') }}>
                                Estado: {user.active ? 'Activo' : 'Bloqueado'}
                            </Text>
                            <Text variant="bodySmall" style={{ color: user.active ? (theme.dark ? '#81C784' : '#2E7D32') : (theme.dark ? '#E57373' : '#D32F2F') }}>
                                {user.active ? 'El usuario puede acceder al sistema.' : 'El acceso está restringido.'}
                            </Text>
                        </View>
                        <Button
                            mode="contained"
                            onPress={handleToggleStatus}
                            buttonColor={user.active ? theme.colors.error : '#2E7D32'}
                        >
                            {user.active ? 'Bloquear' : 'Activar'}
                        </Button>
                    </Card.Content>
                </Card>

                {/* Team Section (Only for Admins) */}
                {user.role === 'admin' && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text variant="titleLarge" style={styles.sectionTitle}>Usuarios de su Tienda</Text>
                            <Chip compact style={styles.countChip}>{team.length}</Chip>
                        </View>

                        {team.length === 0 ? (
                            <Card style={[styles.emptyCard, { borderColor: theme.colors.outlineVariant }]} mode="outlined">
                                <Card.Content style={styles.centered}>
                                    <IconButton icon="account-group-outline" size={40} iconColor={theme.colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
                                    <Text style={{ opacity: 0.5, color: theme.colors.onSurfaceVariant }}>Esta tienda aún no tiene vendedores.</Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            team.map(member => (
                                <List.Item
                                    key={member.id}
                                    title={member.displayName}
                                    titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                                    description={member.email}
                                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                                    style={[styles.memberItem, { backgroundColor: theme.colors.surface }]}
                                    left={props => <Avatar.Text {...props} size={40} label={member.displayName.substring(0, 1)} style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />}
                                    right={props => (
                                        <View style={{ justifyContent: 'center' }}>
                                            <Chip
                                                compact
                                                textStyle={{ fontSize: 10, color: member.active ? (theme.dark ? '#A5D6A7' : '#1B5E20') : (theme.dark ? '#EF9A9A' : '#C62828') }}
                                                style={{ backgroundColor: member.active ? (theme.dark ? '#1b2e1e' : '#E8F5E9') : (theme.dark ? '#3a1e1e' : '#FFEBEE') }}
                                            >
                                                {member.active ? 'ACTIVO' : 'OFF'}
                                            </Chip>
                                        </View>
                                    )}
                                    onPress={() => navigation.push('AdminUserDetail', { userId: member.id })}
                                />
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 25,
    },
    userName: {
        fontWeight: '900',
        marginTop: 10,
        textAlign: 'center',
    },
    roleChip: {
        marginTop: 5,
        borderRadius: 20,
    },
    card: {
        marginBottom: 20,
        borderRadius: 20,
    },
    input: {
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontWeight: 'bold',
        opacity: 0.5,
    },
    saveButton: {
        marginTop: 15,
        borderRadius: 12,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    sectionTitle: {
        fontWeight: '900',
        marginRight: 10,
    },
    countChip: {
        backgroundColor: '#eee',
    },
    emptyCard: {
        borderRadius: 20,
        borderStyle: 'dashed',
    },
    memberItem: {
        marginBottom: 8,
        borderRadius: 12,
    },
    memberActions: {
        flexDirection: 'row',
    }
});
