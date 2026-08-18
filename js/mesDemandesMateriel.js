import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";


// ======================================================
// AUTHENTIFICATION
// ======================================================

const auth = await requireAuth(["admin","client"]);

if (!auth) {
    throw new Error("Utilisateur non autorisé");
}

const user = auth.user;


// ======================================================
// ÉLÉMENTS HTML
// ======================================================

const conteneurAttente =
    document.querySelector("#demandes-attente");

const conteneurConfirmees =
    document.querySelector("#demandes-confirmees");

const conteneurHistorique =
    document.querySelector("#historique-demandes");


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
        attente: "En attente de validation",
        confirme: "Réservation confirmée",
        refusee: "Demande refusée",
        annulee: "Annulée",
        termine: "Terminée"
    };

    return statuts[statut] ?? statut;
}


// ======================================================
// CHARGEMENT DES NOMS DE MATÉRIEL
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
// CRÉATION D'UNE CARTE
// ======================================================

function creerCarteDemande(
    demande,
    materiels
) {

    const article =
        document.createElement("article");

    article.classList.add("carte-demande");


    // Nom matériel

    const titre =
        document.createElement("h3");

    titre.textContent =
        materiels.get(demande.materiel_id)
        ?? "Matériel inconnu";

    article.appendChild(titre);


    // Nom réservation

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

    statut.classList.add(
        "statut-demande",
        `statut-${demande.statut}`
    );

    statut.textContent =
        obtenirLibelleStatut(
            demande.statut
        );

    article.appendChild(statut);


    // Retour à confirmer

    if (
        demande.statut === "confirme" &&
        new Date(demande.date_fin).getTime()
            <= Date.now()
    ) {

        const retour =
            document.createElement("p");

        retour.classList.add(
            "retour-en-attente"
        );

        retour.textContent =
            "Retour du matériel en attente de confirmation par un administrateur.";

        article.appendChild(retour);
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


    // Notes

    if (demande.notes) {

        const notes =
            document.createElement("p");

        notes.textContent =
            `Notes : ${demande.notes}`;

        article.appendChild(notes);
    }

    if (reservation.confirmee_par_nom) {

    const confirmationInfo =
            document.createElement("p");

        confirmationInfo.textContent =
            `Confirmée par : ${reservation.confirmee_par_nom} le ${formatDate(reservation.confirmee_at)}`;

        article.appendChild(
            confirmationInfo
        );
    }

    if (reservation.retour_confirme_par_nom) {

    const returnInfo =
            document.createElement("p");

        returnInfo.textContent =
            `Retour confirmé par : ${reservation.retour_confirme_par_nom} le ${formatDate(reservation.retour_confirme_at)}`;

        article.appendChild(
            returnInfo
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
    conteneurHistorique.innerHTML = "";


    let nombreAttente = 0;
    let nombreConfirmees = 0;
    let nombreHistorique = 0;


    demandes.forEach(demande => {

        const carte =
            creerCarteDemande(
                demande,
                materiels
            );


        // EN ATTENTE

        if (demande.statut === "attente") {

            conteneurAttente.appendChild(
                carte
            );

            nombreAttente++;

            return;
        }


        // CONFIRMÉE / RETOUR À CONFIRMER

        if (demande.statut === "confirme") {

            conteneurConfirmees.appendChild(
                carte
            );

            nombreConfirmees++;

            return;
        }


        // HISTORIQUE

        conteneurHistorique.appendChild(
            carte
        );

        nombreHistorique++;
    });


    // Messages si aucune demande

    if (nombreAttente === 0) {

        conteneurAttente.textContent =
            "Aucune demande en attente.";
    }


    if (nombreConfirmees === 0) {

        conteneurConfirmees.textContent =
            "Aucune réservation confirmée.";
    }


    if (nombreHistorique === 0) {

        conteneurHistorique.textContent =
            "Aucun historique.";
    }
}


// ======================================================
// CHARGEMENT DES DEMANDES
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
            confirmee_at,
            retour_confirme_at
        `)
        .eq(
            "demandeur_id",
            user.id
        )
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
// INITIALISATION
// ======================================================

await chargerDemandes();