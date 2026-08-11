import { supabase } from "./supabase.js";

import {
  enregistrerMouvementStock
} from "./mouvementStock.js";

export async function insertarMaterial(table, donnee) {
  if (!table) {
    throw new Error("La table n'est pas définie");
  }

  if (!donnee.nom?.trim()) {
    throw new Error("Le nom est obligatoire");
  }

  const quantiteInitiale =
    Number(donnee.quantite ?? 0);

  if (
    !Number.isInteger(quantiteInitiale) ||
    quantiteInitiale < 0
  ) {
    throw new Error(
      "La quantité doit être un nombre entier positif"
    );
  }

  const materiel = {
    nom: donnee.nom.trim(),

    // The movement trigger will update this quantity.
    cantidad: 0,

    stock_minimo:
      Number(donnee.stockMinim ?? 0),

    ubicacion:
      donnee.lieu?.trim() || null,

    etat:
      donnee.etat || "disponible"
  };

  const { data, error } = await supabase
    .from(table)
    .insert(materiel)
    .select()
    .single();

  if (error) {
    console.error("Erreur Supabase :", error);
    throw new Error(error.message);
  }

  if (quantiteInitiale > 0) {
    try {
      await enregistrerMouvementStock({
        nomTable: table,
        identifiantMateriel: data.id,
        typeMouvement: "entrada",
        quantite: quantiteInitiale,
        motif: "Stock initial"
      });
    } catch (erreurMouvement) {
      // Remove the material if its initial movement failed.
      await supabase
        .from(table)
        .delete()
        .eq("id", data.id);

      throw erreurMouvement;
    }
  }

  return data;
}