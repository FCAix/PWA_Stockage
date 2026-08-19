import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";

import {
    obtenirConfigurationReservation,
    obtenirTypesReservation
} from "./reservationsConfig.js";


const auth =
    await requireAuth([
        "admin"
    ]);

if (!auth) {
    throw new Error(
        "Accès administrateur requis"
    );
}


const admin =
    auth.user;


// ======================================================
// ADMIN
// ======================================================

const {
    data: profilAdmin
} = await supabase
    .from("profiles")
    .select("full_name")
    .eq(
        "id",
        admin.id
    )
    .maybeSingle();


const nomAdmin =
    profilAdmin?.full_name ||
    admin.email ||
    "Administrateur";


// ======================================================
// HTML
// ======================================================

const attente =
    document.querySelector(
        "#demandes-attente"
    );

const confirmees =
    document.querySelector(
        "#reservations-confirmees"
    );

const retours =
    document.querySelector(
        "#retours-attente"
    );

const historique =
    document.querySelector(
        "#historique"
    );


// ======================================================
// CHARGEMENT
// ======================================================

async function chargerReservationsType(
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
        .select("*");


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


    if (ids.length) {

        const {
            data: liste
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


        if (liste) {

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

        const groupes =
            await Promise.all(
                obtenirTypesReservation()
                    .map(
                        configuration =>
                            chargerReservationsType(
                                configuration
                            )
                    )
            );


        const demandes =
            groupes
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
            "Impossible de charger les demandes.";
    }
}


// ======================================================
// CARTE
// ======================================================

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


    if (demande.telephone) {

        ajouterTexte(
            article,
            `Téléphone : ${demande.telephone}`
        );
    }


    if (demande.destination) {

        ajouterTexte(
            article,
            `Destination : ${demande.destination}`
        );
    }


    if (
        demande.nombre_passagers
    ) {

        ajouterTexte(
            article,
            `Passagers : ${demande.nombre_passagers}`
        );
    }


    if (demande.notes) {

        ajouterTexte(
            article,
            `Notes : ${demande.notes}`
        );
    }


    if (
        demande.confirmee_par_nom
    ) {

        ajouterTexte(
            article,
            `Confirmée par : ${demande.confirmee_par_nom} le ${formaterDate(demande.confirmee_at, "datetime-local")}`
        );
    }


    if (
        demande.retour_confirme_par_nom
    ) {

        ajouterTexte(
            article,
            `Retour confirmé par : ${demande.retour_confirme_par_nom} le ${formaterDate(demande.retour_confirme_at, "datetime-local")}`
        );
    }


    if (demande.motif_refus) {

        ajouterTexte(
            article,
            `Motif du refus : ${demande.motif_refus}`
        );
    }


    if (
        demande.statut ===
        "attente"
    ) {

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "actions-demande";


        actions.append(
            creerBouton(
                "Confirmer",
                "confirmer",
                demande
            ),

            creerBouton(
                "Refuser",
                "refuser",
                demande
            )
        );


        article.appendChild(
            actions
        );
    }


    if (
        demande.statut ===
            "confirme" &&
        dateRetourPassee(
            demande
        )
    ) {

        article.appendChild(
            creerBouton(
                "Confirmer le retour",
                "retour",
                demande
            )
        );
    }


    return article;
}


function creerBouton(
    texte,
    action,
    demande
) {

    const bouton =
        document.createElement(
            "button"
        );

    bouton.type =
        "button";

    bouton.textContent =
        texte;

    bouton.dataset.action =
        action;

    bouton.dataset.id =
        demande.id;

    bouton.dataset.type =
        demande._type;

    bouton.classList.add(
        "bouton-action",
        `bouton-${action}`
    );


    return bouton;
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
// AFFICHAGE
// ======================================================

function afficherDemandes(
    demandes
) {

    attente.replaceChildren();
    confirmees.replaceChildren();
    retours.replaceChildren();
    historique.replaceChildren();


    let totalAttente = 0;
    let totalConfirmees = 0;
    let totalRetours = 0;
    let totalHistorique = 0;


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

                totalAttente++;

                return;
            }


            if (
                demande.statut ===
                "confirme"
            ) {

                if (
                    dateRetourPassee(
                        demande
                    )
                ) {

                    retours.appendChild(
                        carte
                    );

                    totalRetours++;

                } else {

                    confirmees.appendChild(
                        carte
                    );

                    totalConfirmees++;
                }

                return;
            }


            historique.appendChild(
                carte
            );

            totalHistorique++;
        }
    );


    if (!totalAttente) {
        attente.textContent =
            "Aucune demande en attente.";
    }

    if (!totalConfirmees) {
        confirmees.textContent =
            "Aucune réservation confirmée.";
    }

    if (!totalRetours) {
        retours.textContent =
            "Aucun retour à confirmer.";
    }

    if (!totalHistorique) {
        historique.textContent =
            "Aucun historique.";
    }
}


