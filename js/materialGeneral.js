import { supabase } from "./supabase.js";
import { insertarMaterial } from "./insertarMaterial.js";
import {
    enregistrerMouvementStock
} from "./mouvementStock.js";


// ======================================================
// TABLE
// ======================================================

const nomTable = "material_general";


// ======================================================
// ÉLÉMENTS HTML
// ======================================================

const fenetreAjout =
    document.querySelector(
        "#fenetre-ajout-mat"
    );

const fenetreModification =
    document.querySelector(
        "#fenetre-modification-mat"
    );

const boutonForm =
    document.querySelector(
        "#bouton-mat"
    );

const boutonAnnuler =
    document.querySelector(
        "#bouton-annuler-mat"
    );

const boutonSauvegarder =
    document.querySelector(
        "#bouton-sauv-mat"
    );

const formulaire =
    document.querySelector(
        "#form-mat"
    );

const listeMateriel =
    document.querySelector(
        "#liste_materiel"
    );

const formulaireModification =
    document.querySelector(
        "#form-modification-mat"
    );

const identifiantModification =
    document.querySelector(
        "#identifiant-modification-mat"
    );

const nomModification =
    document.querySelector(
        "#nom-modification-mat"
    );

const quantiteModification =
    document.querySelector(
        "#quantite-modification-mat"
    );

const lieuModification =
    document.querySelector(
        "#lieu-modification-mat"
    );

const etatModification =
    document.querySelector(
        "#etat-modification-mat"
    );

const boutonSauvegarderModification =
    document.querySelector(
        "#bouton-sauv-modification-mat"
    );

const boutonAnnulerModification =
    document.querySelector(
        "#bouton-annuler-modification-mat"
    );


// ======================================================
// ÉVÉNEMENTS
// ======================================================

boutonForm.addEventListener(
    "click",
    apparaitreFormulaire
);

boutonAnnuler.addEventListener(
    "click",
    annulerAjout
);

formulaire.addEventListener(
    "submit",
    ajouterMateriel
);

listeMateriel.addEventListener(
    "click",
    gererBoutonsMateriel
);

formulaireModification.addEventListener(
    "submit",
    sauvegarderModification
);

boutonAnnulerModification.addEventListener(
    "click",
    annulerModification
);


// ======================================================
// INITIALISATION
// ======================================================

afficherMateriel();


// ======================================================
// FORMULAIRE AJOUT
// ======================================================

function apparaitreFormulaire() {

    fenetreAjout.showModal();

    document
        .querySelector("#nom-mat")
        .focus();
}


function annulerAjout() {

    formulaire.reset();

    fenetreAjout.close();
}


// ======================================================
// AJOUT MATÉRIEL
// ======================================================

