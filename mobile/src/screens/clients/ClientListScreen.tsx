import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { List, FAB, Text, ActivityIndicator, Searchbar, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { ClientService } from '../../services/client.service';
import { Client } from '../../types/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientFormModal from '../../components/modals/ClientFormModal';

type Props = NativeStackScreenProps<AppStackParamList, 'Clients'>;

export default function ClientListScreen({ navigation }: Props) {
    const theme = useTheme();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = ClientService.subscribeToClients((updatedClients) => {
            setClients(updatedClients);
            setFilteredClients(updatedClients);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredClients(clients);
        } else {
            setFilteredClients(clients.filter(client =>
                client.name.toLowerCase().includes(query.toLowerCase()) ||
                client.phone.includes(query)
            ));
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Buscar clientes..."
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                elevation={1}
            />

            {filteredClients.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={{ color: theme.colors.onBackground }}>No hay clientes registrados.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredClients}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <List.Item
                            title={item.name}
                            description={item.phone}
                            left={(props) => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
                            titleStyle={{ color: theme.colors.onBackground }}
                            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                            onPress={() => navigation.navigate('ClientProfile', { clientId: item.id })}
                            style={{ borderBottomWidth: 0.5, borderBottomColor: theme.colors.outlineVariant }}
                        />
                    )}
                />
            )}

            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color={theme.colors.onPrimary}
                onPress={() => setModalVisible(true)}
            />

            <ClientFormModal
                visible={modalVisible}
                onDismiss={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        margin: 10,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 85, // Elevated above tab bar
    },
});
