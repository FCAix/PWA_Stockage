import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";


// ======================================================
// AUTHENTIFICATION ADMIN
// ======================================================

const auth = await requireAuth(["admin"]);

if (!auth) {
    throw new Error("Accès administrateur requis");
}

const admin = auth.user;


// ======================================================
// ÉLÉMENTS HTML
// ======================================================

const conteneurAttente =
    document.querySelector("#demandes-attente");

const conteneurConfirmees =
    document.querySelector("#reservations-confirmees");

const conteneurRetours =
    document.querySelector("#retours-attente");

const conteneurHistorique =
    document.querySelector("#historique");


// ======================================================
// FORMATAGE
// ======================================================

function formaterDate(date) {

    if (!date) {
        return "Non renseignée";
    }

    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(new Date(date));
}


function obtenirLibelleStatut(statut) {

    const statuts = {
        attente: "En attente",
        confirme: "Confirmée",
        refusee: "Refusée",
        annulee: "Annulée",
        termine: "Terminée"
    };

    return statuts[statut] ?? statut;
}


// ======================================================
// CHARGEMENT DU MATÉRIEL
// ======================================================

async function chargerMateriels(demandes) {

    const ids = [
        ...new Set(
            demandes
                .map(demande => demande.materiel_id)
                .filter(Boolean)
        )
    ];


    if (ids.length === 0) {
        return new Map();
    }


    const { data, error } = await supabase
        .from("materiel")
        .select("id, nom")
        .in("id", ids);


    if (error) {

        console.error(
            "Erreur chargement matériel :",
            error
        );

        return new Map();
    }


    return new Map(
        data.map(materiel => [
            materiel.id,
            materiel.nom
        ])
    );
}


// ======================================================
// CRÉATION DES BOUTONS
// ======================================================

function creerBouton(
    texte,
    action,
    reservationId
) {

    const bouton =
        document.createElement("button");

    bouton.type = "button";

    bouton.textContent = texte;

    bouton.dataset.action = action;
    bouton.dataset.id = reservationId;

    bouton.classList.add(
        "bouton-action",
        `bouton-${action}`
    );

    return bouton;
}


// ======================================================
// CRÉATION D'UNE CARTE ADMIN
// ======================================================

function creerCarteDemande(
    demande,
    materiels
) {

    const article =
        document.createElement("article");

    article.classList.add("carte-demande");


    // Matériel

    const titre =
        document.createElement("h3");

    titre.textContent =
        materiels.get(demande.materiel_id)
        ?? "Matériel inconnu";

    article.appendChild(titre);


    // Réservation

    const nom =
        document.createElement("p");

    nom.textContent =
        `Réservation : ${demande.nom_reservation}`;

    article.appendChild(nom);


    // Responsable

    const responsable =
        document.createElement("p");

    responsable.textContent =
        `Responsable : ${demande.responsable}`;

    article.appendChild(responsable);


    // Téléphone

    if (demande.telephone) {

        const telephone =
            document.createElement("p");

        telephone.textContent =
            `Téléphone : ${demande.telephone}`;

        article.appendChild(telephone);
    }


    // Destination

    if (demande.destination) {

        const destination =
            document.createElement("p");

        destination.textContent =
            `Destination : ${demande.destination}`;

        article.appendChild(destination);
    }


    // Dates

    const dates =
        document.createElement("p");

    dates.textContent =
        `Du ${formaterDate(demande.date_debut)}
        au ${formaterDate(demande.date_fin)}`;

    article.appendChild(dates);


    // Statut

    const statut =
        document.createElement("p");

    statut.textContent =
        `Statut : ${obtenirLibelleStatut(
            demande.statut
        )}`;

    statut.classList.add(
        "statut-demande",
        `statut-${demande.statut}`
    );

    article.appendChild(statut);


    // Notes

    if (demande.notes) {

        const notes =
            document.createElement("p");

        notes.textContent =
            `Notes : ${demande.notes}`;

        article.appendChild(notes);
    }


    // Motif refus

    if (
        demande.statut === "refusee" &&
        demande.motif_refus
    ) {

        const motif =
            document.createElement("p");

        motif.textContent =
            `Motif du refus : ${demande.motif_refus}`;

        article.appendChild(motif);
    }


    // =============================
    // BOUTONS SI EN ATTENTE
    // =============================

    if (demande.statut === "attente") {

        const actions =
            document.createElement("div");

        actions.classList.add(
            "actions-demande"
        );


        actions.appendChild(
            creerBouton(
                "Confirmer",
                "confirmer",
                demande.id
            )
        );


        actions.appendChild(
            creerBouton(
                "Refuser",
                "refuser",
                demande.id
            )
        );


        article.appendChild(actions);
    }


    // =============================
    // BOUTON RETOUR
    // =============================

    if (
        demande.statut === "confirme" &&
        new Date(demande.date_fin).getTime()
            <= Date.now()
    ) {

        const boutonRetour =
            creerBouton(
                "Confirmer le retour",
                "retour",
                demande.id
            );

        boutonRetour.dataset.dateFin =
            demande.date_fin;

        article.appendChild(
            boutonRetour
        );
    }


    return article;
}


