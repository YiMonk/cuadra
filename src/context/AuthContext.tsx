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
                const users = await UserService.getUsers();
                let meta = users.find(u => u.id === firebaseUser.uid);

                if (!meta) {
                    // Create metadata if it doesn't exist
                    // If no users exist, the first one is admin
                    const isFirstUser = users.length === 0;
                    meta = {
                        id: firebaseUser.uid,
                        displayName: firebaseUser.displayName || 'Usuario',
                        email: firebaseUser.email || '',
                        active: true,
                        role: isFirstUser ? 'admin' : 'staff',
                        createdAt: Date.now()
                    };
                    await UserService.syncUserMetadata(firebaseUser.uid, meta);
                }

                const userProfile: UserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    role: meta.role,
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
