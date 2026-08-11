import { supabase } from "./supabase.js";
import { insertarMaterial } from "./insertarMaterial.js";
import {enregistrerMouvementStock} from "./mouvementStock.js";

const nomTable = "materiel";
const fenetreAjout = document.querySelector("#fenetre-ajout-mat");
const fenetreModification = document.querySelector("#fenetre-modification-mat");
const boutonFrom = document.querySelector("#bouton-mat");
const boutonAnnuler = document.querySelector("#bouton-annuler-mat");
const boutonSauvegarder = document.querySelector("#bouton-sauv-mat");
const formulaire = document.querySelector("#form-mat");
const listeMateriel = document.querySelector("#liste_materiel");

const formulaireModification = document.querySelector(
  "#form-modification-mat"
);

const identifiantModification = document.querySelector(
  "#identifiant-modification-mat"
);

const nomModification = document.querySelector(
  "#nom-modification-mat"
);

const quantiteModification = document.querySelector(
  "#quantite-modification-mat"
);

const lieuModification = document.querySelector(
  "#lieu-modification-mat"
);

const etatModification = document.querySelector(
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

boutonFrom.addEventListener("click", apparaitreform);
boutonAnnuler.addEventListener("click", annuler);
formulaire.addEventListener("submit", ajoutMat);

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

afficherMateriel();


function apparaitreform() {
  fenetreAjout.showModal();

  document.querySelector("#nom-mat").focus();
}


function annuler() {
  formulaire.reset();
  fenetreAjout.close();
}


async function ajoutMat(event) {
  event.preventDefault();

  boutonSauvegarder.disabled = true;

  try {
    await insertarMaterial(nomTable, {
      nom: document.querySelector("#nom-mat").value,

      quantite: document.querySelector(
        "#quantite-mat"
      ).value,

      lieu:
        document
          .querySelector("#lieu-mat")
          .value.trim() || null,

      etat: "disponible"
    });

    formulaire.reset();
    fenetreAjout.close();;

    await afficherMateriel();

    alert("Matériel ajouté correctement");
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout du matériel :",
      error
    );

    alert(`Erreur : ${error.message}`);
  } finally {
    boutonSauvegarder.disabled = false;
  }
}