// ======================================================
// AFFICHAGE
// ======================================================

function afficherDemandes(
    demandes,
    materiels
) {

    conteneurAttente.innerHTML = "";
    conteneurConfirmees.innerHTML = "";
    conteneurRetours.innerHTML = "";
    conteneurHistorique.innerHTML = "";


    let attente = 0;
    let confirmees = 0;
    let retours = 0;
    let historique = 0;


    demandes.forEach(demande => {

        const carte =
            creerCarteDemande(
                demande,
                materiels
            );


        // =============================
        // EN ATTENTE
        // =============================

        if (demande.statut === "attente") {

            conteneurAttente.appendChild(
                carte
            );

            attente++;

            return;
        }


        // =============================
        // CONFIRMÉE
        // =============================

        if (demande.statut === "confirme") {

            const dateFin =
                new Date(
                    demande.date_fin
                ).getTime();


            // Date passée :
            // retour à confirmer

            if (dateFin <= Date.now()) {

                conteneurRetours.appendChild(
                    carte
                );

                retours++;

            } else {

                conteneurConfirmees.appendChild(
                    carte
                );

                confirmees++;
            }

            return;
        }


        // =============================
        // HISTORIQUE
        // =============================

        conteneurHistorique.appendChild(
            carte
        );

        historique++;
    });


    if (attente === 0) {

        conteneurAttente.textContent =
            "Aucune demande en attente.";
    }


    if (confirmees === 0) {

        conteneurConfirmees.textContent =
            "Aucune réservation confirmée.";
    }


    if (retours === 0) {

        conteneurRetours.textContent =
            "Aucun retour à confirmer.";
    }


    if (historique === 0) {

        conteneurHistorique.textContent =
            "Aucun historique.";
    }
}


// ======================================================
// CHARGER TOUTES LES DEMANDES
// ======================================================

