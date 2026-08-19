import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";

import {
    obtenirConfigurationReservation
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


// ======================================================
// HTML
// ======================================================

const selectionType =
    document.querySelector(
        "#type-agenda"
    );

const selectionRessource =
    document.querySelector(
        "#selection-ressource-agenda"
    );

const agenda =
    document.querySelector(
        "#agenda-reservations"
    );

const titreMois =
    document.querySelector(
        "#titre-mois-agenda"
    );

const grille =
    document.querySelector(
        "#grille-agenda"
    );

const liste =
    document.querySelector(
        "#liste-reservations-agenda"
    );

const message =
    document.querySelector(
        "#message-agenda"
    );

const moisPrecedent =
    document.querySelector(
        "#bouton-mois-precedent"
    );

const moisSuivant =
    document.querySelector(
        "#bouton-mois-suivant"
    );


// ======================================================
// ÉTAT
// ======================================================

let configuration = null;

let dateMoisAffiche =
    new Date();

let ressourceId =
    null;


// ======================================================
// EVENTS
// ======================================================

selectionType.addEventListener(
    "change",
    changerType
);

selectionRessource.addEventListener(
    "change",
    changerRessource
);

moisPrecedent.addEventListener(
    "click",
    async () => {

        dateMoisAffiche =
            new Date(
                dateMoisAffiche
                    .getFullYear(),
                dateMoisAffiche
                    .getMonth() - 1,
                1
            );

        await afficherAgenda();
    }
);

moisSuivant.addEventListener(
    "click",
    async () => {

        dateMoisAffiche =
            new Date(
                dateMoisAffiche
                    .getFullYear(),
                dateMoisAffiche
                    .getMonth() + 1,
                1
            );

        await afficherAgenda();
    }
);


// ======================================================
// TYPE
// ======================================================

async function changerType() {

    configuration =
        obtenirConfigurationReservation(
            selectionType.value
        );

    ressourceId =
        null;

    agenda.hidden =
        true;

    selectionRessource.innerHTML =
        "";

    grille.replaceChildren();
    liste.replaceChildren();


    if (!configuration) {

        selectionRessource.disabled =
            true;

        selectionRessource.innerHTML = `
            <option value="">
                Choisissez d'abord un type
            </option>
        `;

        return;
    }


    await chargerRessources();
}


async function chargerRessources() {

    let requete =
        supabase
            .from(
                configuration
                    .tableRessources
            )
            .select(
                configuration
                    .colonnesRessource
            )
            .order(
                configuration
                    .colonneTri,
                {
                    ascending: true
                }
            );


    if (configuration.filtreEtat) {

        requete =
            requete.eq(
                "etat",
                "disponible"
            );
    }


    const {
        data,
        error
    } = await requete;


    if (error) {

        afficherMessage(
            error.message,
            true
        );

        return;
    }


    selectionRessource.innerHTML = `
        <option value="">
            Sélectionner
        </option>
    `;


    data.forEach(
        item => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                configuration
                    .obtenirLibelleRessource(
                        item
                    );

            selectionRessource
                .appendChild(
                    option
                );
        }
    );


    selectionRessource.disabled =
        false;
}


async function changerRessource() {

    ressourceId =
        selectionRessource.value ||
        null;


    if (!ressourceId) {

        agenda.hidden =
            true;

        return;
    }


    dateMoisAffiche =
        new Date();

    agenda.hidden =
        false;

    await afficherAgenda();
}


// ======================================================
// CHARGEMENT
// ======================================================

async function recupererReservations() {

    const annee =
        dateMoisAffiche.getFullYear();

    const mois =
        dateMoisAffiche.getMonth();


    let requete =
        supabase
            .from(
                configuration
                    .tableReservations
            )
            .select("*")
            .eq(
                configuration
                    .colonneRessource,
                ressourceId
            )
            .in(
                "statut",
                [
                    "confirme",
                    "termine"
                ]
            );


    if (
        configuration.modeDate ===
        "date"
    ) {

        const debut =
            formaterDateLocale(
                new Date(
                    annee,
                    mois,
                    1
                )
            );

        const suivant =
            formaterDateLocale(
                new Date(
                    annee,
                    mois + 1,
                    1
                )
            );


        requete =
            requete
                .lt(
                    "date_debut",
                    suivant
                )
                .gte(
                    "date_fin",
                    debut
                );

    } else {

        const debut =
            new Date(
                annee,
                mois,
                1
            );

        const suivant =
            new Date(
                annee,
                mois + 1,
                1
            );


        requete =
            requete
                .lt(
                    "date_debut",
                    suivant
                        .toISOString()
                )
                .gt(
                    "date_fin",
                    debut
                        .toISOString()
                );
    }


    const {
        data,
        error
    } =
        await requete.order(
            "date_debut",
            {
                ascending:
                    true
            }
        );


    if (error) {
        throw error;
    }


    return data;
}


// ======================================================
// AFFICHAGE
// ======================================================

