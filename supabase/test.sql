create table public.materiel (
  id uuid not null default gen_random_uuid (),
  nom text null,
  lieu text null,
  etat text not null default 'disponible'::text,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint materiel_pkey primary key (id),
  constraint materiel_capacite_check check ((capacite > 0)),
  constraint materiel_etat_check check (
    (
      etat = any (
        array[
          'disponible'::text,
          'maintenance'::text,
          'indisponible'::text,
          'retire'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;













create table public.reservations_materiel (
  id uuid not null default gen_random_uuid (),
  materiel_id uuid not null,
  nom_reservation text not null,
  responsable text not null,
  telephone text null,
  destination text null,
  date_debut timestamp with time zone not null,
  date_fin timestamp with time zone not null,
  statut text not null default 'attente'::text,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  serie_id uuid null,
  constraint reservations_materiel_pkey primary key (id),
  constraint reservations_materiel_materiel_id_fkey foreign KEY (materiel_id) references materiel (id) on delete RESTRICT,
  constraint dates_reservation_materiel_valides check ((date_fin > date_debut)),
  constraint reservations_materiel_statut_check check (
    (
      statut = any (
        array[
          'confirme'::text,
          'annulee'::text,
          'attente'::text,
          'termine'::text
        ]
      )
    )
  ),
  constraint reservations_materiel_sans_chevauchement EXCLUDE using gist (
    materiel_id
    with
      =,
      tstzrange (date_debut, date_fin, '[)'::text)
    with
      &&
  )
  where
    ((statut = 'confirme'::text))
) TABLESPACE pg_default;

create index IF not exists reservations_materiel_serie_idx on public.reservations_minibus using btree (serie_id) TABLESPACE pg_default;