async function chargerDemandes() {

    const { data, error } = await supabase
        .from("reservations_materiel")
        .select(`
            id,
            materiel_id,
            demandeur_id,
            nom_reservation,
            responsable,
            telephone,
            destination,
            date_debut,
            date_fin,
            statut,
            notes,
            motif_refus,
            created_at,
            confirmee_par,
            confirmee_par_nom,
            confirmee_at,
            retour_confirme_par,
            retour_confirme_par_nom,
            retour_confirme_at
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Erreur chargement demandes :",
            error
        );

        conteneurAttente.textContent =
            "Impossible de charger les demandes.";

        return;
    }


    const materiels =
        await chargerMateriels(data);


    afficherDemandes(
        data,
        materiels
    );
}


// ======================================================
// CONFIRMER UNE RÉSERVATION
// ======================================================

async function confirmerReservation(
    reservationId
) {

    const confirmation = confirm(
        "Confirmer cette réservation ?"
    );

    if (!confirmation) {
        return;
    }

    const { data: adminProfile, error: profileError } =
        await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", admin.id)
            .single();

    if (profileError) {
        console.error(
            "Impossible de récupérer le profil admin :",
            profileError
        );

        return;
    }

    const { error } = await supabase
        .from("reservations_materiel")
        .update({
            statut: "confirme",

            confirmee_par: admin.id,

            confirmee_par_nom:
                adminProfile.full_name,

            confirmee_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            reservationId
        )
        .eq(
            "statut",
            "attente"
        );



    if (error) {

        console.error(
            "Erreur confirmation :",
            error
        );


        // Conflit de réservation PostgreSQL

        if (error.code === "23P01") {

            alert(
                "Impossible de confirmer cette demande : le matériel est déjà réservé sur cette période."
            );

        } else {

            alert(
                "Erreur lors de la confirmation."
            );
        }

        return;
    }
    const {
        data: googleData,
        error: googleError
    } = await supabase.functions.invoke(
            "google-calendar",
            {
                body: {
                    reservationId,
                    action: "create"
                }
            }
        );

    if (googleError) {

        console.error(
            "Erreur Google Agenda :",
            googleError
        );

        alert(
            "La réservation est confirmée, mais l'ajout à Google Agenda a échoué."
        );

    } else {

        console.log(
            "Événement Google Agenda créé :",
            googleData
        );
    }



    await chargerDemandes();
}


// ======================================================
// REFUSER UNE DEMANDE
// ======================================================

async function refuserReservation(
    reservationId
) {

    const motif = prompt(
        "Indiquez le motif du refus :"
    );


    // L'utilisateur a cliqué sur Annuler

    if (motif === null) {
        return;
    }


    const { error } = await supabase
        .from("reservations_materiel")
        .update({
            statut: "refusee",

            motif_refus:
                motif.trim() || null
        })
        .eq(
            "id",
            reservationId
        )
        .eq(
            "statut",
            "attente"
        );


    if (error) {

        console.error(
            "Erreur refus réservation :",
            error
        );

        alert(
            "Impossible de refuser la demande."
        );

        return;
    }


    await chargerDemandes();
}


// ======================================================
// CONFIRMER LE RETOUR DU MATÉRIEL
// ======================================================

async function confirmerRetour(
    reservationId,
    dateFin
) {

    if (
        new Date(dateFin).getTime()
        > Date.now()
    ) {

        alert(
            "La date de retour prévue n'est pas encore passée."
        );

        return;
    }


    const confirmation = confirm(
        "Confirmez-vous que le matériel a bien été retourné ?"
    );


    if (!confirmation) {
        return;
    }


    const { error } = await supabase
        .from("reservations_materiel")
        .update({
            statut: "termine",

            retour_confirme_par:
                admin.id,

            retour_confirme_par_nom:
                adminProfile.full_name,

            retour_confirme_at:
                new Date().toISOString()
        })
        .eq(
            "id",
            reservationId
        )
        .eq(
            "statut",
            "confirme"
        );

    const {
            error: googleError
        } = await supabase.functions.invoke(
            "google-calendar",
            {
                body: {
                    reservationId,
                    action: "update"
                }
            }
        );

        if (googleError) {

            console.error(
                "Erreur Google Agenda :",
                googleError
            );
        }

    if (error) {

        console.error(
            "Erreur confirmation retour :",
            error
        );

        alert(
            "Impossible de confirmer le retour."
        );

        return;
    }


    await chargerDemandes();
}


// ======================================================
// ÉVÉNEMENTS / TRIGGERS JAVASCRIPT
// ======================================================

document.addEventListener(
    "click",
    async event => {

        const bouton =
            event.target.closest(
                "[data-action]"
            );


        if (!bouton) {
            return;
        }


        const action =
            bouton.dataset.action;

        const reservationId =
            bouton.dataset.id;


        // Empêche les doubles clics

        bouton.disabled = true;


        try {

            // CONFIRMER

            if (action === "confirmer") {

                await confirmerReservation(
                    reservationId
                );

                return;
            }


            // REFUSER

            if (action === "refuser") {

                await refuserReservation(
                    reservationId
                );

                return;
            }


            // RETOUR

            if (action === "retour") {

                await confirmerRetour(
                    reservationId,
                    bouton.dataset.dateFin
                );
            }

        } finally {

            bouton.disabled = false;
        }
    }
);


// ======================================================
// INITIALISATION
// ======================================================

await chargerDemandes();