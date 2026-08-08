import * as React from "react"
import { Link } from "@tanstack/react-router"
import { AuthCard } from "./AuthCard"
import { Button } from "../ui/Button"

interface AuthSuccessProps {
    title: string;
    message: string;
    backToLoginText: string;
}

export function AuthSuccess({ title, message, backToLoginText }: AuthSuccessProps) {
    return (
        <AuthCard title={title}>
            <div className="space-y-6 text-center">
                <p className="text-sm text-text-muted whitespace-pre-line">
                    {message}
                </p>
                <Button asChild className="w-full">
                    <Link to="/login">{backToLoginText}</Link>
                </Button>
            </div>
        </AuthCard>
    )
}
