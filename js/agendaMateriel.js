import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";


// ======================================================
// AUTHENTIFICATION
// ======================================================

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
// ÉLÉMENTS HTML
// ======================================================

const selectionMaterielAgenda =
    document.querySelector(
        "#selection-materiel-agenda"
    );

const agendaMateriel =
    document.querySelector(
        "#agenda-materiel"
    );

const titreMoisAgenda =
    document.querySelector(
        "#titre-mois-agenda"
    );

const grilleAgenda =
    document.querySelector(
        "#grille-agenda"
    );

const listeReservationsAgenda =
    document.querySelector(
        "#liste-reservations-agenda"
    );

const messageAgenda =
    document.querySelector(
        "#message-agenda"
    );

const boutonMoisPrecedent =
    document.querySelector(
        "#bouton-mois-precedent"
    );

const boutonMoisSuivant =
    document.querySelector(
        "#bouton-mois-suivant"
    );


// ======================================================
// VARIABLES
// ======================================================

let dateMoisAffiche = new Date();

let identifiantMaterielSelectionne = null;


// ======================================================
// INITIALISATION
// ======================================================

async function initialiserAgenda() {

    selectionMaterielAgenda.addEventListener(
        "change",
        selectionnerMateriel
    );

    boutonMoisPrecedent.addEventListener(
        "click",
        afficherMoisPrecedent
    );

    boutonMoisSuivant.addEventListener(
        "click",
        afficherMoisSuivant
    );

    await remplirSelectionMateriel();
}

await initialiserAgenda();


// ======================================================
// MATÉRIEL
// ======================================================

async function recupererMateriels() {

    const { data, error } = await supabase
        .from("materiel")
        .select(`
            id,
            nom,
            etat
        `)
        .order(
            "nom",
            {
                ascending: true
            }
        );

    if (error) {
        throw new Error(
            error.message
        );
    }

    return data;
}


async function remplirSelectionMateriel() {

    try {

        const materiels =
            await recupererMateriels();

        selectionMaterielAgenda.innerHTML = `
            <option value="">
                Sélectionner un matériel
            </option>
        `;

        materiels.forEach((materiel) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                materiel.id;

            option.textContent =
                materiel.nom;

            selectionMaterielAgenda
                .appendChild(option);
        });

    } catch (error) {

        console.error(
            "Erreur chargement matériel :",
            error
        );

        afficherMessageAgenda(
            `Impossible de charger le matériel : ${error.message}`,
            true
        );
    }
}


// ======================================================
// SÉLECTION
// ======================================================

async function selectionnerMateriel() {

    identifiantMaterielSelectionne =
        selectionMaterielAgenda.value ||
        null;

    if (
        !identifiantMaterielSelectionne
    ) {

        agendaMateriel.hidden = true;

        grilleAgenda.replaceChildren();

        listeReservationsAgenda
            .replaceChildren();

        afficherMessageAgenda("");

        return;
    }

    dateMoisAffiche =
        new Date();

    agendaMateriel.hidden = false;

    await afficherAgenda();
}


// ======================================================
// NAVIGATION MOIS
// ======================================================

async function afficherMoisPrecedent() {

    dateMoisAffiche =
        new Date(
            dateMoisAffiche.getFullYear(),
            dateMoisAffiche.getMonth() - 1,
            1
        );

    await afficherAgenda();
}


async function afficherMoisSuivant() {

    dateMoisAffiche =
        new Date(
            dateMoisAffiche.getFullYear(),
            dateMoisAffiche.getMonth() + 1,
            1
        );

    await afficherAgenda();
}


// ======================================================
// RÉSERVATIONS
// ======================================================

async function recupererReservationsMois() {

    const premierJourMois =
        new Date(
            dateMoisAffiche.getFullYear(),
            dateMoisAffiche.getMonth(),
            1,
            0,
            0,
            0,
            0
        );

    const premierJourMoisSuivant =
        new Date(
            dateMoisAffiche.getFullYear(),
            dateMoisAffiche.getMonth() + 1,
            1,
            0,
            0,
            0,
            0
        );


    let requete = supabase
        .from(
            "reservations_materiel"
        )
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
            notes
        `)
        .eq(
            "materiel_id",
            identifiantMaterielSelectionne
        )
        .in(
            "statut",
            [
                "confirme",
                "termine"
            ]
        )
        .lt(
            "date_debut",
            premierJourMoisSuivant
                .toISOString()
        )
        .gt(
            "date_fin",
            premierJourMois
                .toISOString()
        );


    // Sécurité supplémentaire côté client.
    // La RLS doit également appliquer cette règle.

    if (auth.role === "client") {

        requete =
            requete.eq(
                "demandeur_id",
                auth.user.id
            );
    }


    const { data, error } =
        await requete.order(
            "date_debut",
            {
                ascending: true
            }
        );


    if (error) {

        throw new Error(
            error.message
        );
    }

    return data;
}


// ======================================================
// AFFICHAGE GLOBAL
// ======================================================

async function afficherAgenda() {

    afficherMessageAgenda(
        "Chargement de l'agenda..."
    );

    try {

        const reservations =
            await recupererReservationsMois();

        afficherTitreMois();

        construireGrilleAgenda(
            reservations
        );

        afficherListeReservations(
            reservations
        );

        afficherMessageAgenda("");

    } catch (error) {

        console.error(
            "Erreur agenda matériel :",
            error
        );

        afficherMessageAgenda(
            `Impossible de charger l'agenda : ${error.message}`,
            true
        );
    }
}


// ======================================================
// TITRE DU MOIS
// ======================================================

function afficherTitreMois() {

    titreMoisAgenda.textContent =
        new Intl.DateTimeFormat(
            "fr-FR",
            {
                month: "long",
                year: "numeric"
            }
        ).format(
            dateMoisAffiche
        );
}


