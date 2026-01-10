
'use client'

import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { logout } from "@/app/auth/actions";
import { useTransition } from "react";
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function LogoutButton() {
    const [isPending, startTransition] = useTransition();
    const auth = useAuth();

    const handleLogout = () => {
        startTransition(async () => {
            await signOut(auth); // Sign out from client
            await logout(); // Clear server session
        });
    }

    return (
        <Button variant="destructive" onClick={handleLogout} disabled={isPending} size="icon" className="md:inline-flex" aria-label="Cerrar sesión">
            <LogOut />
        </Button>
    )
}
