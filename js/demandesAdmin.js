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
function regrouperSeriesEnAttente(demandes) {

    const resultat = [];
    const groupes = new Map();

    for (const demande of demandes) {

        // Les réservations sans répétition et celles déjà
        // confirmées restent des réservations individuelles.
        if (
            demande.statut !== "attente" ||
            !demande.serie_id
        ) {
            resultat.push(demande);
            continue;
        }

        const cle =
            `${demande._type}:${demande.serie_id}`;

        let groupe = groupes.get(cle);

        if (!groupe) {

            groupe = {
                ...demande,
                _occurrences: []
            };

            groupes.set(cle, groupe);
            resultat.push(groupe);
        }

        groupe._occurrences.push(demande);
    }

    // Afficher les occurrences dans l'ordre chronologique.
    for (const groupe of groupes.values()) {

        groupe._occurrences.sort(
            (a, b) =>
                new Date(a.date_debut) -
                new Date(b.date_debut)
        );
    }

    return resultat;
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


    const occurrences = demande._occurrences ?? [demande];

    const dates =
        document.createElement(
            "p"
        );

    dates.textContent =
        occurrences.length > 1
            ? `Demande hebdomadaire — ${occurrences.length} réservations`
            : `Du ${formaterDate(
                demande.date_debut,
                demande._modeDate
            )} au ${formaterDate(
                demande.date_fin,
                demande._modeDate
            )}`;

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

    if (occurrences.length > 1) {

        const details =
            document.createElement("details");

        const resume =
            document.createElement("summary");

        resume.textContent =
            "Afficher les dates de la série";

        const liste =
            document.createElement("ul");

        for (const occurrence of occurrences) {

            const element =
                document.createElement("li");

            element.textContent =
                `Du ${formaterDate(
                    occurrence.date_debut,
                    occurrence._modeDate
                )} au ${formaterDate(
                    occurrence.date_fin,
                    occurrence._modeDate
                )}`;

            liste.appendChild(element);
        }

        details.append(resume, liste);
        article.appendChild(details);
    }


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

    bouton.dataset.serieId =
        demande.serie_id ?? "";

    bouton.dataset.nombreOccurrences =
        String(
            demande._occurrences?.length ?? 1
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

    const demandesAffichage = regrouperSeriesEnAttente(demandes);

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

async function confirmerReservation(type, id) {

    if (!obtenirConfigurationReservation(type)) {
        return;
    }

    if (!confirm(
        "Confirmer cette demande ? Si elle est hebdomadaire, toutes les occurrences seront créées et confirmées."
    )) {
        return;
    }

    try {

        const { data, error } = await supabase.rpc(
            "confirmer_serie_reservation",
            {
                p_type: type,
                p_reservation_id: id
            }
        );

        if (error) {
            throw error;
        }

        // La fonction SQL renvoie l'identifiant
        // de chaque réservation confirmée ou créée.
        for (const ligne of (data ?? [])) {
            await synchroniserGoogle(
                ligne.reservation_id,
                type,
                "create"
            );
        }

        await chargerDemandes();

    } catch (error) {

        console.error(
            "Erreur de confirmation :",
            error
        );

        if (error.code === "23P01") {
            alert(
                "Une occurrence de cette série entre en conflit avec une autre réservation. La série entière a été annulée."
            );
        } else {
            alert(
                `Impossible de confirmer la demande : ${error.message}`
            );
        }
    }
}


// ======================================================
// REFUS
// ======================================================

async function refuserReservation(
    type,
    id,
    serieId = null,
    nombreOccurrences = 1
) {

    const configuration =
        obtenirConfigurationReservation(type);

    if (!configuration) {
        return;
    }

    const motif = prompt(
        serieId
            ? `Motif du refus des ${nombreOccurrences} réservations :`
            : "Motif du refus :"
    );

    if (motif === null) {
        return;
    }

    try {

        let requete = supabase
            .from(configuration.tableReservations)
            .update({
                statut: "refusee",
                motif_refus: motif.trim() || null
            })
            .eq("statut", "attente");

        if (serieId) {
            requete = requete.eq("serie_id", serieId);
        } else {
            requete = requete.eq("id", id);
        }

        const { data, error } =
            await requete.select("id");

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {
            alert(
                "Aucune demande en attente n'a été trouvée."
            );
            return;
        }

        await chargerDemandes();

    } catch (error) {

        console.error(
            "Erreur de refus :",
            error
        );

        alert(
            `Impossible de refuser la demande : ${error.message}`
        );
    }
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
    } = await supabase
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

        let details = null;

        try {

            if (error.context) {
                details =
                    await error.context.json();
            }

        } catch (contextError) {

            console.error(
                "Impossible de lire le détail de l'erreur :",
                contextError
            );
        }


        console.error(
            "Google Calendar :",
            error
        );

        console.error(
            "Détail Edge Function :",
            details
        );


        alert(
            details?.error
                ?? error.message
                ?? "Erreur Google Agenda"
        );

        return;
    }


    console.log(
        "Google Calendar :",
        data
    );
};

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
            type,
            serieId,
            nombreOccurrences
        } = bouton.dataset;

        const identifiantSerie =
            serieId || null;

        const nombre =
            Number(nombreOccurrences || 1);


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