import { supabase } from "./supabase.js";
import { requireAuth } from "./authGuard.js";


// ======================================================
// AUTHENTIFICATION
// ======================================================

const auth = await requireAuth([
    "admin"
]);

if (!auth) {
    throw new Error(
        "Accès administrateur requis"
    );
}


// ======================================================
// ÉTAT
// ======================================================

let produitsBodega = [];


// ======================================================
// HTML
// ======================================================

const listeStock =
    document.querySelector(
        "#liste-stock-bodega"
    );

const rechercheProduit =
    document.querySelector(
        "#recherche-produit"
    );


const resumeNombreProduits =
    document.querySelector(
        "#resume-nombre-produits"
    );

const resumeStockFaible =
    document.querySelector(
        "#resume-stock-faible"
    );

const resumeRecettesJour =
    document.querySelector(
        "#resume-recettes-jour"
    );

const resumeRecettesMois =
    document.querySelector(
        "#resume-recettes-mois"
    );


// LIVRAISON

const boutonNouvelleLivraison =
    document.querySelector(
        "#bouton-nouvelle-livraison"
    );

const dialogLivraison =
    document.querySelector(
        "#dialog-nouvelle-livraison"
    );

const formulaireLivraison =
    document.querySelector(
        "#form-nouvelle-livraison"
    );

const produitsLivraison =
    document.querySelector(
        "#produits-livraison"
    );

const referenceLivraison =
    document.querySelector(
        "#reference-livraison"
    );

const fournisseurLivraison =
    document.querySelector(
        "#fournisseur-livraison"
    );

const notesLivraison =
    document.querySelector(
        "#notes-livraison"
    );

const messageLivraison =
    document.querySelector(
        "#message-livraison"
    );

const boutonFermerLivraison =
    document.querySelector(
        "#bouton-fermer-livraison"
    );

const boutonAnnulerLivraison =
    document.querySelector(
        "#bouton-annuler-livraison"
    );

const boutonEnregistrerLivraison =
    document.querySelector(
        "#bouton-enregistrer-livraison"
    );


// VENTE

const boutonDeclarerVente =
    document.querySelector(
        "#bouton-declarer-vente"
    );

const dialogVente =
    document.querySelector(
        "#dialog-declarer-vente"
    );

const formulaireVente =
    document.querySelector(
        "#form-declarer-vente"
    );

const produitsVente =
    document.querySelector(
        "#produits-vente"
    );

const referenceVente =
    document.querySelector(
        "#reference-vente"
    );

const notesVente =
    document.querySelector(
        "#notes-vente"
    );

const messageVente =
    document.querySelector(
        "#message-vente"
    );

const totalVente =
    document.querySelector(
        "#total-vente"
    );

const boutonFermerVente =
    document.querySelector(
        "#bouton-fermer-vente"
    );

const boutonAnnulerVente =
    document.querySelector(
        "#bouton-annuler-vente"
    );

const boutonEnregistrerVente =
    document.querySelector(
        "#bouton-enregistrer-vente"
    );


// PRODUIT

const boutonNouveauProduit =
    document.querySelector(
        "#bouton-nouveau-produit"
    );

const dialogProduit =
    document.querySelector(
        "#dialog-nouveau-produit"
    );

const formulaireProduit =
    document.querySelector(
        "#form-nouveau-produit"
    );

const boutonFermerProduit =
    document.querySelector(
        "#bouton-fermer-produit"
    );

const boutonAnnulerProduit =
    document.querySelector(
        "#bouton-annuler-produit"
    );

const messageProduit =
    document.querySelector(
        "#message-produit"
    );


// HISTORIQUE

const listeVentes =
    document.querySelector(
        "#liste-ventes-bodega"
    );

const listeLivraisons =
    document.querySelector(
        "#liste-livraisons-bodega"
    );


// FICHE VENTE

const dialogFicheVente =
    document.querySelector(
        "#dialog-fiche-vente"
    );


// FICHE LIVRAISON

const dialogFicheLivraison =
    document.querySelector(
        "#dialog-fiche-livraison"
    );


// ======================================================
// ÉVÉNEMENTS
// ======================================================

boutonNouvelleLivraison.addEventListener(
    "click",
    ouvrirNouvelleLivraison
);

