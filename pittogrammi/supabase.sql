-- Pittogrammi: tabella dei segni condivisi tra le coppie di una classe.
-- Da incollare in Supabase > SQL Editor > New query, poi "Run". Si esegue una volta sola.

create table if not exists public.pittogrammi_segni (
  id         uuid primary key,
  classe     text not null check (char_length(classe) between 1 and 40),
  autori     text not null default '' check (char_length(autori) <= 80),
  nome       text not null default '' check (char_length(nome) <= 80),
  tratti     jsonb not null default '[]'::jsonb check (octet_length(tratti::text) < 200000),
  aggiornato timestamptz not null default now()
);

create index if not exists pittogrammi_segni_classe on public.pittogrammi_segni (classe);

-- Chiunque abbia la pagina può leggere e scrivere: la chiave pubblica sta nella pagina.
-- Il codice della classe separa le classi, ma non è una protezione vera.
alter table public.pittogrammi_segni enable row level security;
grant select, insert, update, delete on public.pittogrammi_segni to anon;

drop policy if exists "leggere" on public.pittogrammi_segni;
drop policy if exists "aggiungere" on public.pittogrammi_segni;
drop policy if exists "modificare" on public.pittogrammi_segni;
drop policy if exists "togliere" on public.pittogrammi_segni;
create policy "leggere"    on public.pittogrammi_segni for select to anon using (true);
create policy "aggiungere" on public.pittogrammi_segni for insert to anon with check (true);
create policy "modificare" on public.pittogrammi_segni for update to anon using (true) with check (true);
create policy "togliere"   on public.pittogrammi_segni for delete to anon using (true);

-- Tempo reale: ogni modifica arriva subito a tutti gli schermi collegati.
alter table public.pittogrammi_segni replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.pittogrammi_segni;
exception when duplicate_object then null;
end $$;
