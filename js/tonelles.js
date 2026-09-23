import { supabase } from "./supabase.js";
import { insertarMaterial } from "./insertarMaterial.js";

const boutonTonnelle = document.querySelector(
  "#bouton-tonnelle");

const boutonAnnulerTonnelle = document.querySelector(
  "#bouton-annuler-tonnelle");

const boutonSauvegarderTonnelle =
  document.querySelector(
    "#bouton-sauv-tonnelle");

const formulaireTonnelle = document.querySelector(
  "#form-tonnelle"
);

const fenetreAjoutTonnelle = document.querySelector(
  "#fenetre-ajout-tonnelle"
);

const listeTonnelles = document.querySelector(
  "#liste-tonnelles"
);

boutonTonnelle.addEventListener(
  "click",
  apparaitreFormulaireTonnelle
);

boutonAnnulerTonnelle.addEventListener(
  "click",
  annulerAjoutTonnelle
);

formulaireTonnelle.addEventListener(
  "submit",
  ajouterTonnelle
);

fenetreAjoutTonnelle.addEventListener(
  "click",
  fermerFormulaireEnCliquantDehors
);

afficherTonnelles();


function apparaitreFormulaireTonnelle() {
  fenetreAjoutTonnelle.showModal();

  document
    .querySelector("#nom-tonnelle")
    .focus();
}


function annulerAjoutTonnelle() {
  formulaireTonnelle.reset();
  fenetreAjoutTonnelle.close();
}


function fermerFormulaireEnCliquantDehors(event) {
  if (event.target !== fenetreAjoutTonnelle) {
    return;
  }

  annulerAjoutTonnelle();
}