boutonFermerLivraison.addEventListener(
    "click",
    fermerNouvelleLivraison
);

boutonAnnulerLivraison.addEventListener(
    "click",
    fermerNouvelleLivraison
);

formulaireLivraison.addEventListener(
    "submit",
    enregistrerLivraison
);


boutonDeclarerVente.addEventListener(
    "click",
    ouvrirDeclarationVente
);

boutonFermerVente.addEventListener(
    "click",
    fermerDeclarationVente
);

boutonAnnulerVente.addEventListener(
    "click",
    fermerDeclarationVente
);

formulaireVente.addEventListener(
    "submit",
    enregistrerVente
);

produitsVente.addEventListener(
    "input",
    calculerTotalVente
);


boutonNouveauProduit.addEventListener(
    "click",
    () => {
        dialogProduit.showModal();
    }
);

boutonFermerProduit.addEventListener(
    "click",
    fermerNouveauProduit
);

boutonAnnulerProduit.addEventListener(
    "click",
    fermerNouveauProduit
);

formulaireProduit.addEventListener(
    "submit",
    enregistrerNouveauProduit
);


rechercheProduit.addEventListener(
    "input",
    filtrerProduits
);


listeVentes.addEventListener(
    "click",
    gererClicHistorique
);

listeLivraisons.addEventListener(
    "click",
    gererClicHistorique
);


document
    .querySelector(
        "#bouton-fermer-fiche-vente"
    )
    .addEventListener(
        "click",
        () => {
            dialogFicheVente.close();
        }
    );


document
    .querySelector(
        "#bouton-fermer-fiche-livraison"
    )
    .addEventListener(
        "click",
        () => {
            dialogFicheLivraison.close();
        }
    );


// ======================================================
// CHARGEMENT GLOBAL
// ======================================================

async function chargerBodega() {

    await Promise.all([

        chargerProduits(),

        chargerHistoriqueVentes(),

        chargerHistoriqueLivraisons(),

        chargerResumeRecettes()

    ]);
}


// ======================================================
// PRODUITS
// ======================================================

async function chargerProduits() {

    const {
        data,
        error
    } = await supabase
        .from("material_bodega")
        .select(`
            id,
            nom,
            referencia,
            categoria,
            descripcion,
            cantidad,
            stock_minimo,
            unidad,
            ubicacion,
            proveedor,
            precio_unitario,
            etat,
            notas
        `)
        .order(
            "nom",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Erreur chargement produits :",
            error
        );

        listeStock.textContent =
            "Impossible de charger le stock.";

        return;
    }


    produitsBodega =
        data ?? [];


    afficherProduits(
        produitsBodega
    );


    actualiserResumeStock();
}


// ======================================================
// AFFICHAGE PRODUITS
// ======================================================

function afficherProduits(
    produits
) {

    listeStock.replaceChildren();


    if (
        produits.length === 0
    ) {

        listeStock.textContent =
            "Aucun produit enregistré.";

        return;
    }


    produits.forEach(
        produit => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "carte-stock-bodega";


            if (
                produit.cantidad <=
                produit.stock_minimo
            ) {

                article.classList.add(
                    "stock-faible"
                );
            }


            const haut =
                document.createElement(
                    "div"
                );

            haut.className =
                "carte-stock-haut";


            const titre =
                document.createElement(
                    "h3"
                );

            titre.textContent =
                produit.nom;


            const quantite =
                document.createElement(
                    "strong"
                );

            quantite.className =
                "quantite-stock";

            quantite.textContent =
                `${produit.cantidad} ${produit.unidad ?? ""}`;


            haut.append(
                titre,
                quantite
            );


            article.appendChild(
                haut
            );


            if (
                produit.categoria
            ) {

                ajouterTexte(
                    article,
                    `Catégorie : ${produit.categoria}`
                );
            }


            if (
                produit.referencia
            ) {

                ajouterTexte(
                    article,
                    `Référence : ${produit.referencia}`
                );
            }


            ajouterTexte(
                article,
                `Prix : ${formaterMonnaie(produit.precio_unitario)}`
            );


            ajouterTexte(
                article,
                `Stock minimum : ${produit.stock_minimo}`
            );


            if (
                produit.ubicacion
            ) {

                ajouterTexte(
                    article,
                    `Emplacement : ${produit.ubicacion}`
                );
            }


            if (
                produit.cantidad <=
                produit.stock_minimo
            ) {

                const alerte =
                    document.createElement(
                        "span"
                    );

                alerte.className =
                    "badge-stock-faible";

                alerte.textContent =
                    "Stock faible";

                article.appendChild(
                    alerte
                );
            }


            listeStock.appendChild(
                article
            );
        }
    );
}