// ======================================================
// GRILLE
// ======================================================

function construireGrilleAgenda(
    reservations
) {

    grilleAgenda.replaceChildren();

    const annee =
        dateMoisAffiche.getFullYear();

    const mois =
        dateMoisAffiche.getMonth();

    const premierJour =
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

    const decalagePremierJour =
        (
            premierJour.getDay() + 6
        ) % 7;


    // Cases vides avant le 1er jour

    for (
        let index = 0;
        index < decalagePremierJour;
        index += 1
    ) {

        const caseVide =
            document.createElement(
                "div"
            );

        caseVide.className =
            "jour-agenda jour-agenda-vide";

        grilleAgenda.appendChild(
            caseVide
        );
    }


    // Jours du mois

    for (
        let numeroJour = 1;
        numeroJour <= nombreJours;
        numeroJour += 1
    ) {

        const dateJour =
            new Date(
                annee,
                mois,
                numeroJour
            );

        const reservationsJour =
            obtenirReservationsPourDate(
                dateJour,
                reservations
            );


        const caseJour =
            document.createElement(
                "div"
            );

        caseJour.className =
            "jour-agenda";


        const numero =
            document.createElement(
                "strong"
            );

        numero.textContent =
            String(numeroJour);

        caseJour.appendChild(
            numero
        );


        // Aujourd'hui

        if (
            estDateAujourdhui(
                dateJour
            )
        ) {

            caseJour.classList.add(
                "jour-agenda-aujourdhui"
            );
        }


        // Réservation

        if (
            reservationsJour.length > 0
        ) {

            caseJour.classList.add(
                "jour-agenda-reserve"
            );


            const information =
                document.createElement(
                    "span"
                );


            if (
                reservationsJour.length === 1
            ) {

                information.textContent =
                    reservationsJour[0]
                        .nom_reservation;

            } else {

                information.textContent =
                    `${reservationsJour.length} réservations`;
            }


            caseJour.appendChild(
                information
            );


            caseJour.title =
                reservationsJour
                    .map(
                        reservation =>
                            reservation
                                .nom_reservation
                    )
                    .join("\n");
        }


        grilleAgenda.appendChild(
            caseJour
        );
    }
}


// ======================================================
// RÉSERVATIONS D'UN JOUR
// ======================================================

function obtenirReservationsPourDate(
    date,
    reservations
) {

    const debutJour =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0
        );

    const finJour =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1,
            0,
            0,
            0,
            0
        );


    return reservations.filter(
        (reservation) => {

            const debutReservation =
                creerDateDepuisSql(
                    reservation.date_debut
                );

            const finReservation =
                creerDateDepuisSql(
                    reservation.date_fin
                );


            return (
                debutReservation < finJour &&
                finReservation > debutJour
            );
        }
    );
}


// ======================================================
// LISTE DES RÉSERVATIONS
// ======================================================

function afficherListeReservations(
    reservations
) {

    listeReservationsAgenda
        .replaceChildren();


    if (
        reservations.length === 0
    ) {

        listeReservationsAgenda
            .textContent =
                "Aucune réservation confirmée pour ce mois.";

        return;
    }


    reservations.forEach(
        (reservation) => {

            const carte =
                document.createElement(
                    "article"
                );

            carte.className =
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


            const statut =
                document.createElement(
                    "p"
                );

            statut.textContent =
                reservation.statut ===
                    "termine"
                    ? "Statut : Terminée"
                    : "Statut : Confirmée";


            carte.append(
                titre,
                responsable,
                periode,
                statut
            );


            if (
                reservation.destination
            ) {

                const destination =
                    document.createElement(
                        "p"
                    );

                destination.textContent =
                    `Destination : ${reservation.destination}`;

                carte.appendChild(
                    destination
                );
            }


            if (
                reservation.telephone
            ) {

                const telephone =
                    document.createElement(
                        "p"
                    );

                telephone.textContent =
                    `Téléphone : ${reservation.telephone}`;

                carte.appendChild(
                    telephone
                );
            }


            if (
                reservation.notes
            ) {

                const notes =
                    document.createElement(
                        "p"
                    );

                notes.textContent =
                    `Notes : ${reservation.notes}`;

                carte.appendChild(
                    notes
                );
            }


            listeReservationsAgenda
                .appendChild(carte);
        }
    );
}


// ======================================================
// FORMATAGE
// ======================================================

function formaterPeriode(
    reservation
) {

    const dateDebut =
        creerDateDepuisSql(
            reservation.date_debut
        );

    const dateFin =
        creerDateDepuisSql(
            reservation.date_fin
        );


    const formateur =
        new Intl.DateTimeFormat(
            "fr-FR",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );


    return (
        `${formateur.format(dateDebut)} — ` +
        `${formateur.format(dateFin)}`
    );
}


function creerDateDepuisSql(
    dateSql
) {

    if (!dateSql) {

        throw new Error(
            "Date de réservation absente"
        );
    }


    const date =
        new Date(dateSql);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        throw new Error(
            `Date invalide : ${dateSql}`
        );
    }


    return date;
}


function estDateAujourdhui(
    date
) {

    const aujourdHui =
        new Date();


    return (
        date.getFullYear() ===
            aujourdHui.getFullYear() &&

        date.getMonth() ===
            aujourdHui.getMonth() &&

        date.getDate() ===
            aujourdHui.getDate()
    );
}


// ======================================================
// MESSAGE
// ======================================================

function afficherMessageAgenda(
    message,
    estErreur = false
) {

    messageAgenda.textContent =
        message;

    messageAgenda.classList.toggle(
        "message-erreur",
        estErreur
    );
}