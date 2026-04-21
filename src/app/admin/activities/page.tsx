"use client";

import React, { useState, useEffect } from 'react';
import { ActivityService } from '@/services/activity.service';
import { ActivityLog } from '@/types/activity';
import { 
    Clock, User as UserIcon, Calendar, Filter, Search, 
    Plus, Shield, Trash2, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function GlobalActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');

    useEffect(() => {
        const unsubscribe = ActivityService.subscribeToGlobalLog((data) => {
            setLogs(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesQuery = 
            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.targetUserName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesAction = actionFilter === 'all' || log.action === actionFilter;
        
        return matchesQuery && matchesAction;
    });

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                <span className="ml-3 text-ui-text-muted font-black tracking-widest uppercase text-xs">Cargando Auditoría...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-ui-text uppercase tracking-tighter">Historial Global</h1>
                    <p className="text-ui-text-muted font-bold tracking-widest uppercase text-[10px] mt-1">Bitácora de Auditoría Administrativa</p>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Buscar en el historial..."
                            className="pl-12 h-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                         <Select
                            options={[
                                { value: 'all', label: 'Todas las acciones' },
                                { value: 'user_created', label: 'Usuarios Creados' },
                                { value: 'user_status_changed', label: 'Cambios de Estado' },
                                { value: 'subscription_extended', label: 'Suscripciones' },
                                { value: 'user_deleted', label: 'Eliminaciones' }
                            ]}
                            value={actionFilter}
                            onChange={(val) => setActionFilter(val)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-20 ui-card border border-dashed border-ui-border">
                        <Clock className="mx-auto mb-6 opacity-10" size={64} />
                        <p className="text-xl font-black uppercase tracking-widest text-ui-text-muted/40">No se encontraron registros</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div key={log.id} className="p-6 ui-card border border-ui-border hover:border-accent-primary/20 transition-all flex flex-col md:flex-row md:items-center gap-6 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent-primary/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner
                                ${log.action === 'user_created' ? 'bg-emerald-500/10 text-emerald-500' :
                                  log.action === 'subscription_extended' ? 'bg-blue-500/10 text-blue-500' :
                                  log.action === 'user_status_changed' ? 'bg-amber-500/10 text-amber-500' : 
                                  log.action === 'user_deleted' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'}
                            `}>
                                {log.action === 'user_created' ? <Plus size={28} /> :
                                 log.action === 'subscription_extended' ? <Calendar size={28} /> :
                                 log.action === 'user_status_changed' ? <Shield size={28} /> : 
                                 log.action === 'user_deleted' ? <Trash2 size={28} /> : <Clock size={28} />}
                            </div>

                            <div className="flex-1 min-w-0 relative z-10">
                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border
                                        ${log.action === 'user_created' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                          log.action === 'subscription_extended' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                          log.action === 'user_status_changed' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                          log.action === 'user_deleted' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-gray-500/10 border-gray-500/20'}
                                    `}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] font-bold text-ui-text-muted uppercase">
                                        {new Date(log.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                
                                <p className="text-sm font-bold text-ui-text leading-relaxed mt-1">
                                    {log.details}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-ui-text-muted uppercase tracking-widest opacity-80">
                                    <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                        <UserIcon size={12} />
                                    </div>
                                    Ejecutado por: <span className="text-accent-primary">{log.adminName}</span>
                                </div>
                            </div>

                            <div className="hidden md:flex ml-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                                <ArrowRight size={20} className="text-ui-text-muted" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
