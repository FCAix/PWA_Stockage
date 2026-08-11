import { supabase } from "./supabase.js";

const formulaireReservation = document.querySelector(
  "#form-reservation-materiel"
);

const selectionMateriel = document.querySelector(
  "#selection-materiel-reservation"
);

const nomReservation = document.querySelector(
  "#nom-reservation"
);

const responsableReservation = document.querySelector(
  "#responsable-reservation"
);

const telephoneReservation = document.querySelector(
  "#telephone-reservation"
);

const dateDebutReservation = document.querySelector(
  "#date-debut-reservation"
);

const dateFinReservation = document.querySelector(
  "#date-fin-reservation"
);

const notesReservation = document.querySelector(
  "#notes-reservation"
);

const boutonEnregistrerReservation =
  document.querySelector(
    "#bouton-enregistrer-reservation"
  );

const messageReservation = document.querySelector(
  "#message-reservation"
);

const destinationReservation =
  document.querySelector(
    "#destination-reservation"
  );

const nombrePassagersReservation =
  document.querySelector(
    "#nombre-passagers-reservation"
  );

  const reservationRepetitive =
  document.querySelector(
    "#reservation-repetitive"
  );

const optionsRepetition =
  document.querySelector(
    "#options-repetition"
  );

const dateFinRepetition =
  document.querySelector(
    "#date-fin-repetition"
  );

const resumeRepetition =
  document.querySelector(
    "#resume-repetition"
  );


initialiserPageReservation();


async function initialiserPageReservation() {
  const dateHeureActuelle = obtenirDateHeureActuelle();

    dateDebutReservation.min = dateHeureActuelle;

    dateFinReservation.min = dateHeureActuelle;

    dateDebutReservation.addEventListener(
        "change",
        actualiserDateFinMinimum
    );

    formulaireReservation.addEventListener(
        "submit",
        enregistrerReservation
    );
    reservationRepetitive.addEventListener(
    "change",
    basculerOptionsRepetition
        );

    dateDebutReservation.addEventListener(
    "change",
    afficherResumeRepetition
    );

    dateFinRepetition.addEventListener(
    "change",
    afficherResumeRepetition
    );
    await remplirSelectionMateriel();
}


function obtenirDateHeureActuelle() {
  return formaterDateHeureLocale(new Date());
}

function formaterDateHeureLocale(date) {
  const decalage =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - decalage
  )
    .toISOString()
    .slice(0, 16);
}


function actualiserDateFinMinimum() {
  const valeurDebut =
    dateDebutReservation.value;

  dateFinReservation.min = valeurDebut;

  if (!valeurDebut) {
    return;
  }

  const dateDebut = new Date(valeurDebut);
  const dateFin = new Date(
    dateFinReservation.value
  );

  if (
    !dateFinReservation.value ||
    dateFin.getTime() <= dateDebut.getTime()
  ) {
    const nouvelleDateFin =
      new Date(dateDebut);

    nouvelleDateFin.setHours(
      nouvelleDateFin.getHours() + 1
    );

    dateFinReservation.value =
      formaterDateHeureLocale(
        nouvelleDateFin
      );
  }
}

