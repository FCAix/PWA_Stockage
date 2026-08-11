import { supabase } from "./supabase.js";

const champsIdentifiantMateriel = {
  material_bodega: "material_bodega_id",
  material_general: "material_general_id",
  materiel:"materiel_id",
  tonnelles: "tonnelle_id"
};

export async function enregistrerMouvementStock({
  nomTable,
  identifiantMateriel,
  typeMouvement,
  quantite,
  motif = null,
  destination = null
}) {
  const champIdentifiant =
    champsIdentifiantMateriel[nomTable];

  if (!champIdentifiant) {
    throw new Error("Table de matériel non autorisée");
  }

  const quantiteNumerique = Number(quantite);

  if (
    !Number.isInteger(quantiteNumerique) ||
    quantiteNumerique <= 0
  ) {
    throw new Error(
      "La quantité du mouvement doit être positive"
    );
  }


  const mouvement = {
    [champIdentifiant]: identifiantMateriel,
    tipo_movimiento: typeMouvement,
    cantidad: quantiteNumerique,
    motivo: motif,
    destino: destination,

  };

  const { data, error } = await supabase
    .from("movimientos_stock")
    .insert(mouvement)
    .select()
    .single();

  if (error) {
    console.error(
      "Erreur lors du mouvement de stock :",
      error
    );

    throw new Error(error.message);
  }

  return data;
}