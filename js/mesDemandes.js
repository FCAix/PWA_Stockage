import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";

import {
    obtenirTypesReservation
} from "./reservationsConfig.js";


const auth = await requireAuth([
    "admin",
    "client"
]);

if (!auth) {
    throw new Error(
        "Utilisateur non autorisé"
    );
}


const attente =
    document.querySelector(
        "#demandes-attente"
    );

const confirmees =
    document.querySelector(
        "#demandes-confirmees"
    );

const historique =
    document.querySelector(
        "#historique-demandes"
    );


// ======================================================
// CHARGEMENT
// ======================================================

async function chargerType(
    configuration
) {

    const {
        data,
        error
    } = await supabase
        .from(
            configuration
                .tableReservations
        )
        .select("*")
        .eq(
            "demandeur_id",
            auth.user.id
        );


    if (error) {
        throw error;
    }


    const ids = [
        ...new Set(
            data
                .map(
                    reservation =>
                        reservation[
                            configuration
                                .colonneRessource
                        ]
                )
                .filter(Boolean)
        )
    ];


    let ressources =
        new Map();


    if (ids.length > 0) {

        const {
            data: liste,
            error: erreurRessources
        } = await supabase
            .from(
                configuration
                    .tableRessources
            )
            .select(
                configuration
                    .colonnesRessource
            )
            .in(
                "id",
                ids
            );


        if (!erreurRessources) {

            ressources =
                new Map(
                    liste.map(
                        ressource => [
                            ressource.id,
                            configuration
                                .obtenirLibelleRessource(
                                    ressource
                                )
                        ]
                    )
                );
        }
    }


    return data.map(
        reservation => ({

            ...reservation,

            _type:
                configuration.cle,

            _typeLibelle:
                configuration
                    .libelle,

            _modeDate:
                configuration
                    .modeDate,

            _ressource:
                ressources.get(
                    reservation[
                        configuration
                            .colonneRessource
                    ]
                ) ??
                "Élément inconnu"
        })
    );
}


async function chargerDemandes() {

    try {

        const resultats =
            await Promise.all(
                obtenirTypesReservation()
                    .map(
                        configuration =>
                            chargerType(
                                configuration
                            )
                    )
            );


        const demandes =
            resultats
                .flat()
                .sort(
                    (a, b) =>
                        new Date(
                            b.created_at ??
                            b.date_debut
                        ) -
                        new Date(
                            a.created_at ??
                            a.date_debut
                        )
                );


        afficherDemandes(
            demandes
        );


    } catch (error) {

        console.error(error);

        attente.textContent =
            "Impossible de charger vos demandes.";
    }
}


// ======================================================
// AFFICHAGE
// ======================================================

function afficherDemandes(
    demandes
) {

    attente.replaceChildren();
    confirmees.replaceChildren();
    historique.replaceChildren();


    let nombreAttente = 0;
    let nombreConfirmees = 0;
    let nombreHistorique = 0;


    demandes.forEach(
        demande => {

            const carte =
                creerCarte(
                    demande
                );


            if (
                demande.statut ===
                "attente"
            ) {

                attente.appendChild(
                    carte
                );

                nombreAttente++;

            } else if (
                demande.statut ===
                "confirme"
            ) {

                confirmees.appendChild(
                    carte
                );

                nombreConfirmees++;

            } else {

                historique.appendChild(
                    carte
                );

                nombreHistorique++;
            }
        }
    );


    if (!nombreAttente) {
        attente.textContent =
            "Aucune demande en attente.";
    }

    if (!nombreConfirmees) {
        confirmees.textContent =
            "Aucune réservation confirmée.";
    }

    if (!nombreHistorique) {
        historique.textContent =
            "Aucun historique.";
    }
}


function creerCarte(
    demande
) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "carte-demande";


    const titre =
        document.createElement(
            "h3"
        );

    titre.textContent =
        `${demande._typeLibelle} — ${demande._ressource}`;


    const nom =
        document.createElement(
            "p"
        );

    nom.textContent =
        `Réservation : ${demande.nom_reservation}`;


    const responsable =
        document.createElement(
            "p"
        );

    responsable.textContent =
        `Responsable : ${demande.responsable}`;


    const dates =
        document.createElement(
            "p"
        );

    dates.textContent =
        `Du ${formaterDate(demande.date_debut, demande._modeDate)} au ${formaterDate(demande.date_fin, demande._modeDate)}`;


    const statut =
        document.createElement(
            "p"
        );

    statut.classList.add(
        "statut-demande",
        `statut-${demande.statut}`
    );

    statut.textContent =
        obtenirLibelleStatut(
            demande.statut
        );


    article.append(
        titre,
        nom,
        responsable,
        dates,
        statut
    );


    if (
        demande.nombre_passagers
    ) {

        ajouterTexte(
            article,
            `Passagers : ${demande.nombre_passagers}`
        );
    }


    if (demande.destination) {

        ajouterTexte(
            article,
            `Destination : ${demande.destination}`
        );
    }


    if (
        demande.confirmee_par_nom
    ) {

        ajouterTexte(
            article,
            `Confirmée par ${demande.confirmee_par_nom} le ${formaterDate(demande.confirmee_at, "datetime-local")}`
        );
    }


    if (
        demande.retour_confirme_par_nom
    ) {

        ajouterTexte(
            article,
            `Retour confirmé par ${demande.retour_confirme_par_nom} le ${formaterDate(demande.retour_confirme_at, "datetime-local")}`
        );
    }


    if (
        demande.statut ===
            "confirme" &&
        dateRetourPassee(
            demande
        )
    ) {

        const retour =
            document.createElement(
                "p"
            );

        retour.className =
            "retour-en-attente";

        retour.textContent =
            "Retour en attente de confirmation par un administrateur.";

        article.appendChild(
            retour
        );
    }


    if (
        demande.motif_refus
    ) {

        ajouterTexte(
            article,
            `Motif du refus : ${demande.motif_refus}`
        );
    }


    return article;
}


function ajouterTexte(
    parent,
    texte
) {

    const p =
        document.createElement(
            "p"
        );

    p.textContent =
        texte;

    parent.appendChild(p);
}


// ======================================================
// UTILITAIRES
// ======================================================

function obtenirLibelleStatut(
    statut
) {

    return {
        attente:
            "En attente",

        confirme:
            "Confirmée",

        refusee:
            "Refusée",

        annulee:
            "Annulée",

        termine:
            "Terminée"
    }[statut] ?? statut;
}


function formaterDate(
    valeur,
    mode
) {

    if (!valeur) {
        return "—";
    }


    if (
        mode === "date"
    ) {

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                dateStyle:
                    "medium"
            }
        ).format(
            new Date(
                `${valeur}T12:00:00`
            )
        );
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    ).format(
        new Date(valeur)
    );
}


function dateRetourPassee(
    demande
) {

    if (
        demande._modeDate ===
        "date"
    ) {

        return (
            new Date(
                `${demande.date_fin}T23:59:59`
            ) <=
            new Date()
        );
    }


    return (
        new Date(
            demande.date_fin
        ) <=
        new Date()
    );
}


await chargerDemandes();