export const typesReservation = {

    materiel: {
        cle: "materiel",
        libelle: "Matériel",
        libelleSelection: "Sélectionnez un matériel",

        tableReservations:
            "reservations_materiel",

        tableRessources:
            "materiel",

        colonneRessource:
            "materiel_id",

        colonnesRessource:
            "id, nom, etat",

        colonneTri:
            "nom",

        filtreEtat:
            true,

        modeDate:
            "datetime-local",

        champPassagers:
            false,

        obtenirLibelleRessource(ressource) {
            return ressource.nom;
        }
    },


    minibus: {
        cle: "minibus",
        libelle: "Minibus",
        libelleSelection: "Sélectionnez un minibus",

        tableReservations:
            "reservations_minibus",

        tableRessources:
            "minibus",

        colonneRessource:
            "minibus_id",

        colonnesRessource:
            "id, immatriculation, nom, capacite, etat",

        colonneTri:
            "immatriculation",

        filtreEtat:
            true,

        modeDate:
            "datetime-local",

        champPassagers:
            true,

        obtenirLibelleRessource(ressource) {

            let texte =
                ressource.immatriculation;

            if (ressource.nom) {
                texte += ` — ${ressource.nom}`;
            }

            if (ressource.capacite) {
                texte += ` (${ressource.capacite} places)`;
            }

            return texte;
        }
    },


    tonnelle: {
        cle: "tonnelle",
        libelle: "Tonnelle",
        libelleSelection: "Sélectionnez une tonnelle",

        tableReservations:
            "reservations_tonnelles",

        tableRessources:
            "tonnelles",

        colonneRessource:
            "tonnelle_id",

        colonnesRessource:
            "id, nombre",

        colonneTri:
            "nombre",

        filtreEtat:
            false,

        modeDate:
            "date",

        champPassagers:
            false,

        obtenirLibelleRessource(ressource) {
            return String(
                ressource.nombre
            );
        }
    }
};


export function obtenirConfigurationReservation(
    type
) {

    return typesReservation[type] ?? null;
}


export function obtenirTypesReservation() {

    return Object.values(
        typesReservation
    );
}