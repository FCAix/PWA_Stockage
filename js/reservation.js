import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";

import {
    obtenirConfigurationReservation
} from "./reservationsConfig.js";


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
// HTML
// ======================================================

const formulaire =
    document.querySelector(
        "#form-reservation"
    );

const selectionType =
    document.querySelector(
        "#type-reservation"
    );

const selectionRessource =
    document.querySelector(
        "#selection-ressource-reservation"
    );

const labelRessource =
    document.querySelector(
        "#label-selection-ressource"
    );

const nomReservation =
    document.querySelector(
        "#nom-reservation"
    );

const responsable =
    document.querySelector(
        "#responsable-reservation"
    );

const telephone =
    document.querySelector(
        "#telephone-reservation"
    );

const destination =
    document.querySelector(
        "#destination-reservation"
    );

const groupePassagers =
    document.querySelector(
        "#groupe-passagers"
    );

const nombrePassagers =
    document.querySelector(
        "#nombre-passagers-reservation"
    );

const dateDebut =
    document.querySelector(
        "#date-debut-reservation"
    );

const dateFin =
    document.querySelector(
        "#date-fin-reservation"
    );

const reservationRepetitive =
    document.querySelector(
        "#reservation-repetitive"
    );

const optionsRepetition =
    document.querySelector(
        "#options-repetition"
    );

const dateFinRepetition =
    document.querySelector(
        "#date-fin-repetition"
    );

const resumeRepetition =
    document.querySelector(
        "#resume-repetition"
    );

const notes =
    document.querySelector(
        "#notes-reservation"
    );

const boutonEnvoyer =
    document.querySelector(
        "#bouton-enregistrer-reservation"
    );

const message =
    document.querySelector(
        "#message-reservation"
    );


// ======================================================
// ÉTAT
// ======================================================

let configurationActuelle = null;

let ressourcesChargees =
    new Map();


// ======================================================
// INITIALISATION
// ======================================================

selectionType.addEventListener(
    "change",
    changerTypeReservation
);

dateDebut.addEventListener(
    "change",
    actualiserDateFinMinimum
);

reservationRepetitive.addEventListener(
    "change",
    basculerRepetition
);

dateDebut.addEventListener(
    "change",
    afficherResumeRepetition
);

dateFinRepetition.addEventListener(
    "change",
    afficherResumeRepetition
);

formulaire.addEventListener(
    "submit",
    envoyerDemande
);


// ======================================================
// TYPE
// ======================================================

async function changerTypeReservation() {

    const type =
        selectionType.value;

    configurationActuelle =
        obtenirConfigurationReservation(
            type
        );


    ressourcesChargees =
        new Map();


    selectionRessource.innerHTML = "";

    dateDebut.value = "";
    dateFin.value = "";


    if (!configurationActuelle) {

        selectionRessource.disabled =
            true;

        selectionRessource.innerHTML = `
            <option value="">
                Choisissez d'abord un type
            </option>
        `;

        groupePassagers.hidden =
            true;

        nombrePassagers.required =
            false;

        return;
    }


    labelRessource.textContent =
        configurationActuelle
            .libelleSelection;


    groupePassagers.hidden =
        !configurationActuelle
            .champPassagers;

    nombrePassagers.required =
        configurationActuelle
            .champPassagers;


    dateDebut.type =
        configurationActuelle
            .modeDate;

    dateFin.type =
        configurationActuelle
            .modeDate;


    appliquerDatesMinimums();


    await chargerRessources();
}


// ======================================================
// RESSOURCES
// ======================================================

