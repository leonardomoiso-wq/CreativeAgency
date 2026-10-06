-- Dà l'accesso alla gestione del sito a un account.
-- 1. Fai login una volta sul sito con la tua email (pagina /login).
-- 2. Sostituisci l'email qui sotto ed esegui in Supabase > SQL Editor.

update public.profiles
set role = 'admin'
where email = 'LA-TUA-EMAIL@esempio.it';
