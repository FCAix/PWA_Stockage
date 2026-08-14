import { supabase } from "./supabase.js";

const conteneurMouvements =
  document.querySelector("#mouvements");

async function recupererMouvements() {
  const { data, error } = await supabase
    .from("movimientos_stock")
    .select(`
      id,
      tipo_movimiento,
      cantidad,
      cantidad_anterior,
      cantidad_nueva,
      motivo,
      destino,
      fecha_movimiento,
      material_bodega (
        nom
      ),
      material_general (
        nom
      ),
      tonnelles (
        nombre
      )
    `)
    .order("fecha_movimiento", {
      ascending: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function obtenirNomMateriel(mouvement) {
  return (
    mouvement.material_bodega?.nom ||
    mouvement.material_general?.nom ||
    mouvement.tonnelles?.nombre ||
    "Matériel inconnu"
  );
}

function obtenirCategorieMateriel(mouvement) {
  if (mouvement.material_bodega) {
    return "Bodega";
  }

  if (mouvement.material_general) {
    return "Matériel général";
  }

  if (mouvement.tonnelles) {
    return "Tonnelle";
  }

  return "Inconnue";
}

function traduireTypeMouvement(typeMouvement) {
  const traductions = {
    entrada: "Entrée",
    salida: "Sortie",
    prestamo: "Prêt",
    devolucion: "Retour",
    ajuste_positivo: "Ajustement positif",
    ajuste_negativo: "Ajustement négatif",
    perdida: "Perte",
    deterioro: "Détérioration"
  };

  return traductions[typeMouvement] || typeMouvement;
}

function formaterDate(dateMouvement) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(dateMouvement));
}

function creerCellule(valeur) {
  const cellule = document.createElement("td");

  cellule.textContent =
    valeur === null ||
    valeur === undefined ||
    valeur === ""
      ? "-"
      : String(valeur);

  return cellule;
}

function creerLigneMouvement(mouvement) {
  const ligne = document.createElement("tr");

  ligne.append(
    creerCellule(
      formaterDate(mouvement.fecha_movimiento)
    ),

    creerCellule(
      obtenirNomMateriel(mouvement)
    ),

    creerCellule(
      obtenirCategorieMateriel(mouvement)
    ),

    creerCellule(
      traduireTypeMouvement(
        mouvement.tipo_movimiento
      )
    ),

    creerCellule(mouvement.cantidad),
    creerCellule(mouvement.cantidad_anterior),
    creerCellule(mouvement.cantidad_nueva),
    creerCellule(mouvement.motivo),
    creerCellule(mouvement.destino)
  );

  return ligne;
}

function creerTableauMouvements(mouvements) {
  const tableau = document.createElement("table");
  const entete = document.createElement("thead");
  const ligneEntete = document.createElement("tr");
  const corpsTableau = document.createElement("tbody");

  const titres = [
    "Date",
    "Matériel",
    "Catégorie",
    "Mouvement",
    "Quantité",
    "Avant",
    "Après",
    "Motif",
    "Destination"
  ];

  titres.forEach((titre) => {
    const celluleEntete =
      document.createElement("th");

    celluleEntete.textContent = titre;
    ligneEntete.appendChild(celluleEntete);
  });

  mouvements.forEach((mouvement) => {
    corpsTableau.appendChild(
      creerLigneMouvement(mouvement)
    );
  });

  entete.appendChild(ligneEntete);
  tableau.append(entete, corpsTableau);

  return tableau;
}

async function afficherMouvements() {
  conteneurMouvements.textContent =
    "Chargement des mouvements...";

  try {
    const mouvements =
      await recupererMouvements();

    conteneurMouvements.replaceChildren();

    if (mouvements.length === 0) {
      conteneurMouvements.textContent =
        "Aucun mouvement enregistré.";

      return;
    }

    const tableau =
      creerTableauMouvements(mouvements);

    conteneurMouvements.appendChild(tableau);
  } catch (error) {
    console.error(
      "Erreur lors du chargement des mouvements :",
      error
    );

    conteneurMouvements.textContent =
      `Impossible de charger les mouvements : ${error.message}`;
  }
}

afficherMouvements();