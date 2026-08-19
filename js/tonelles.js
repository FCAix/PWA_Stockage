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
    await insertarMaterial("tonnelles", {
      nombre: document
        .querySelector("#nom-tonnelle")
        .value,

      quantite: 1,

      stockMinim: 0,

      lieu:
        document
          .querySelector("#lieu-tonnelle")
          .value
          .trim() || null,

      estado: "disponible"
    });

    formulaireTonnelle.reset();
    fenetreAjoutTonnelle.close();

    await afficherTonnelles();

    alert("Tonnelle ajoutée correctement");
  } catch (error) {
    console.error(
      "Erreur lors de l'ajout de la tonnelle :",
      error
    );

    alert(`Erreur : ${error.message}`);
  } finally {
    boutonSauvegarderTonnelle.disabled = false;
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
    const tonnelles = await recupererTonnelles();

    listeTonnelles.replaceChildren();

    if (tonnelles.length === 0) {
      listeTonnelles.textContent =
        "Aucune tonnelle enregistrée.";

      return;
    }

    tonnelles.forEach((tonnelle) => {
      const carteTonnelle =
        document.createElement("article");

      carteTonnelle.className =
        "carte-tonnelle";

      const nomTonnelle =
        document.createElement("h2");

      nomTonnelle.textContent =
        tonnelle.nombre;

      const lieuTonnelle =
        document.createElement("p");

      lieuTonnelle.textContent =
        `Lieu : ${tonnelle.ubicacion || "Non renseigné"}`;

      const etatTonnelle =
        document.createElement("p");

      etatTonnelle.textContent =
        `État : ${tonnelle.estado}`;

      carteTonnelle.append(
        nomTonnelle,
        lieuTonnelle,
        etatTonnelle
      );

      listeTonnelles.appendChild(
        carteTonnelle
      );
    });
  } catch (error) {
    console.error(
      "Erreur lors du chargement des tonnelles :",
      error
    );

    listeTonnelles.textContent =
      `Impossible de charger les tonnelles : ${error.message}`;
  }
}