async function afficherAgenda() {

    if (
        !configuration ||
        !ressourceId
    ) {
        return;
    }


    afficherMessage(
        "Chargement..."
    );


    try {

        const reservations =
            await recupererReservations();


        titreMois.textContent =
            new Intl.DateTimeFormat(
                "fr-FR",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            ).format(
                dateMoisAffiche
            );


        construireGrille(
            reservations
        );


        afficherListe(
            reservations
        );


        afficherMessage("");


    } catch (error) {

        console.error(error);

        afficherMessage(
            error.message,
            true
        );
    }
}


// ======================================================
// GRILLE
// ======================================================

function construireGrille(
    reservations
) {

    grille.replaceChildren();


    const annee =
        dateMoisAffiche
            .getFullYear();

    const mois =
        dateMoisAffiche
            .getMonth();

    const premier =
        new Date(
            annee,
            mois,
            1
        );

    const nombreJours =
        new Date(
            annee,
            mois + 1,
            0
        ).getDate();


    const decalage =
        (
            premier.getDay() +
            6
        ) % 7;


    for (
        let i = 0;
        i < decalage;
        i += 1
    ) {

        const vide =
            document.createElement(
                "div"
            );

        vide.className =
            "jour-agenda jour-agenda-vide";

        grille.appendChild(
            vide
        );
    }


    for (
        let numero = 1;
        numero <= nombreJours;
        numero += 1
    ) {

        const date =
            new Date(
                annee,
                mois,
                numero
            );


        const reservationsJour =
            reservations.filter(
                reservation =>
                    reservationConcerneJour(
                        reservation,
                        date
                    )
            );


        const caseJour =
            document.createElement(
                "div"
            );

        caseJour.className =
            "jour-agenda";


        const numeroElement =
            document.createElement(
                "strong"
            );

        numeroElement.textContent =
            String(numero);

        caseJour.appendChild(
            numeroElement
        );


        if (
            estAujourdHui(date)
        ) {

            caseJour.classList.add(
                "jour-agenda-aujourdhui"
            );
        }


        if (
            reservationsJour.length
            > 0
        ) {

            caseJour.classList.add(
                "jour-agenda-reserve"
            );


            const information =
                document.createElement(
                    "span"
                );


            information.textContent =
                reservationsJour.length === 1
                    ? reservationsJour[0]
                        .nom_reservation
                    : `${reservationsJour.length} réservations`;


            caseJour.appendChild(
                information
            );
        }


        grille.appendChild(
            caseJour
        );
    }
}


function reservationConcerneJour(
    reservation,
    date
) {

    if (
        configuration.modeDate ===
        "date"
    ) {

        const jour =
            formaterDateLocale(
                date
            );


        return (
            reservation.date_debut
                <= jour &&
            reservation.date_fin
                >= jour
        );
    }


    const debutJour =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );


    const finJour =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1
        );


    const debut =
        new Date(
            reservation.date_debut
        );

    const fin =
        new Date(
            reservation.date_fin
        );


    return (
        debut < finJour &&
        fin > debutJour
    );
}


// ======================================================
// LISTE
// ======================================================

function afficherListe(
    reservations
) {

    liste.replaceChildren();


    if (
        reservations.length === 0
    ) {

        liste.textContent =
            "Aucune réservation confirmée pour ce mois.";

        return;
    }


    reservations.forEach(
        reservation => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "carte-reservation";


            const titre =
                document.createElement(
                    "h3"
                );

            titre.textContent =
                reservation
                    .nom_reservation;


            const responsable =
                document.createElement(
                    "p"
                );

            responsable.textContent =
                `Responsable : ${reservation.responsable}`;


            const periode =
                document.createElement(
                    "p"
                );

            periode.textContent =
                `Période : ${formaterPeriode(reservation)}`;


            article.append(
                titre,
                responsable,
                periode
            );


            if (
                reservation
                    .nombre_passagers
            ) {

                const passagers =
                    document.createElement(
                        "p"
                    );

                passagers.textContent =
                    `Passagers : ${reservation.nombre_passagers}`;

                article.appendChild(
                    passagers
                );
            }


            liste.appendChild(
                article
            );
        }
    );
}


// ======================================================
// FORMATAGE
// ======================================================

function formaterPeriode(
    reservation
) {

    if (
        configuration.modeDate ===
        "date"
    ) {

        return (
            `${formaterDateSimple(reservation.date_debut)} → ` +
            `${formaterDateSimple(reservation.date_fin)}`
        );
    }


    const formateur =
        new Intl.DateTimeFormat(
            "fr-FR",
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "short"
            }
        );


    return (
        `${formateur.format(new Date(reservation.date_debut))} → ` +
        `${formateur.format(new Date(reservation.date_fin))}`
    );
}


function formaterDateSimple(
    valeur
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


function formaterDateLocale(
    date
) {

    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


function estAujourdHui(
    date
) {

    const maintenant =
        new Date();


    return (
        date.getFullYear() ===
            maintenant.getFullYear() &&

        date.getMonth() ===
            maintenant.getMonth() &&

        date.getDate() ===
            maintenant.getDate()
    );
}


function afficherMessage(
    texte,
    erreur = false
) {

    message.textContent =
        texte;

    message.classList.toggle(
        "message-erreur",
        erreur
    );
}