// ======================================================
// RECHERCHE
// ======================================================

function filtrerProduits() {

    const recherche =
        rechercheProduit
            .value
            .trim()
            .toLowerCase();


    if (!recherche) {

        afficherProduits(
            produitsBodega
        );

        return;
    }


    const resultat =
        produitsBodega.filter(
            produit => {

                return [

                    produit.nom,
                    produit.referencia,
                    produit.categoria,
                    produit.proveedor

                ]
                    .filter(Boolean)
                    .some(
                        valeur =>
                            valeur
                                .toLowerCase()
                                .includes(
                                    recherche
                                )
                    );
            }
        );


    afficherProduits(
        resultat
    );
}


// ======================================================
// RÉSUMÉ STOCK
// ======================================================

function actualiserResumeStock() {

    resumeNombreProduits.textContent =
        String(
            produitsBodega.length
        );


    const stockFaible =
        produitsBodega.filter(
            produit =>
                produit.cantidad <=
                produit.stock_minimo
        ).length;


    resumeStockFaible.textContent =
        String(
            stockFaible
        );
}


// ======================================================
// NOUVELLE LIVRAISON
// ======================================================

function ouvrirNouvelleLivraison() {

    formulaireLivraison.reset();

    messageLivraison.textContent =
        "";

    construireProduitsLivraison();

    dialogLivraison.showModal();
}


function fermerNouvelleLivraison() {

    formulaireLivraison.reset();

    dialogLivraison.close();
}


// ======================================================
// PRODUITS LIVRAISON
// ======================================================

function construireProduitsLivraison() {

    produitsLivraison.replaceChildren();


    produitsBodega.forEach(
        produit => {

            const ligne =
                document.createElement(
                    "div"
                );

            ligne.className =
                "ligne-produit-operation";


            const infos =
                document.createElement(
                    "div"
                );


            const nom =
                document.createElement(
                    "strong"
                );

            nom.textContent =
                produit.nom;


            const stock =
                document.createElement(
                    "small"
                );

            stock.textContent =
                `Stock actuel : ${produit.cantidad}`;


            infos.append(
                nom,
                stock
            );


            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "number";

            input.min =
                "0";

            input.step =
                "1";

            input.value =
                "0";

            input.className =
                "quantite-livraison";

            input.dataset.id =
                produit.id;


            ligne.append(
                infos,
                input
            );


            produitsLivraison.appendChild(
                ligne
            );
        }
    );
}


// ======================================================
// ENREGISTRER LIVRAISON
// ======================================================

async function enregistrerLivraison(
    event
) {

    event.preventDefault();


    boutonEnregistrerLivraison.disabled =
        true;


    try {

        const lignes =
            Array
                .from(
                    document.querySelectorAll(
                        ".quantite-livraison"
                    )
                )
                .map(
                    input => ({

                        material_bodega_id:
                            input.dataset.id,

                        quantite:
                            Number(
                                input.value
                            )
                    })
                )
                .filter(
                    ligne =>
                        Number.isInteger(
                            ligne.quantite
                        ) &&
                        ligne.quantite > 0
                );


        if (
            lignes.length === 0
        ) {

            afficherMessage(
                messageLivraison,
                "Indiquez au moins une quantité livrée.",
                true
            );

            return;
        }


        const {
            data,
            error
        } = await supabase
            .rpc(
                "creer_livraison_bodega",
                {

                    p_reference:
                        referenceLivraison
                            .value
                            .trim() ||
                        null,

                    p_fournisseur:
                        fournisseurLivraison
                            .value
                            .trim() ||
                        null,

                    p_notes:
                        notesLivraison
                            .value
                            .trim() ||
                        null,

                    p_lignes:
                        lignes
                }
            );


        if (error) {
            throw error;
        }


        console.log(
            "Livraison créée :",
            data
        );


        dialogLivraison.close();


        await chargerBodega();


        alert(
            "Livraison enregistrée correctement."
        );


    } catch (error) {

        console.error(
            "Erreur livraison :",
            error
        );


        afficherMessage(
            messageLivraison,
            error.message,
            true
        );


    } finally {

        boutonEnregistrerLivraison.disabled =
            false;
    }
}


