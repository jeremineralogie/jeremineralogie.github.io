-- Crédit / licence des photos ajoutées dans l'admin pour une fiche minéral (affiché sous les photos de la fiche).
alter table public.minerals add column if not exists photo_credit text check (photo_credit is null or char_length(photo_credit) <= 300);
comment on column public.minerals.photo_credit is 'Crédit / licence des photos ajoutées dans l''admin (affiché sous les photos de la fiche).';