async function ajouterMateriel(event) {

    event.preventDefault();

    boutonSauvegarder.disabled = true;


    try {

        await insertarMaterial(
            nomTable,
            {

                nom:
                    document
                        .querySelector(
                            "#nom-mat"
                        )
                        .value,

                quantite:
                    document
                        .querySelector(
                            "#quantite-mat"
                        )
                        .value,

                lieu:
                    document
                        .querySelector(
                            "#lieu-mat"
                        )
                        .value
                        .trim() ||
                    null,

                etat:
                    "disponible"
            }
        );


        formulaire.reset();

        fenetreAjout.close();


        await afficherMateriel();


        alert(
            "Matériel ajouté correctement"
        );


    } catch (error) {

        console.error(
            "Erreur lors de l'ajout du matériel :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );


    } finally {

        boutonSauvegarder.disabled =
            false;
    }
}


// ======================================================
// RÉCUPÉRER LE MATÉRIEL
// ======================================================

async function recupererMateriel() {

    const {
        data,
        error
    } = await supabase
        .from(nomTable)
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
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
// AFFICHAGE
// ======================================================

async function afficherMateriel() {

    listeMateriel.innerHTML =
        "<p>Chargement du matériel...</p>";


    try {

        const materiels =
            await recupererMateriel();


        listeMateriel.innerHTML =
            "";


        if (
            materiels.length === 0
        ) {

            listeMateriel.innerHTML =
                "<p>Aucun matériel enregistré.</p>";

            return;
        }


        materiels.forEach(
            materiel => {

                const carte =
                    document.createElement(
                        "article"
                    );

                carte.className =
                    "carte-materiel";


                // NOM

                const nom =
                    document.createElement(
                        "h2"
                    );

                nom.textContent =
                    materiel.nombre;


                // QUANTITÉ

                const quantite =
                    document.createElement(
                        "p"
                    );

                quantite.textContent =
                    `Quantité : ${materiel.cantidad}`;


                // LIEU

                const lieu =
                    document.createElement(
                        "p"
                    );

                lieu.textContent =
                    `Lieu : ${materiel.ubicacion || "Non renseigné"}`;


                // ÉTAT

                const etat =
                    document.createElement(
                        "p"
                    );

                etat.textContent =
                    `État : ${materiel.estado}`;


                // MODIFIER

                const boutonModifier =
                    document.createElement(
                        "button"
                    );

                boutonModifier.type =
                    "button";

                boutonModifier.className =
                    "bouton-modifier-materiel";

                boutonModifier.dataset.identifiant =
                    materiel.id;

                boutonModifier.textContent =
                    "Modifier";


                // SUPPRIMER

                const boutonSupprimer =
                    document.createElement(
                        "button"
                    );

                boutonSupprimer.type =
                    "button";

                boutonSupprimer.className =
                    "bouton-supprimer-materiel";

                boutonSupprimer.dataset.identifiant =
                    materiel.id;

                boutonSupprimer.textContent =
                    "Supprimer";


                carte.append(
                    nom,
                    quantite,
                    lieu,
                    etat,
                    boutonModifier,
                    boutonSupprimer
                );


                listeMateriel.appendChild(
                    carte
                );
            }
        );


    } catch (error) {

        console.error(
            "Erreur chargement matériel général :",
            error
        );


        listeMateriel.innerHTML =
            "<p>Impossible de charger le matériel.</p>";
    }
}


// ======================================================
// BOUTONS
// ======================================================

async function gererBoutonsMateriel(
    event
) {

    const boutonModifier =
        event.target.closest(
            ".bouton-modifier-materiel"
        );

    const boutonSupprimer =
        event.target.closest(
            ".bouton-supprimer-materiel"
        );


    if (boutonModifier) {

        await ouvrirModification(
            boutonModifier
                .dataset
                .identifiant
        );

        return;
    }


    if (boutonSupprimer) {

        await supprimerMateriel(
            boutonSupprimer
                .dataset
                .identifiant
        );
    }
}


// ======================================================
// RÉCUPÉRER UN MATÉRIEL
// ======================================================

async function recupererMaterielParIdentifiant(
    identifiantMateriel
) {

    const {
        data,
        error
    } = await supabase
        .from(nomTable)
        .select("*")
        .eq(
            "id",
            identifiantMateriel
        )
        .single();


    if (error) {

        throw new Error(
            error.message
        );
    }


    return data;
}


// ======================================================
// OUVRIR MODIFICATION
// ======================================================

async function ouvrirModification(
    identifiantMateriel
) {

    try {

        const materiel =
            await recupererMaterielParIdentifiant(
                identifiantMateriel
            );


        identifiantModification.value =
            materiel.id;

        nomModification.value =
            materiel.nombre;

        quantiteModification.value =
            materiel.cantidad;

        lieuModification.value =
            materiel.ubicacion ||
            "";

        etatModification.value =
            materiel.estado;


        fenetreModification.showModal();

        nomModification.focus();


    } catch (error) {

        console.error(
            "Erreur ouverture matériel :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );
    }
}


// ======================================================
// SAUVEGARDER MODIFICATION
// ======================================================

async function sauvegarderModification(
    event
) {

    event.preventDefault();


    boutonSauvegarderModification.disabled =
        true;


    try {

        const materielActuel =
            await recupererMaterielParIdentifiant(
                identifiantModification.value
            );


        const nouvelleQuantite =
            Number(
                quantiteModification.value
            );


        if (
            !Number.isInteger(
                nouvelleQuantite
            ) ||
            nouvelleQuantite < 0
        ) {

            alert(
                "La quantité doit être un nombre entier positif"
            );

            return;
        }


        const differenceQuantite =
            nouvelleQuantite -
            materielActuel.cantidad;


        // Informations hors stock

        const informationsModifiees = {

            nombre:
                nomModification
                    .value
                    .trim(),

            ubicacion:
                lieuModification
                    .value
                    .trim() ||
                null,

            estado:
                etatModification
                    .value
        };


        const {
            error
        } = await supabase
            .from(nomTable)
            .update(
                informationsModifiees
            )
            .eq(
                "id",
                identifiantModification.value
            );


        if (error) {

            throw new Error(
                error.message
            );
        }


        // ==============================
        // AJUSTEMENT STOCK POSITIF
        // ==============================

        if (
            differenceQuantite > 0
        ) {

            await enregistrerMouvementStock({

                nomTable,

                identifiantMateriel:
                    identifiantModification
                        .value,

                typeMouvement:
                    "ajuste_positivo",

                quantite:
                    differenceQuantite,

                motif:
                    "Modification manuelle du stock"
            });
        }


        // ==============================
        // AJUSTEMENT STOCK NÉGATIF
        // ==============================

        if (
            differenceQuantite < 0
        ) {

            await enregistrerMouvementStock({

                nomTable,

                identifiantMateriel:
                    identifiantModification
                        .value,

                typeMouvement:
                    "ajuste_negativo",

                quantite:
                    Math.abs(
                        differenceQuantite
                    ),

                motif:
                    "Modification manuelle du stock"
            });
        }


        formulaireModification.reset();

        fenetreModification.close();


        await afficherMateriel();


        alert(
            "Matériel modifié correctement"
        );


    } catch (error) {

        console.error(
            "Erreur modification matériel :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );


    } finally {

        boutonSauvegarderModification.disabled =
            false;
    }
}


// ======================================================
// ANNULER MODIFICATION
// ======================================================

function annulerModification() {

    formulaireModification.reset();

    fenetreModification.close();
}


// ======================================================
// SUPPRIMER
// ======================================================

async function supprimerMateriel(
    identifiantMateriel
) {

    const confirmation =
        window.confirm(
            "Voulez-vous vraiment supprimer ce matériel ?"
        );


    if (!confirmation) {
        return;
    }


    try {

        const {
            error
        } = await supabase
            .from(nomTable)
            .delete()
            .eq(
                "id",
                identifiantMateriel
            );


        if (error) {

            throw new Error(
                error.message
            );
        }


        await afficherMateriel();


        alert(
            "Matériel supprimé correctement"
        );


    } catch (error) {

        console.error(
            "Erreur suppression matériel :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );
    }
}