// ======================================================
// VENTE
// ======================================================

function ouvrirDeclarationVente() {

    formulaireVente.reset();

    messageVente.textContent =
        "";

    totalVente.textContent =
        formaterMonnaie(0);

    construireProduitsVente();

    dialogVente.showModal();
}


function fermerDeclarationVente() {

    formulaireVente.reset();

    dialogVente.close();
}


// ======================================================
// PRODUITS VENTE
// ======================================================

function construireProduitsVente() {

    produitsVente.replaceChildren();


    produitsBodega.forEach(
        produit => {

            const ligne =
                document.createElement(
                    "div"
                );

            ligne.className =
                "ligne-produit-vente";


            const infos =
                document.createElement(
                    "div"
                );


            const nom =
                document.createElement(
                    "strong"
                );

            nom.textContent =
                produit.nom;


            const stock =
                document.createElement(
                    "small"
                );

            stock.textContent =
                `Stock : ${produit.cantidad}`;


            infos.append(
                nom,
                stock
            );


            const zonePrix =
                document.createElement(
                    "div"
                );

            zonePrix.className =
                "zone-prix-vente";


            const prix =
                document.createElement(
                    "input"
                );

            prix.type =
                "number";

            prix.min =
                "0";

            prix.step =
                "0.01";

            prix.placeholder =
                "Prix";

            prix.value =
                produit.precio_unitario ??
                "";

            prix.className =
                "prix-vente-produit";

            prix.dataset.id =
                produit.id;


            const quantite =
                document.createElement(
                    "input"
                );

            quantite.type =
                "number";

            quantite.min =
                "0";

            quantite.max =
                String(
                    produit.cantidad
                );

            quantite.step =
                "1";

            quantite.value =
                "0";

            quantite.className =
                "quantite-vente-produit";

            quantite.dataset.id =
                produit.id;


            zonePrix.append(
                prix,
                quantite
            );


            ligne.append(
                infos,
                zonePrix
            );


            produitsVente.appendChild(
                ligne
            );
        }
    );
}


// ======================================================
// TOTAL VENTE
// ======================================================

function calculerTotalVente() {

    let total = 0;


    produitsBodega.forEach(
        produit => {

            const quantiteInput =
                produitsVente.querySelector(
                    `.quantite-vente-produit[data-id="${produit.id}"]`
                );


            const prixInput =
                produitsVente.querySelector(
                    `.prix-vente-produit[data-id="${produit.id}"]`
                );


            const quantite =
                Number(
                    quantiteInput?.value ??
                    0
                );


            const prix =
                Number(
                    prixInput?.value ??
                    0
                );


            if (
                quantite > 0 &&
                prix >= 0
            ) {

                total +=
                    quantite *
                    prix;
            }
        }
    );


    totalVente.textContent =
        formaterMonnaie(
            total
        );
}


// ======================================================
// ENREGISTRER VENTE
// ======================================================

async function enregistrerVente(
    event
) {

    event.preventDefault();


    boutonEnregistrerVente.disabled =
        true;


    try {

        const lignes = [];


        produitsBodega.forEach(
            produit => {

                const quantiteInput =
                    produitsVente.querySelector(
                        `.quantite-vente-produit[data-id="${produit.id}"]`
                    );


                const prixInput =
                    produitsVente.querySelector(
                        `.prix-vente-produit[data-id="${produit.id}"]`
                    );


                const quantite =
                    Number(
                        quantiteInput?.value ??
                        0
                    );


                if (
                    !Number.isInteger(
                        quantite
                    ) ||
                    quantite <= 0
                ) {

                    return;
                }


                const prix =
                    Number(
                        prixInput?.value
                    );


                if (
                    !Number.isFinite(prix) ||
                    prix < 0
                ) {

                    throw new Error(
                        `Prix invalide pour ${produit.nom}`
                    );
                }


                lignes.push({

                    material_bodega_id:
                        produit.id,

                    quantite,

                    prix_unitaire:
                        prix

                });
            }
        );


        if (
            lignes.length === 0
        ) {

            afficherMessage(
                messageVente,
                "Indiquez au moins un produit vendu.",
                true
            );

            return;
        }


        const {
            data,
            error
        } = await supabase
            .rpc(
                "declarer_vente_bodega",
                {

                    p_reference:
                        referenceVente
                            .value
                            .trim() ||
                        null,

                    p_notes:
                        notesVente
                            .value
                            .trim() ||
                        null,

                    p_lignes:
                        lignes

                }
            );


        if (error) {
            throw error;
        }


        dialogVente.close();


        await chargerBodega();


        if (
            data?.id
        ) {

            await ouvrirFicheVente(
                data.id
            );
        }


    } catch (error) {

        console.error(
            "Erreur vente :",
            error
        );


        afficherMessage(
            messageVente,
            error.message,
            true
        );


    } finally {

        boutonEnregistrerVente.disabled =
            false;
    }
}


