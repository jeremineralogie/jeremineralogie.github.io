-- Espace privé « admin-staging » : taille et types de fichiers limités.
-- Usages légitimes : brouillons de l'admin (photos, documents d'archives) et photos du formulaire d'identification
-- (redimensionnées en JPEG par le navigateur avant l'envoi).
update storage.buckets
set file_size_limit = 26214400, -- 25 Mo par fichier
    allowed_mime_types = array[
      'image/*',
      'application/pdf',
      'text/plain', 'text/rtf', 'application/rtf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text'
    ]
where id = 'admin-staging';

-- Envoi anonyme (formulaire d'identification) : uniquement « messages/<dossier>/<fichier>.jpg ».
alter policy messages_photo_upload on storage.objects
  with check (
    bucket_id = 'admin-staging'
    and (storage.foldername(name))[1] = 'messages'
    and array_length(storage.foldername(name), 1) = 2
    and lower(storage.extension(name)) in ('jpg', 'jpeg')
  );
