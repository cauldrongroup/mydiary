import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/index"; // your drizzle instance
import { passkey } from "better-auth/plugins/passkey";
import { magicLink } from "better-auth/plugins/magic-link";
export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        async sendResetPassword(data, request) {
            // Send an email to the user with a link to reset their password
        },
    },
    database: drizzleAdapter(db, {
        provider: "sqlite", // or "mysql", "sqlite"
    })
});