// ======================================================
// NOUVEAU PRODUIT
// ======================================================

function fermerNouveauProduit() {

    formulaireProduit.reset();

    document.querySelector(
        "#produit-unite"
    ).value = "unidad";

    dialogProduit.close();
}


async function enregistrerNouveauProduit(
    event
) {

    event.preventDefault();


    const prixValeur =
        document.querySelector(
            "#produit-prix"
        ).value;


    try {

        const {
            error
        } = await supabase
            .rpc(
                "creer_produit_bodega",
                {

                    p_nom:
                        document.querySelector(
                            "#produit-nom"
                        ).value,

                    p_reference:
                        document.querySelector(
                            "#produit-reference"
                        ).value || null,

                    p_categorie:
                        document.querySelector(
                            "#produit-categorie"
                        ).value || null,

                    p_description:
                        document.querySelector(
                            "#produit-description"
                        ).value || null,

                    p_stock_minimo:
                        Number(
                            document.querySelector(
                                "#produit-stock-minimum"
                            ).value
                        ),

                    p_unidad:
                        document.querySelector(
                            "#produit-unite"
                        ).value,

                    p_ubicacion:
                        document.querySelector(
                            "#produit-emplacement"
                        ).value || null,

                    p_proveedor:
                        document.querySelector(
                            "#produit-fournisseur"
                        ).value || null,

                    p_precio_unitario:
                        prixValeur === ""
                            ? null
                            : Number(
                                prixValeur
                            ),

                    p_notas:
                        document.querySelector(
                            "#produit-notes"
                        ).value || null
                }
            );


        if (error) {
            throw error;
        }


        fermerNouveauProduit();


        await chargerProduits();


        alert(
            "Produit ajouté correctement."
        );


    } catch (error) {

        console.error(
            "Erreur création produit :",
            error
        );


        afficherMessage(
            messageProduit,
            error.message,
            true
        );
    }
}


// ======================================================
// HISTORIQUE VENTES
// ======================================================

async function chargerHistoriqueVentes() {

    const {
        data,
        error
    } = await supabase
        .from(
            "bodega_ventes"
        )
        .select(`
            id,
            reference,
            total_recette,
            date_operation,
            created_by_name
        `)
        .order(
            "date_operation",
            {
                ascending: false
            }
        )
        .limit(10);


    listeVentes.replaceChildren();


    if (error) {

        console.error(error);

        listeVentes.textContent =
            "Impossible de charger les ventes.";

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        listeVentes.textContent =
            "Aucune vente enregistrée.";

        return;
    }


    data.forEach(
        vente => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "carte-operation-bodega";


            const zone =
                document.createElement(
                    "div"
                );


            const titre =
                document.createElement(
                    "strong"
                );

            titre.textContent =
                vente.reference;


            const date =
                document.createElement(
                    "span"
                );

            date.textContent =
                formaterDate(
                    vente.date_operation
                );


            zone.append(
                titre,
                date
            );


            const total =
                document.createElement(
                    "strong"
                );

            total.className =
                "montant-operation";

            total.textContent =
                formaterMonnaie(
                    vente.total_recette
                );


            const bouton =
                document.createElement(
                    "button"
                );

            bouton.type =
                "button";

            bouton.textContent =
                "Voir la fiche";

            bouton.dataset.action =
                "fiche-vente";

            bouton.dataset.id =
                vente.id;


            article.append(
                zone,
                total,
                bouton
            );


            listeVentes.appendChild(
                article
            );
        }
    );
}