async function recupererMateriel() {
  const { data, error } = await supabase
    .from("materiel")
    .select(`
      id,
      nom,
    `)
    .eq("etat", "disponible")
    .order("nom", {
      ascending: true
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function remplirSelectionMateriel() {
  try {
    const listeMateriel = await recupererMateriel();

    listeMateriel.forEach((materiel) => {
      const option = document.createElement("option");

      option.value = materiel.id;

      option.textContent =
        materiel.immatriculation +
        (
          materiel.nom
            ? ` — ${materiel.nom}`
            : ""
        );

      selectionMateriel.appendChild(option);
    });
  } catch (error) {
    afficherMessageReservation(
      `Impossible de charger les materiel : ${error.message}`,
      true
    );
  }
}

function verifierDatesReservation() {
  if (
    !dateDebutReservation.value ||
    !dateFinReservation.value
  ) {
    throw new Error(
      "Les dates et heures sont obligatoires"
    );
  }

  const dateDebut = new Date(
    dateDebutReservation.value
  );

  const dateFin = new Date(
    dateFinReservation.value
  );

  if (
    Number.isNaN(dateDebut.getTime()) ||
    Number.isNaN(dateFin.getTime())
  ) {
    throw new Error(
      "Les dates renseignées sont invalides"
    );
  }

  if (
    dateFin.getTime() <= dateDebut.getTime()
  ) {
    throw new Error(
      "La date de retour doit être postérieure à la date de départ"
    );
  }
}


async function enregistrerReservation(event) {
  event.preventDefault();

  boutonEnregistrerReservation.disabled = true;
  afficherMessageReservation("");

  try {
    verifierDatesReservation();

    const informationsReservation = {
      materiel_id:
        selectionMateriel.value,

      nom_reservation:
        nomReservation.value.trim(),

      responsable:
        responsableReservation.value.trim(),

      telephone:
        telephoneReservation.value.trim() ||
        null,

      destination:
        destinationReservation.value.trim() ||
        null,

      nombre_passagers: Number(
        nombrePassagersReservation.value
      ),

      statut: "attente",

      notes:
        notesReservation.value.trim() ||
        null
    };

    const reservations =
      creerReservationsRepetitives(
        informationsReservation
      );

    const { error } = await supabase
      .from("reservations_materiel")
      .insert(reservations);

    if (error) {
      if (error.code === "23514") {
        throw new Error(
          "La date de retour doit être postérieure à la date de départ."
        );
      }

      if (error.code === "23P01") {
        throw new Error(
          "Le materiel est déjà réservé pendant au moins une des périodes demandées."
        );
      }

      throw error;
    }

    formulaireReservation.reset();

    optionsRepetition.hidden = true;
    dateFinRepetition.required = false;
    resumeRepetition.textContent = "";

    const dateHeureActuelle =
      obtenirDateHeureActuelle();

    dateDebutReservation.min =
      dateHeureActuelle;

    dateFinReservation.min =
      dateHeureActuelle;

    afficherMessageReservation(
      reservations.length === 1
        ? "Réservation enregistrée correctement."
        : `${reservations.length} réservations enregistrées correctement.`
    );
  } catch (error) {
    console.error(
      "Erreur lors de la réservation :",
      error
    );

    afficherMessageReservation(
      error.message ||
        "Impossible d'enregistrer la réservation.",
      true
    );
  } finally {
    boutonEnregistrerReservation.disabled = false;
  }
}


function afficherMessageReservation(
  message,
  estErreur = false
) {
  messageReservation.textContent = message;

  messageReservation.classList.toggle(
    "message-erreur",
    estErreur
  );

  messageReservation.classList.toggle(
    "message-succes",
    Boolean(message) && !estErreur
  );
}

function basculerOptionsRepetition() {
  optionsRepetition.hidden =
    !reservationRepetitive.checked;

  dateFinRepetition.required =
    reservationRepetitive.checked;

  if (!reservationRepetitive.checked) {
    dateFinRepetition.value = "";
    resumeRepetition.textContent = "";
    return;
  }

  afficherResumeRepetition();
}


function afficherResumeRepetition() {
  if (
    !reservationRepetitive.checked ||
    !dateDebutReservation.value
  ) {
    resumeRepetition.textContent = "";
    return;
  }

  const dateDebut =
    new Date(dateDebutReservation.value);

  if (Number.isNaN(dateDebut.getTime())) {
    resumeRepetition.textContent = "";
    return;
  }

  const jour = new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long"
    }
  ).format(dateDebut);

  resumeRepetition.textContent =
    `La réservation sera répétée chaque ${jour}.`;
}

function creerReservationsRepetitives(
  informationsReservation
) {
  const debutInitial =
    new Date(dateDebutReservation.value);

  const finInitial =
    new Date(dateFinReservation.value);

  if (!reservationRepetitive.checked) {
    return [
      {
        ...informationsReservation,
        date_debut: debutInitial.toISOString(),
        date_fin: finInitial.toISOString(),
        serie_id: null
      }
    ];
  }

  if (!dateFinRepetition.value) {
    throw new Error(
      "La date de fin de répétition est obligatoire"
    );
  }

  const limiteRepetition = new Date(
    `${dateFinRepetition.value}T23:59:59`
  );

  if (limiteRepetition < debutInitial) {
    throw new Error(
      "La fin de répétition doit être postérieure à la première réservation"
    );
  }

  const identifiantSerie =
    crypto.randomUUID();

  const dureeReservation =
    finInitial.getTime() -
    debutInitial.getTime();

  const reservations = [];

  let debutOccurrence =
    new Date(debutInitial);

  while (
    debutOccurrence <= limiteRepetition
  ) {
    if (reservations.length >= 104) {
      throw new Error(
        "Une série ne peut pas dépasser 104 réservations"
      );
    }

    const finOccurrence = new Date(
      debutOccurrence.getTime() +
      dureeReservation
    );

    reservations.push({
      ...informationsReservation,

      date_debut:
        debutOccurrence.toISOString(),

      date_fin:
        finOccurrence.toISOString(),

      serie_id:
        identifiantSerie
    });

    const occurrenceSuivante =
      new Date(debutOccurrence);

    occurrenceSuivante.setDate(
      occurrenceSuivante.getDate() + 7
    );

    debutOccurrence =
      occurrenceSuivante;
  }

  return reservations;
}