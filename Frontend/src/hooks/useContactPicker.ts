"use client";

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface ContactInfo {
    name?: string[];
    tel?: string[];
}
interface ContactsManager {
    select(properties: string[], options?: { multiple?: boolean }): Promise<ContactInfo[]>;
}
type NavigatorWithContacts = Navigator & { contacts?: ContactsManager };

/**
 * Hook to use the Contact Picker API.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API
 */
export const useContactPicker = () => {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const nav = navigator as NavigatorWithContacts;
        if (nav.contacts && typeof nav.contacts.select === 'function') {
            setIsSupported(true);
        }
    }, []);

    const pickContact = useCallback(async () => {
        if (!isSupported) {
            // No need to toast here, we'll probably hide the button if not supported
            return null;
        }

        try {
            // We want name and telephone
            const props = ['name', 'tel'];
            const opts = { multiple: false };

            const nav = navigator as NavigatorWithContacts;
            const contacts = (await nav.contacts!.select(props, opts)) ?? [];

            if (contacts && contacts.length > 0) {
                const contact = contacts[0];
                
                // name and tel are usually arrays in this API
                const name = contact.name && contact.name.length > 0 ? contact.name[0] : '';
                const phone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
                
                // Clean phone number (optional, but usually helpful for systems)
                // We keep '+' for international numbers but remove spaces and dashes
                const cleanPhone = phone.replace(/[^\d+]/g, '');

                return { name, phone: cleanPhone };
            }
        } catch (err: any) {
            // Handle common errors
            if (err.name === 'AbortError') {
                // User cancelled the picker, no action needed
                return null;
            }
            
            console.error('Error selecting contact:', err);
            toast.error('Error al acceder a los contactos: ' + err.message);
        }
        return null;
    }, [isSupported]);

    return { isSupported, pickContact };
};