async function recupererMateriel() {
  const { data, error } = await supabase
    .from(nomTable)
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


async function afficherMateriel() {
  listeMateriel.innerHTML =
    "<p>Chargement du matériel...</p>";

  try {
    const materiels = await recupererMateriel();

    listeMateriel.innerHTML = "";

    if (materiels.length === 0) {
      listeMateriel.innerHTML =
        "<p>Aucun matériel enregistré.</p>";

      return;
    }

    materiels.forEach((materiel) => {
      const carteMateriel =
        document.createElement("article");

      carteMateriel.className = "carte-materiel";

      const nomMateriel =
        document.createElement("h2");

      nomMateriel.textContent = materiel.nombre;

      const quantiteMateriel =
        document.createElement("p");

      quantiteMateriel.textContent =
        `Quantité : ${materiel.cantidad}`;

      const lieuMateriel =
        document.createElement("p");

      lieuMateriel.textContent =
        `Lieu : ${materiel.ubicacion || "Non renseigné"}`;

      const etatMateriel =
        document.createElement("p");

      etatMateriel.textContent =
        `État : ${materiel.etat}`;

      const boutonModifier =
        document.createElement("button");

      boutonModifier.type = "button";
      boutonModifier.className =
        "bouton-modifier-materiel";
      boutonModifier.dataset.identifiant =
        materiel.id;
      boutonModifier.textContent = "Modifier";

      const boutonSupprimer =
        document.createElement("button");

      boutonSupprimer.type = "button";
      boutonSupprimer.className =
        "bouton-supprimer-materiel";
      boutonSupprimer.dataset.identifiant =
        materiel.id;
      boutonSupprimer.textContent = "Supprimer";

      carteMateriel.append(
        nomMateriel,
        quantiteMateriel,
        lieuMateriel,
        etatMateriel,
        boutonModifier,
        boutonSupprimer
      );

      listeMateriel.appendChild(carteMateriel);
    });
  } catch (error) {
    console.error(
      "Erreur lors du chargement du matériel :",
      error
    );

    listeMateriel.innerHTML =
      "<p>Impossible de charger le matériel.</p>";
  }
}


async function gererBoutonsMateriel(event) {
  const boutonModifier = event.target.closest(
    ".bouton-modifier-materiel"
  );

  const boutonSupprimer = event.target.closest(
    ".bouton-supprimer-materiel"
  );

  if (boutonModifier) {
    await ouvrirModification(
      boutonModifier.dataset.identifiant
    );

    return;
  }

  if (boutonSupprimer) {
    await supprimerMateriel(
      boutonSupprimer.dataset.identifiant
    );
  }
}


async function recupererMaterielParIdentifiant(
  identifiantMateriel
) {
  const { data, error } = await supabase
    .from(nomTable)
    .select("*")
    .eq("id", identifiantMateriel)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


async function ouvrirModification(
  identifiantMateriel
) {
  try {
    const materiel =
      await recupererMaterielParIdentifiant(
        identifiantMateriel
      );

    identifiantModification.value = materiel.id;
    nomModification.value = materiel.nombre;
    quantiteModification.value = materiel.cantidad;
    lieuModification.value =
      materiel.ubicacion || "";
    etatModification.value = materiel.etat;

    fenetreModification.showModal();
    nomModification.focus();
  } catch (error) {
    console.error(
      "Erreur lors de l'ouverture du matériel :",
      error
    );

    alert(`Erreur : ${error.message}`);
  }
}


async function sauvegarderModification(event) {
    event.preventDefault();
    const materielActuel = await recupererMaterielParIdentifiant(identifiantModification.value);

        

    const quantite = Number(quantiteModification.value);
    const differenceQuantite = quantite - materielActuel.cantidad;
        boutonSauvegarderModification.disabled = true;

    if (!Number.isInteger(quantite) || quantite < 0) {
        alert(
        "La quantité doit être un nombre entier positif"
        );

        boutonSauvegarderModification.disabled = false;
        return;
    }

    const informationsModifiees = {
        nombre: nomModification.value.trim(),
        ubicacion:
        lieuModification.value.trim() || null,
        etat: etatModification.value
    };

    try {
        const { error } = await supabase
        .from(nomTable)
        .update(informationsModifiees)
        .eq(
            "id",
            identifiantModification.value
        );

        if (error) {
            throw new Error(error.message);
        }

        if (differenceQuantite > 0) {
            await enregistrerMouvementStock({
                nomTable,
                identifiantMateriel:
                identifiantModification.value,
                typeMouvement: "ajuste_positivo",
                quantite: differenceQuantite,
                motif: "Modification manuelle du stock"
            });
            }

            if (differenceQuantite < 0) {
            await enregistrerMouvementStock({
                nomTable,
                identifiantMateriel:
                identifiantModification.value,
                typeMouvement: "ajuste_negativo",
                quantite: Math.abs(differenceQuantite),
                motif: "Modification manuelle du stock"
            });
            }

        formulaireModification.reset();
        fenetreModification.close();

        await afficherMateriel();

        alert("Matériel modifié correctement");
    } catch (error) {
        console.error(
        "Erreur lors de la modification :",
        error
        );

        alert(`Erreur : ${error.message}`);
    } finally {
        boutonSauvegarderModification.disabled = false;
    }
}


function annulerModification() {
    formulaireModification.reset();
    fenetreModification.close();
}


async function supprimerMateriel(
  identifiantMateriel
) {
  const confirmation = window.confirm(
    "Voulez-vous vraiment supprimer ce matériel ?"
  );

  if (!confirmation) {
    return;
  }

  try {
    const { error } = await supabase
      .from(nomTable)
      .delete()
      .eq("id", identifiantMateriel);

    if (error) {
      throw new Error(error.message);
    }

    await afficherMateriel();

    alert("Matériel supprimé correctement");
  } catch (error) {
    console.error(
      "Erreur lors de la suppression :",
      error
    );

    alert(`Erreur : ${error.message}`);
  }
}