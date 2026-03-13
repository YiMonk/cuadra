import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch actual metadata from Firestore
                let meta = await UserService.getUserById(firebaseUser.uid);

                if (!meta) {
                    // Create metadata if it doesn't exist
                    // Fallback to 'admin' if it's the very first user (simplified logic or keep default)
                    // Actually, for now let's just create it as admin if we can't determine otherwise, 
                    // but usually RegisterScreen handles this. This is a fallback for legacy/tested users.
                    meta = {
                        id: firebaseUser.uid,
                        displayName: firebaseUser.displayName || 'Usuario',
                        email: firebaseUser.email || '',
                        active: true,
                        role: 'admin', // Default fallback
                        ownerId: firebaseUser.uid,
                        createdAt: Date.now()
                    };
                    await UserService.syncUserMetadata(firebaseUser.uid, meta);
                } else if (meta.email !== firebaseUser.email) {
                    // Sync email if it changed in Auth but not in Firestore
                    await UserService.updateUser(firebaseUser.uid, { email: firebaseUser.email || '' });
                    meta.email = firebaseUser.email || '';
                }

                // CHECK 1: Is the user themselves active?
                if (!meta.active) {
                    console.log("User is inactive");
                    await auth.signOut();
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // CHECK 2: If Staff, is the Owner active?
                if (meta.role === 'staff' && meta.ownerId) {
                    const owner = await UserService.getUserById(meta.ownerId);
                    if (owner && !owner.active) {
                        console.log("Owner is inactive, blocking staff");
                        await auth.signOut();
                        setUser(null);
                        setIsLoading(false);
                        // Ideally we'd show a toast here, but we are in context. 
                        // The LoginScreen handles this check too for visual feedback.
                        return;
                    }
                }

                const userProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    role: meta.role,
                    ownerId: meta.ownerId,
                    createdAt: meta.createdAt || Date.now(),
                };

                setUser(userProfile);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        // Safety timeout: If Firebase takes too long (e.g. network issues), stop loading
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
                    role: user?.role || 'admin',
                    createdAt: user?.createdAt || Date.now(),
                };
                setUser(userProfile);
            }
        }
    };

    const signIn = () => {
        // This is just a helper, actual login logic is in LoginScreen 
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