// ======================================================
// HISTORIQUE LIVRAISONS
// ======================================================

async function chargerHistoriqueLivraisons() {

    const {
        data,
        error
    } = await supabase
        .from(
            "bodega_livraisons"
        )
        .select(`
            id,
            reference,
            fournisseur,
            date_operation,
            created_by_name
        `)
        .order(
            "date_operation",
            {
                ascending: false
            }
        )
        .limit(10);


    listeLivraisons.replaceChildren();


    if (error) {

        console.error(error);

        listeLivraisons.textContent =
            "Impossible de charger les livraisons.";

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        listeLivraisons.textContent =
            "Aucune livraison enregistrée.";

        return;
    }


    data.forEach(
        livraison => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "carte-operation-bodega";


            const zone =
                document.createElement(
                    "div"
                );


            const titre =
                document.createElement(
                    "strong"
                );

            titre.textContent =
                livraison.reference;


            const date =
                document.createElement(
                    "span"
                );

            date.textContent =
                formaterDate(
                    livraison.date_operation
                );


            zone.append(
                titre,
                date
            );


            const fournisseur =
                document.createElement(
                    "span"
                );

            fournisseur.textContent =
                livraison.fournisseur ??
                "Fournisseur non renseigné";


            const bouton =
                document.createElement(
                    "button"
                );

            bouton.type =
                "button";

            bouton.textContent =
                "Voir la fiche";

            bouton.dataset.action =
                "fiche-livraison";

            bouton.dataset.id =
                livraison.id;


            article.append(
                zone,
                fournisseur,
                bouton
            );


            listeLivraisons.appendChild(
                article
            );
        }
    );
}


// ======================================================
// CLIC HISTORIQUE
// ======================================================

async function gererClicHistorique(
    event
) {

    const bouton =
        event.target.closest(
            "[data-action]"
        );


    if (!bouton) {
        return;
    }


    if (
        bouton.dataset.action ===
        "fiche-vente"
    ) {

        await ouvrirFicheVente(
            bouton.dataset.id
        );
    }


    if (
        bouton.dataset.action ===
        "fiche-livraison"
    ) {

        await ouvrirFicheLivraison(
            bouton.dataset.id
        );
    }
}


// ======================================================
// FICHE VENTE
// ======================================================

async function ouvrirFicheVente(
    venteId
) {

    const [
        venteResultat,
        lignesResultat
    ] =
        await Promise.all([

            supabase
                .from(
                    "bodega_ventes"
                )
                .select("*")
                .eq(
                    "id",
                    venteId
                )
                .single(),

            supabase
                .from(
                    "bodega_vente_lignes"
                )
                .select("*")
                .eq(
                    "vente_id",
                    venteId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )
        ]);


    if (
        venteResultat.error ||
        lignesResultat.error
    ) {

        console.error(
            venteResultat.error ||
            lignesResultat.error
        );

        return;
    }


    const vente =
        venteResultat.data;


    document.querySelector(
        "#fiche-vente-reference"
    ).textContent =
        vente.reference;


    document.querySelector(
        "#fiche-vente-date"
    ).textContent =
        formaterDate(
            vente.date_operation
        );


    document.querySelector(
        "#fiche-vente-auteur"
    ).textContent =
        vente.created_by_name ??
        "Administrateur";


    document.querySelector(
        "#fiche-vente-total"
    ).textContent =
        formaterMonnaie(
            vente.total_recette
        );


    const conteneur =
        document.querySelector(
            "#fiche-vente-lignes"
        );


    conteneur.replaceChildren();


    lignesResultat.data.forEach(
        ligne => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "ligne-fiche-operation";


            const nom =
                document.createElement(
                    "strong"
                );

            nom.textContent =
                ligne.nom_produit;


            const calcul =
                document.createElement(
                    "span"
                );

            calcul.textContent =
                `${ligne.quantite} × ${formaterMonnaie(ligne.prix_unitaire)} = ${formaterMonnaie(ligne.sous_total)}`;


            element.append(
                nom,
                calcul
            );


            conteneur.appendChild(
                element
            );
        }
    );


    dialogFicheVente.showModal();
}