// ======================================================
// CONFIRMATION
// ======================================================

async function confirmerReservation(
    type,
    id
) {

    const configuration =
        obtenirConfigurationReservation(
            type
        );


    if (!configuration) {
        return;
    }


    if (
        !confirm(
            "Confirmer cette réservation ?"
        )
    ) {
        return;
    }


    const {
        error
    } = await supabase
        .from(
            configuration
                .tableReservations
        )
        .update({

            statut:
                "confirme",

            confirmee_par:
                admin.id,

            confirmee_par_nom:
                nomAdmin,

            confirmee_at:
                new Date()
                    .toISOString()
        })
        .eq(
            "id",
            id
        )
        .eq(
            "statut",
            "attente"
        );


    if (error) {

        console.error(error);


        if (
            error.code ===
            "23P01"
        ) {

            alert(
                "Impossible de confirmer : cet élément est déjà réservé sur cette période."
            );

        } else {

            alert(
                "Impossible de confirmer la réservation."
            );
        }

        return;
    }


    await synchroniserGoogle(
        id,
        type,
        "create"
    );


    await chargerDemandes();
}


// ======================================================
// REFUS
// ======================================================

async function refuserReservation(
    type,
    id
) {

    const configuration =
        obtenirConfigurationReservation(
            type
        );


    const motif =
        prompt(
            "Motif du refus :"
        );


    if (
        motif === null
    ) {
        return;
    }


    const {
        error
    } = await supabase
        .from(
            configuration
                .tableReservations
        )
        .update({

            statut:
                "refusee",

            motif_refus:
                motif.trim() ||
                null
        })
        .eq(
            "id",
            id
        )
        .eq(
            "statut",
            "attente"
        );


    if (error) {

        console.error(error);

        alert(
            "Impossible de refuser la demande."
        );

        return;
    }


    await chargerDemandes();
}


// ======================================================
// RETOUR
// ======================================================

async function confirmerRetour(
    type,
    id
) {

    const configuration =
        obtenirConfigurationReservation(
            type
        );


    if (
        !confirm(
            "Confirmer le retour ?"
        )
    ) {
        return;
    }


    const {
        error
    } = await supabase
        .from(
            configuration
                .tableReservations
        )
        .update({

            statut:
                "termine",

            retour_confirme_par:
                admin.id,

            retour_confirme_par_nom:
                nomAdmin,

            retour_confirme_at:
                new Date()
                    .toISOString()
        })
        .eq(
            "id",
            id
        )
        .eq(
            "statut",
            "confirme"
        );


    if (error) {

        console.error(error);

        alert(
            "Impossible de confirmer le retour."
        );

        return;
    }


    await synchroniserGoogle(
        id,
        type,
        "update"
    );


    await chargerDemandes();
}


// ======================================================
// GOOGLE CALENDAR
// ======================================================

async function synchroniserGoogle(
    reservationId,
    reservationType,
    action
) {

    const {
        data,
        error
    } =
        await supabase
            .functions
            .invoke(
                "google-calendar",
                {
                    body: {

                        reservationId,

                        reservationType,

                        action
                    }
                }
            );


    if (error) {

        console.error(
            "Google Calendar :",
            error
        );

        alert(
            "La réservation a été enregistrée mais la synchronisation Google Agenda a échoué."
        );

        return;
    }


    console.log(
        "Google Calendar :",
        data
    );
}


// ======================================================
// EVENTS
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


        const {
            action,
            id,
            type
        } = bouton.dataset;


        bouton.disabled =
            true;


        try {

            if (
                action ===
                "confirmer"
            ) {

                await confirmerReservation(
                    type,
                    id
                );

            } else if (
                action ===
                "refuser"
            ) {

                await refuserReservation(
                    type,
                    id
                );

            } else if (
                action ===
                "retour"
            ) {

                await confirmerRetour(
                    type,
                    id
                );
            }

        } finally {

            bouton.disabled =
                false;
        }
    }
);


// ======================================================
// UTILITAIRES
// ======================================================

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


await chargerDemandes();