async function chargerRessources() {

    afficherMessage(
        "Chargement..."
    );


    let requete = supabase
        .from(
            configurationActuelle
                .tableRessources
        )
        .select(
            configurationActuelle
                .colonnesRessource
        )
        .order(
            configurationActuelle
                .colonneTri,
            {
                ascending: true
            }
        );


    if (
        configurationActuelle
            .filtreEtat
    ) {

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

        console.error(error);

        afficherMessage(
            `Impossible de charger les ${configurationActuelle.libelle.toLowerCase()}.`,
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
        ressource => {

            ressourcesChargees.set(
                ressource.id,
                ressource
            );


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                ressource.id;


            option.textContent =
                configurationActuelle
                    .obtenirLibelleRessource(
                        ressource
                    );


            selectionRessource
                .appendChild(
                    option
                );
        }
    );


    selectionRessource.disabled =
        false;

    afficherMessage("");
}


// ======================================================
// DATES
// ======================================================

function appliquerDatesMinimums() {

    if (!configurationActuelle) {
        return;
    }


    if (
        configurationActuelle
            .modeDate ===
        "date"
    ) {

        const aujourdHui =
            formaterDateLocale(
                new Date()
            );

        dateDebut.min =
            aujourdHui;

        dateFin.min =
            aujourdHui;

    } else {

        const maintenant =
            formaterDateHeureLocale(
                new Date()
            );

        dateDebut.min =
            maintenant;

        dateFin.min =
            maintenant;
    }
}


function actualiserDateFinMinimum() {

    if (!dateDebut.value) {
        return;
    }


    dateFin.min =
        dateDebut.value;


    if (!dateFin.value) {

        if (
            configurationActuelle
                ?.modeDate ===
            "datetime-local"
        ) {

            const debut =
                new Date(
                    dateDebut.value
                );

            debut.setHours(
                debut.getHours() + 1
            );

            dateFin.value =
                formaterDateHeureLocale(
                    debut
                );

        } else {

            dateFin.value =
                dateDebut.value;
        }

        return;
    }


    if (
        convertirValeurDate(
            dateFin.value
        ) <
        convertirValeurDate(
            dateDebut.value
        )
    ) {

        dateFin.value =
            dateDebut.value;
    }
}


function convertirValeurDate(
    valeur
) {

    if (
        configurationActuelle
            ?.modeDate ===
        "date"
    ) {

        return new Date(
            `${valeur}T00:00:00`
        );
    }


    return new Date(valeur);
}


function formaterDateHeureLocale(
    date
) {

    const decalage =
        date.getTimezoneOffset() *
        60000;

    return new Date(
        date.getTime() -
        decalage
    )
        .toISOString()
        .slice(0, 16);
}


function formaterDateLocale(
    date
) {

    const annee =
        date.getFullYear();

    const mois =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const jour =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${annee}-${mois}-${jour}`;
}


// ======================================================
// VÉRIFICATION
// ======================================================

function verifierFormulaire() {

    if (!configurationActuelle) {

        throw new Error(
            "Sélectionnez un type de réservation."
        );
    }


    if (!selectionRessource.value) {

        throw new Error(
            "Sélectionnez un élément à réserver."
        );
    }


    if (
        !dateDebut.value ||
        !dateFin.value
    ) {

        throw new Error(
            "Les dates sont obligatoires."
        );
    }


    const debut =
        convertirValeurDate(
            dateDebut.value
        );

    const fin =
        convertirValeurDate(
            dateFin.value
        );


    if (
        configurationActuelle
            .modeDate ===
        "datetime-local"
    ) {

        if (
            fin.getTime() <=
            debut.getTime()
        ) {

            throw new Error(
                "La date de fin doit être postérieure au début."
            );
        }

    } else {

        if (
            fin.getTime() <
            debut.getTime()
        ) {

            throw new Error(
                "La date de fin doit être postérieure ou égale au début."
            );
        }
    }


    if (
        configurationActuelle
            .champPassagers
    ) {

        const nombre =
            Number(
                nombrePassagers.value
            );

        if (
            !Number.isInteger(nombre) ||
            nombre <= 0
        ) {

            throw new Error(
                "Le nombre de passagers est invalide."
            );
        }


        const minibus =
            ressourcesChargees.get(
                selectionRessource.value
            );


        if (
            minibus?.capacite &&
            nombre > minibus.capacite
        ) {

            throw new Error(
                `Ce minibus possède ${minibus.capacite} places.`
            );
        }
    }
}


// ======================================================
// OBJET DE BASE
// ======================================================

function creerInformationsReservation() {

    const informations = {

        [configurationActuelle
            .colonneRessource]:
            selectionRessource.value,

        demandeur_id:
            auth.user.id,

        nom_reservation:
            nomReservation
                .value
                .trim(),

        responsable:
            responsable
                .value
                .trim(),

        telephone:
            telephone
                .value
                .trim() ||
            null,

        destination:
            destination
                .value
                .trim() ||
            null,

        statut:
            "attente",

        notes:
            notes
                .value
                .trim() ||
            null
    };


    if (
        configurationActuelle
            .champPassagers
    ) {

        informations.nombre_passagers =
            Number(
                nombrePassagers.value
            );
    }


    return informations;
}


// ======================================================
// RÉPÉTITIONS
// ======================================================

function creerReservations() {

    const base =
        creerInformationsReservation();


    const debutInitial =
        convertirValeurDate(
            dateDebut.value
        );

    const finInitial =
        convertirValeurDate(
            dateFin.value
        );


    if (
        !reservationRepetitive
            .checked
    ) {

        return [
            {
                ...base,

                date_debut:
                    serialiserDate(
                        debutInitial
                    ),

                date_fin:
                    serialiserDate(
                        finInitial
                    ),

                serie_id:
                    null
            }
        ];
    }


    if (
        !dateFinRepetition.value
    ) {

        throw new Error(
            "Indiquez la date de fin de répétition."
        );
    }


    const limite =
        new Date(
            `${dateFinRepetition.value}T23:59:59`
        );


    if (
        limite <
        debutInitial
    ) {

        throw new Error(
            "La fin de répétition doit être postérieure à la première réservation."
        );
    }


    const serieId =
        crypto.randomUUID();


    const duree =
        finInitial.getTime() -
        debutInitial.getTime();


    const reservations = [];

    let occurrence =
        new Date(
            debutInitial
        );


    while (
        occurrence <= limite
    ) {

        if (
            reservations.length >=
            104
        ) {

            throw new Error(
                "Une série ne peut pas dépasser 104 réservations."
            );
        }


        const finOccurrence =
            new Date(
                occurrence.getTime() +
                duree
            );


        reservations.push({
            ...base,

            date_debut:
                serialiserDate(
                    occurrence
                ),

            date_fin:
                serialiserDate(
                    finOccurrence
                ),

            serie_id:
                serieId
        });


        const suivante =
            new Date(
                occurrence
            );

        suivante.setDate(
            suivante.getDate() + 7
        );

        occurrence =
            suivante;
    }


    return reservations;
}


function serialiserDate(
    date
) {

    if (
        configurationActuelle
            .modeDate ===
        "date"
    ) {

        return formaterDateLocale(
            date
        );
    }


    return date.toISOString();
}


// ======================================================
// ENVOI
// ======================================================

async function envoyerDemande(
    event
) {

    event.preventDefault();

    boutonEnvoyer.disabled =
        true;

    afficherMessage("");


    try {

        verifierFormulaire();


        const reservations =
            creerReservations();


        const {
            error
        } = await supabase
            .from(
                configurationActuelle
                    .tableReservations
            )
            .insert(
                reservations
            );


        if (error) {
            throw error;
        }


        const nombreDemandes =
            reservations.length;


        formulaire.reset();

        configurationActuelle =
            null;

        ressourcesChargees =
            new Map();

        selectionRessource.disabled =
            true;

        selectionRessource.innerHTML = `
            <option value="">
                Choisissez d'abord un type
            </option>
        `;

        groupePassagers.hidden =
            true;

        optionsRepetition.hidden =
            true;


        afficherMessage(
            nombreDemandes === 1
                ? "Votre demande a été envoyée et attend la validation d'un administrateur."
                : `${nombreDemandes} demandes ont été envoyées et attendent la validation d'un administrateur.`
        );


    } catch (error) {

        console.error(
            "Erreur réservation :",
            error
        );


        afficherMessage(
            error.message ||
            "Impossible d'envoyer la demande.",
            true
        );

    } finally {

        boutonEnvoyer.disabled =
            false;
    }
}


// ======================================================
// RÉPÉTITION
// ======================================================

function basculerRepetition() {

    optionsRepetition.hidden =
        !reservationRepetitive
            .checked;

    dateFinRepetition.required =
        reservationRepetitive
            .checked;


    if (
        !reservationRepetitive
            .checked
    ) {

        dateFinRepetition.value =
            "";

        resumeRepetition.textContent =
            "";

        return;
    }


    afficherResumeRepetition();
}


function afficherResumeRepetition() {

    if (
        !reservationRepetitive
            .checked ||
        !dateDebut.value
    ) {

        resumeRepetition.textContent =
            "";

        return;
    }


    const date =
        convertirValeurDate(
            dateDebut.value
        );


    const jour =
        new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday:
                    "long"
            }
        ).format(date);


    resumeRepetition.textContent =
        `La demande sera répétée chaque ${jour}.`;
}


// ======================================================
// MESSAGE
// ======================================================

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


    message.classList.toggle(
        "message-succes",
        Boolean(texte) &&
        !erreur
    );
}