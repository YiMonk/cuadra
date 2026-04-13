"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { AuthState, UserProfile } from '../types/auth';
import { UserService } from '../services/user.service';

interface AuthContextType extends AuthState {
    signIn: () => void;
    signOut: () => Promise<void>;
    reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isProcessingRef = React.useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
                if (firebaseUser) {
                    console.log("Auth state: User logged in", firebaseUser.uid);
                    try {
                        let meta = await UserService.getUserById(firebaseUser.uid);

                        if (!meta) {
                            console.log("No metadata found, initializing...");
                            meta = {
                                id: firebaseUser.uid,
                                displayName: firebaseUser.displayName || 'Usuario',
                                email: firebaseUser.email || '',
                                active: true,
                                role: 'owner',
                                ownerId: firebaseUser.uid,
                                createdAt: Date.now()
                            };
                            await UserService.syncUserMetadata(firebaseUser.uid, meta);
                        } else if (meta.email !== firebaseUser.email) {
                            await UserService.updateUser(firebaseUser.uid, { email: firebaseUser.email || '' });
                            meta.email = firebaseUser.email || '';
                        }

                        if (!meta.active) {
                            console.warn("User inactive, signing out...");
                            await auth.signOut();
                            setUser(null);
                            setIsLoading(false);
                            isProcessingRef.current = false;
                            return;
                        }

                        if (meta.role === 'staff' && meta.ownerId) {
                            const owner = await UserService.getUserById(meta.ownerId);
                            if (owner && (!owner.active || (owner.subscriptionEndsAt && owner.subscriptionEndsAt < Date.now()))) {
                                console.warn("Owner inactive or expired, signing out staff...");
                                await auth.signOut();
                                setUser(null);
                                setIsLoading(false);
                                isProcessingRef.current = false;
                                return;
                            }
                        }

                        // Check subscription for owners
                        if (meta.role === 'owner' && meta.subscriptionEndsAt && meta.subscriptionEndsAt < Date.now()) {
                            console.warn("Subscription expired, signing out...");
                            await auth.signOut();
                            setUser(null);
                            setIsLoading(false);
                            isProcessingRef.current = false;
                            return;
                        }

                        const userProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: meta.role,
                            ownerId: meta.ownerId,
                            createdAt: meta.createdAt || Date.now(),
                            subscriptionEndsAt: meta.subscriptionEndsAt,
                        };

                        setUser(userProfile);
                    } catch (error) {
                        console.error("Critical: Error fetching metadata, clearing auth session:", error);
                        await auth.signOut();
                        setUser(null);
                    }
                } else {
                    console.log("-> Auth state: No Firebase user detected, setting profile to null");
                    setUser(null);
                }
            } catch (globalError) {
                console.error("-> Global error in auth listener:", globalError);
            } finally {
                console.log("-> Auth processing complete, setting isLoading: false");
                setIsLoading(false);
                isProcessingRef.current = false;
            }
        });

        const timeout = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) {
                    console.warn("Auth state change timed out, forcing load completion.");
                    return false;
                }
                return prev;
            });
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const signOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const reloadUser = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await currentUser.reload();
            const updatedUser = auth.currentUser;
            if (updatedUser) {
                const userProfile: UserProfile = {
                    uid: updatedUser.uid,
                    email: updatedUser.email,
                    displayName: updatedUser.displayName,
                    photoURL: updatedUser.photoURL,
                    role: user?.role || 'owner',
                    createdAt: user?.createdAt || Date.now(),
                    subscriptionEndsAt: user?.subscriptionEndsAt,
                    ownerId: user?.ownerId,
                };
                setUser(userProfile);
            }
        }
    };

    const signIn = () => {
        console.log("Sign in placeholder");
    }

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        reloadUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