async function ajouterTonnelle(event) {

    event.preventDefault();

    boutonSauvegarderTonnelle.disabled = true;

    try {

        const nom = document
            .querySelector("#nom-tonnelle")
            .value
            .trim();

        const lieu = document
            .querySelector("#lieu-tonnelle")
            .value
            .trim();


        if (!nom) {
            throw new Error(
                "Le nom de la tonnelle est obligatoire"
            );
        }


        const nouvelleTonnelle = {

            nombre: nom,

            ubicacion:
                lieu || null,

            estado:
                "disponible"
        };


        const {
            data,
            error
        } = await supabase
            .from("tonnelles")
            .insert(
                nouvelleTonnelle
            )
            .select()
            .single();


        if (error) {

            console.error(
                "Erreur Supabase :",
                error
            );

            throw new Error(
                error.message
            );
        }


        console.log(
            "Tonnelle créée :",
            data
        );


        formulaireTonnelle.reset();

        fenetreAjoutTonnelle.close();


        await afficherTonnelles();


        alert(
            "Tonnelle ajoutée correctement"
        );


    } catch (error) {

        console.error(
            "Erreur lors de l'ajout de la tonnelle :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );


    } finally {

        boutonSauvegarderTonnelle.disabled =
            false;
    }
}


async function recupererTonnelles() {
  const { data, error } = await supabase
    .from("tonnelles")
    .select(`
      id,
      nombre,
      ubicacion,
      estado
    `)
    .neq("estado", "supprime")
    .order("nombre", {
      ascending: true
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


async function afficherTonnelles() {

    listeTonnelles.textContent =
        "Chargement des tonnelles...";

    try {

        const tonnelles =
            await recupererTonnelles();


        listeTonnelles.replaceChildren();


        if (tonnelles.length === 0) {

            listeTonnelles.textContent =
                "Aucune tonnelle enregistrée.";

            return;
        }


        tonnelles.forEach(
            (tonnelle) => {

                const carteTonnelle =
                    document.createElement("article");

                carteTonnelle.className =
                    "carte-tonnelle";


                // =========================================
                // NOM
                // =========================================

                const nomTonnelle =
                    document.createElement("h2");

                nomTonnelle.textContent =
                    tonnelle.nombre;


                // =========================================
                // LIEU
                // =========================================

                const lieuTonnelle =
                    document.createElement("p");

                lieuTonnelle.textContent =
                    `Lieu : ${
                        tonnelle.ubicacion ||
                        "Non renseigné"
                    }`;


                // =========================================
                // ÉTAT
                // =========================================

                const etatTonnelle =
                    document.createElement("p");

                etatTonnelle.textContent =
                    `État : ${
                        tonnelle.estado
                    }`;


                // =========================================
                // CONTENEUR BOUTONS
                // =========================================

                const actions =
                    document.createElement("div");

                actions.className =
                    "actions-tonnelle";


                // =========================================
                // BOUTON MODIFIER
                // =========================================

                const boutonModifier =
                    document.createElement("button");

                boutonModifier.type =
                    "button";

                boutonModifier.className =
                    "bouton-modifier-tonnelle";

                boutonModifier.textContent =
                    "Modifier";


                boutonModifier.addEventListener(
                    "click",
                    () => {

                        ouvrirModificationTonnelle(
                            tonnelle
                        );

                    }
                );


                // =========================================
                // BOUTON SUPPRIMER
                // =========================================

                const boutonSupprimer =
                    document.createElement("button");

                boutonSupprimer.type =
                    "button";

                boutonSupprimer.className =
                    "bouton-supprimer-tonnelle";

                boutonSupprimer.textContent =
                    "Supprimer";


                boutonSupprimer.addEventListener(
                    "click",
                    () => {

                        supprimerTonnelle(
                            tonnelle.id,
                            tonnelle.nombre
                        );

                    }
                );


                actions.append(
                    boutonModifier,
                    boutonSupprimer
                );


                // =========================================
                // CARTE
                // =========================================

                carteTonnelle.append(
                    nomTonnelle,
                    lieuTonnelle,
                    etatTonnelle,
                    actions
                );


                listeTonnelles.appendChild(
                    carteTonnelle
                );
            }
        );


    } catch (error) {

        console.error(
            "Erreur lors du chargement des tonnelles :",
            error
        );


        listeTonnelles.textContent =
            `Impossible de charger les tonnelles : ${error.message}`;
    }
}

async function supprimerTonnelle(
    tonnelleId,
    nomTonnelle
) {

    const confirmation =
        window.confirm(
            `Voulez-vous vraiment supprimer "${nomTonnelle}" ?\n\n` +
            `La tonnelle sera retirée des listes et ` +
            `ses réservations futures seront supprimées.`
        );


    if (!confirmation) {
        return;
    }


    try {

        const {
            error
        } = await supabase
            .from("tonnelles")
            .update({
                estado: "supprime"
            })
            .eq(
                "id",
                tonnelleId
            );


        if (error) {
            throw error;
        }


        await afficherTonnelles();


        alert(
            "Tonnelle supprimée correctement."
        );


    } catch (error) {

        console.error(
            "Erreur suppression tonnelle :",
            error
        );


        alert(
            `Erreur : ${error.message}`
        );
    }
}

async function modifierTonnelle(
    tonnelleId,
    nombre,
    ubicacion,
    estado
) {

    try {

        const { error } = await supabase
            .from("tonnelles")
            .update({
                nombre: nombre.trim(),
                ubicacion:
                    ubicacion.trim() || null,
                estado
            })
            .eq(
                "id",
                tonnelleId
            );

        if (error) {
            throw error;
        }

        await afficherTonnelles();

    } catch (error) {

        console.error(
            "Erreur modification tonnelle :",
            error
        );

        alert(
            `Erreur : ${error.message}`
        );
    }
}

async function ouvrirModificationTonnelle(
    tonnelle
) {

    const nouveauNom =
        window.prompt(
            "Nom de la tonnelle :",
            tonnelle.nombre
        );


    if (
        nouveauNom === null
    ) {
        return;
    }


    const nouveauLieu =
        window.prompt(
            "Lieu :",
            tonnelle.ubicacion || ""
        );


    if (
        nouveauLieu === null
    ) {
        return;
    }


    const {
        error
    } = await supabase
        .from("tonnelles")
        .update({

            nombre:
                nouveauNom.trim(),

            ubicacion:
                nouveauLieu.trim() || null

        })
        .eq(
            "id",
            tonnelle.id
        );


    if (error) {

        console.error(
            "Erreur modification tonnelle :",
            error
        );

        alert(
            `Erreur : ${error.message}`
        );

        return;
    }


    await afficherTonnelles();

    alert(
        "Tonnelle modifiée correctement."
    );
}