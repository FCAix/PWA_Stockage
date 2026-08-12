import { supabase } from "./supabase.js";

const loginForm = document.querySelector("#login-form");
const errorMessage = document.querySelector("#login-error");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorMessage.textContent = "";

    const email = document
        .querySelector("#email")
        .value
        .trim();

    const password = document
        .querySelector("#password")
        .value;

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error(error);

        errorMessage.textContent =
            "Adresse e-mail ou mot de passe incorrect.";

        return;
    }

    const user = data.user;

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error(profileError);

        errorMessage.textContent =
            "Impossible de récupérer le profil.";

        return;
    }

    if (profile.role === "admin") {

        window.location.href = "./index.html";

    } else {

        window.location.href = "./client.html";

    }
});