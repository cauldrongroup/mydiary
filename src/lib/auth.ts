import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/index"; // your drizzle instance
import * as schema from "../../auth-schema";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        async sendResetPassword() {
            // Send an email to the user with a link to reset their password
        },
    },
    database: drizzleAdapter(db, {
        provider: "sqlite", // or "mysql", "sqlite"
        schema: {
            ...schema,
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification
        }
    })
});