// ======================================================
// FICHE LIVRAISON
// ======================================================

async function ouvrirFicheLivraison(
    livraisonId
) {

    const [
        livraisonResultat,
        lignesResultat
    ] =
        await Promise.all([

            supabase
                .from(
                    "bodega_livraisons"
                )
                .select("*")
                .eq(
                    "id",
                    livraisonId
                )
                .single(),

            supabase
                .from(
                    "bodega_livraison_lignes"
                )
                .select("*")
                .eq(
                    "livraison_id",
                    livraisonId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )
        ]);


    if (
        livraisonResultat.error ||
        lignesResultat.error
    ) {

        console.error(
            livraisonResultat.error ||
            lignesResultat.error
        );

        return;
    }


    const livraison =
        livraisonResultat.data;


    document.querySelector(
        "#fiche-livraison-reference"
    ).textContent =
        livraison.reference;


    document.querySelector(
        "#fiche-livraison-date"
    ).textContent =
        formaterDate(
            livraison.date_operation
        );


    document.querySelector(
        "#fiche-livraison-fournisseur"
    ).textContent =
        livraison.fournisseur ??
        "Non renseigné";


    document.querySelector(
        "#fiche-livraison-auteur"
    ).textContent =
        livraison.created_by_name ??
        "Administrateur";


    const conteneur =
        document.querySelector(
            "#fiche-livraison-lignes"
        );


    conteneur.replaceChildren();


    lignesResultat.data.forEach(
        ligne => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "ligne-fiche-operation";


            const nom =
                document.createElement(
                    "strong"
                );

            nom.textContent =
                ligne.nom_produit;


            const quantite =
                document.createElement(
                    "span"
                );

            quantite.textContent =
                `+ ${ligne.quantite}`;


            element.append(
                nom,
                quantite
            );


            conteneur.appendChild(
                element
            );
        }
    );


    dialogFicheLivraison.showModal();
}


// ======================================================
// RECETTES
// ======================================================

async function chargerResumeRecettes() {

    const maintenant =
        new Date();


    const debutMois =
        new Date(
            maintenant.getFullYear(),
            maintenant.getMonth(),
            1,
            0,
            0,
            0,
            0
        );


    const {
        data,
        error
    } = await supabase
        .from(
            "bodega_ventes"
        )
        .select(`
            total_recette,
            date_operation
        `)
        .gte(
            "date_operation",
            debutMois.toISOString()
        );


    if (error) {

        console.error(
            "Erreur résumé recettes :",
            error
        );

        return;
    }


    let recettesMois =
        0;

    let recettesJour =
        0;


    data.forEach(
        vente => {

            const montant =
                Number(
                    vente.total_recette
                ) || 0;


            recettesMois +=
                montant;


            if (
                estMemeJour(
                    new Date(
                        vente.date_operation
                    ),
                    maintenant
                )
            ) {

                recettesJour +=
                    montant;
            }
        }
    );


    resumeRecettesJour.textContent =
        formaterMonnaie(
            recettesJour
        );


    resumeRecettesMois.textContent =
        formaterMonnaie(
            recettesMois
        );
}


// ======================================================
// UTILITAIRES
// ======================================================

function ajouterTexte(
    parent,
    texte
) {

    const p =
        document.createElement(
            "p"
        );

    p.textContent =
        texte;

    parent.appendChild(p);
}


function afficherMessage(
    element,
    texte,
    erreur = false
) {

    element.textContent =
        texte;

    element.classList.toggle(
        "message-erreur",
        erreur
    );
}


function formaterMonnaie(
    valeur
) {

    return new Intl.NumberFormat(
        "fr-FR",
        {
            style:
                "currency",

            currency:
                "EUR"
        }
    ).format(
        Number(
            valeur
        ) || 0
    );
}


function formaterDate(
    valeur
) {

    if (!valeur) {
        return "—";
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    ).format(
        new Date(
            valeur
        )
    );
}


function estMemeJour(
    dateA,
    dateB
) {

    return (
        dateA.getFullYear() ===
            dateB.getFullYear() &&

        dateA.getMonth() ===
            dateB.getMonth() &&

        dateA.getDate() ===
            dateB.getDate()
    );
}


// ======================================================
// INITIALISATION
// ======================================================

await chargerBodega();