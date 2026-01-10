
'use client'

import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { logout } from "@/app/auth/actions";
import { useTransition } from "react";

export default function LogoutButton() {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    }

    return (
        <Button variant="destructive" onClick={handleLogout} disabled={isPending} size="icon" className="hidden md:inline-flex" aria-label="Cerrar sesión">
            <LogOut />
        </Button>
    )
}
