import { supabase } from "./supabase.js";

const registerForm =
    document.querySelector("#register-form");

const message =
    document.querySelector("#register-message");

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        message.textContent = "";

        const fullName =
            document
                .querySelector("#full-name")
                .value
                .trim();

        const email =
            document
                .querySelector("#email")
                .value
                .trim();

        const password =
            document
                .querySelector("#password")
                .value;

        const passwordConfirm =
            document
                .querySelector("#password-confirm")
                .value;

        if (password !== passwordConfirm) {

            message.textContent =
                "Les mots de passe ne correspondent pas.";

            return;
        }

        if (!fullName) {

            message.textContent =
                "Veuillez renseigner votre nom.";

            return;
        }

        const {
            data,
            error
        } = await supabase.auth.signUp({
            email,
            password,
            options: {

                data: {
                    full_name: fullName
                }

            }
        });

        if (error) {

            console.error(error);

            message.textContent =
                "Impossible de créer le compte.";

            return;
        }

        console.log("Utilisateur créé :", data.user);

        message.textContent =
            "Compte créé. Vérifiez votre adresse e-mail.";

    }
);