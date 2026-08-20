import { supabase } from "./supabase.js";


// ======================================================
// NAVIGATION ADMIN
// ======================================================

const pagesNavigationAdmin = [

    {
        cle: "bodega",
        libelle: "Bodega",
        href: "./index.html",
        logo: "./icons/navigation/bodega.svg",

        pagesAssociees: [
            "",
            "index.html"
        ]
    },

    {
        cle: "tonnelles",
        libelle: "Tonnelles",
        href: "./tonnelles.html",
        logo: "./icons/navigation/tonnelles.svg",

        pagesAssociees: [
            "tonnelles.html"
        ]
    },

    {
        cle: "minibus",
        libelle: "Minibus",
        href: "./minibus.html",
        logo: "./icons/navigation/minibus.svg",

        pagesAssociees: [
            "minibus.html"
        ]
    },

    {
        cle: "materiel",
        libelle: "Stock",
        href: "./materiel.html",
        logo: "./icons/navigation/materiel.svg",

        pagesAssociees: [
            "materiel.html",
        ]
    },
    {
    cle: "materiel2",
        libelle: "Materiel",
        href: "./materiel2.html",
        logo: "./icons/navigation/materiel.svg",

        pagesAssociees: [
            "materiel2.html",
        ]
    },

    {
        cle: "demandes",
        libelle: "Demandes",
        href: "./adminReservations.html",
        logo: "./icons/navigation/demandes.svg",

        pagesAssociees: [
            "adminReservations.html"
        ]
    },

    {
        cle: "agenda",
        libelle: "Agenda",
        href: "./agenda.html",
        logo: "./icons/navigation/agenda.svg",

        pagesAssociees: [
            "agenda.html"
        ]
    }

];


// ======================================================
// NAVIGATION CLIENT
// ======================================================

const pagesNavigationClient = [

    {
        cle: "Accueil",
        libelle: "Accueil",
        href: "./accueil.html",
        logo: "./icons/navigation/bodega.svg",

        pagesAssociees: [
            "accueil.html"
        ]
    },

    {
        cle: "reservation",
        libelle: "Réserver",
        href: "./reservation.html",
        logo: "./icons/navigation/reservations.svg",

        pagesAssociees: [
            "reservation.html"
        ]
    },

    {
        cle: "agenda",
        libelle: "Agenda",
        href: "./agenda.html",
        logo: "./icons/navigation/agenda.svg",

        pagesAssociees: [
            "agenda.html"
        ]
    },

    {
        cle: "demandes",
        libelle: "Mes demandes",
        href: "./mesDemandes.html",
        logo: "./icons/navigation/demandes.svg",

        pagesAssociees: [
            "mesDemandes.html"
        ]
    }

];


// ======================================================
// PAGE ACTUELLE
// ======================================================

function obtenirNomPageActuelle() {

    const chemin =
        window.location.pathname;

    return chemin.substring(
        chemin.lastIndexOf("/") + 1
    );
}


// ======================================================
// RÉCUPÉRER LE PROFIL
// ======================================================

async function obtenirProfilUtilisateur() {

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser();


    if (
        userError ||
        !user
    ) {

        return null;
    }


    const {
        data: profil,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();


    if (
        profileError ||
        !profil
    ) {

        console.error(
            "Impossible de récupérer le profil :",
            profileError
        );

        return null;
    }


    return profil;
}


// ======================================================
// CONFIGURATION SELON LE RÔLE
// ======================================================

function obtenirPagesNavigation(role) {

    if (role === "admin") {

        return pagesNavigationAdmin;
    }


    if (role === "client") {

        return pagesNavigationClient;
    }


    return [];
}


// ======================================================
// PAGE ACTIVE
// ======================================================

function obtenirClePageActive(
    pagesNavigation
) {

    const nomPage =
        obtenirNomPageActuelle();


    const pageActive =
        pagesNavigation.find(
            page =>
                page.pagesAssociees.includes(
                    nomPage
                )
        );


    return pageActive?.cle || null;
}


// ======================================================
// CRÉATION D'UN LIEN
// ======================================================

function creerLienNavigation(
    page,
    clePageActive
) {

    const lien =
        document.createElement("a");


    lien.className =
        "lien-navigation";

    lien.href =
        page.href;

    lien.setAttribute(
        "aria-label",
        page.libelle
    );


    // Page actuellement ouverte

    if (
        page.cle ===
        clePageActive
    ) {

        lien.setAttribute(
            "aria-current",
            "page"
        );
    }


    // Icône

    const image =
        document.createElement("img");

    image.className =
        "icone-navigation";

    image.src =
        page.logo;

    image.alt =
        "";

    image.width =
        25;

    image.height =
        25;

    image.loading =
        "eager";


    // Texte

    const texte =
        document.createElement("span");

    texte.className =
        "texte-navigation";

    texte.textContent =
        page.libelle;


    lien.append(
        image,
        texte
    );


    return lien;
}


// ======================================================
// CRÉATION DE LA BARRE
// ======================================================

async function ajouterNavigationBasse() {

    // Évite de créer deux fois la barre

    if (
        document.querySelector(
            ".navigation-basse"
        )
    ) {

        return;
    }


    // Ne pas afficher la navigation
    // sur les pages d'authentification

    const pageActuelle =
        obtenirNomPageActuelle();


    const pagesSansNavigation = [
        "login.html",
        "register.html",
        "registrer.html"
    ];


    if (
        pagesSansNavigation.includes(
            pageActuelle
        )
    ) {

        return;
    }


    // Récupération du rôle

    const profil =
        await obtenirProfilUtilisateur();


    if (!profil) {

        return;
    }


    // Choix de la navigation

    const pagesNavigation =
        obtenirPagesNavigation(
            profil.role
        );


    if (
        pagesNavigation.length === 0
    ) {

        return;
    }


    // Création de la barre

    const navigation =
        document.createElement("nav");


    navigation.className =
        "navigation-basse";


    navigation.setAttribute(
        "aria-label",
        "Navigation principale"
    );


    const clePageActive =
        obtenirClePageActive(
            pagesNavigation
        );


    pagesNavigation.forEach(
        page => {

            navigation.appendChild(
                creerLienNavigation(
                    page,
                    clePageActive
                )
            );
        }
    );


    document.body.classList.add(
        "avec-navigation-basse"
    );


    document.body.appendChild(
        navigation
    );
}


// ======================================================
// INITIALISATION
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        ajouterNavigationBasse
    );

} else {

    ajouterNavigationBasse();
}