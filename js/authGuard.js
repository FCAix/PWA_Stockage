import { supabase } from "./supabase.js";

export async function requireAuth(allowedRoles = []) {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error || !user) {

        window.location.replace("./login.html");

        return null;
    }

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {

        window.location.replace("./login.html");

        return null;
    }

    if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(profile.role)
    ) {

        if (profile.role === "client") {

            window.location.replace("./client.html");

        } else {

            window.location.replace("./index.html");

        }

        return null;
    }

    return {
        user,
        role: profile.role
    };
}