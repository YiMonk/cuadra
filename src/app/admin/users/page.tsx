"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserService, UserMetadata } from '@/services/user.service';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Shield, User as UserIcon, ShieldAlert, ArrowRight, UserCog, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUserManagementPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admingod' | 'admin' | 'staff'>('all');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesQuery =
                u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesQuery && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Cargando Directorio...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Directorio</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Gestión de Usuarios del Sistema</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            className="pl-12 h-12 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {(['all', 'admin', 'staff', 'admingod'] as const).map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${roleFilter === role
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                {role === 'all' ? 'Todos' : role === 'admin' ? 'Tiendas' : role === 'staff' ? 'Vendedores' : 'AdminGods'}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3 mt-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                        <UserCog className="mx-auto mb-4 opacity-30" size={56} />
                        <p className="text-lg font-medium">No se encontraron usuarios</p>
                    </div>
                ) : (
                    filteredUsers.map(item => (
                        <button
                            key={item.id}
                            onClick={() => router.push(`/admin/users/${item.id}`)}
                            className={`w-full flex items-center p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 text-left group
                ${item.active ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950 opacity-80'}`
                            }
                        >
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center mr-4 shadow-inner transition-transform group-hover:scale-110
                ${item.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                        : item.role === 'admingod' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                            >
                                {item.role === 'admingod' ? <ShieldAlert size={26} /> : item.role === 'admin' ? <Shield size={26} /> : <UserIcon size={26} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.displayName}</h3>
                                    {item.id === user?.uid && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 text-[10px] font-bold tracking-widest shadow-sm">TU CUENTA</span>
                                    )}
                                    {!item.active && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 text-[10px] font-bold tracking-widest shadow-sm">BLOQUEADO</span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{item.email}</p>
                                
                                {item.role === 'admin' && (
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                            ${!item.subscriptionEndsAt ? 'bg-gray-100 text-gray-500' :
                                              item.subscriptionEndsAt < Date.now() ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-600'}
                                        `}>
                                            <Calendar size={12} />
                                            {!item.subscriptionEndsAt ? 'Sin Suscripción' :
                                             item.subscriptionEndsAt < Date.now() ? 'Vencido' : 
                                             `${Math.ceil((item.subscriptionEndsAt - Date.now()) / (1000 * 60 * 60 * 24))} días restantes`}
                                        </div>
                                        
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                            ${item.active ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-500'}
                                        `}>
                                            <Clock size={12} />
                                            {item.active ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="ml-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" size={24} />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
