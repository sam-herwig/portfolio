'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const isAlternateReality = useAppStore((state) => state.isAlternateReality);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isAlternateReality) {
            root.classList.add('dark');
            // Additional global transitions could go here
        } else {
            root.classList.remove('dark');
        }
    }, [isAlternateReality]);

    return <>{children}</>;
}
