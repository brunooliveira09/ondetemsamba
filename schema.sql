-- =============================================
-- ONDE TEM SAMBA — Supabase Schema
-- =============================================

-- Habilita extensão de geo
create extension if not exists postgis;

-- -----------------------------------------------
-- ORGANIZADORES (bares e espaços)
-- -----------------------------------------------
create table organizadores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  nome          text not null,
  slug          text unique not null,           -- URL pública: ondetem.samba/bar-do-leo
  descricao     text,
  endereco      text not null,
  cidade        text not null,
  estado        char(2) not null,
  cep           text,
  lat           double precision,
  lng           double precision,
  geom          geometry(Point, 4326),          -- PostGIS para queries geo
  instagram     text,
  site          text,
  foto_url      text,
  estilos       text[] default '{}',            -- ['pagode','samba-de-raiz',...]
  plano         text not null default 'gratis', -- 'gratis' | 'pro'
  ativo         boolean default true,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Índice geoespacial
create index organizadores_geom_idx on organizadores using gist(geom);
create index organizadores_slug_idx on organizadores(slug);

-- Trigger: popula geom a partir de lat/lng
create or replace function sync_geom_organizadores()
returns trigger as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geom := st_setsrid(st_makepoint(new.lng, new.lat), 4326);
  end if;
  new.atualizado_em := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizadores_geom
before insert or update on organizadores
for each row execute function sync_geom_organizadores();

-- -----------------------------------------------
-- EVENTOS
-- -----------------------------------------------
create table eventos (
  id              uuid primary key default gen_random_uuid(),
  organizador_id  uuid references organizadores(id) on delete cascade,
  nome            text not null,
  descricao       text,
  estilos         text[] default '{}',
  data_inicio     date not null,
  hora_inicio     time not null default '20:00',
  hora_fim        time,
  recorrencia     text default 'unico',         -- 'unico'|'semanal'|'quinzenal'|'mensal'
  -- Endereço próprio (se diferente do espaço)
  endereco_custom text,
  lat             double precision,
  lng             double precision,
  geom            geometry(Point, 4326),
  -- Ingresso
  tipo_ingresso   text default 'gratuito',      -- 'gratuito'|'pago'|'chapeu'
  preco           numeric(8,2),
  link_ingresso   text,
  -- Extras
  maior_18        boolean default false,
  aceita_reserva  boolean default false,
  -- Status
  status          text default 'publicado',     -- 'rascunho'|'publicado'|'encerrado'
  -- Métricas
  views           integer default 0,
  interesses      integer default 0,
  -- Timestamps
  criado_em       timestamptz default now(),
  atualizado_em   timestamptz default now()
);

create index eventos_geom_idx      on eventos using gist(geom);
create index eventos_data_idx      on eventos(data_inicio);
create index eventos_status_idx    on eventos(status);
create index eventos_org_idx       on eventos(organizador_id);

-- Trigger: geom do evento usa coord própria ou herda do organizador
create or replace function sync_geom_eventos()
returns trigger as $$
declare
  org_lat double precision;
  org_lng double precision;
begin
  -- se tem coord própria, usa ela
  if new.lat is not null and new.lng is not null then
    new.geom := st_setsrid(st_makepoint(new.lng, new.lat), 4326);
  else
    -- herda do organizador
    select lat, lng into org_lat, org_lng
    from organizadores where id = new.organizador_id;
    if org_lat is not null then
      new.lat  := org_lat;
      new.lng  := org_lng;
      new.geom := st_setsrid(st_makepoint(org_lng, org_lat), 4326);
    end if;
  end if;
  new.atualizado_em := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_eventos_geom
before insert or update on eventos
for each row execute function sync_geom_eventos();

-- -----------------------------------------------
-- INTERESSES (usuário marcou interesse no evento)
-- -----------------------------------------------
create table interesses (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid references eventos(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  criado_em  timestamptz default now(),
  unique(evento_id, user_id)
);

-- -----------------------------------------------
-- VIEWS ÚTEIS
-- -----------------------------------------------

-- Eventos publicados com dados do organizador (para o mapa)
create or replace view v_eventos_mapa as
select
  e.id,
  e.nome,
  e.descricao,
  e.estilos,
  e.data_inicio,
  e.hora_inicio,
  e.hora_fim,
  e.recorrencia,
  e.tipo_ingresso,
  e.preco,
  e.maior_18,
  e.aceita_reserva,
  e.status,
  e.views,
  e.interesses,
  e.lat,
  e.lng,
  o.id           as organizador_id,
  o.nome         as organizador_nome,
  o.slug         as organizador_slug,
  o.foto_url     as organizador_foto,
  o.endereco     as organizador_endereco,
  o.cidade,
  o.estado
from eventos e
join organizadores o on o.id = e.organizador_id
where e.status = 'publicado'
  and o.ativo = true;

-- -----------------------------------------------
-- RLS (Row Level Security)
-- -----------------------------------------------
alter table organizadores enable row level security;
alter table eventos        enable row level security;
alter table interesses     enable row level security;

-- Organizadores: leitura pública, escrita apenas pelo dono
create policy "leitura publica organizadores"
  on organizadores for select using (ativo = true);

create policy "organizador gerencia proprio perfil"
  on organizadores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Eventos: leitura pública dos publicados, escrita pelo dono do espaço
create policy "leitura publica eventos"
  on eventos for select
  using (status = 'publicado');

create policy "organizador gerencia proprios eventos"
  on eventos for all
  using (
    organizador_id in (
      select id from organizadores where user_id = auth.uid()
    )
  );

-- Interesses: usuário vê/gerencia os próprios
create policy "usuario gerencia proprios interesses"
  on interesses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------
-- FUNÇÃO: busca eventos por raio (km)
-- -----------------------------------------------
create or replace function eventos_por_raio(
  lat_centro  double precision,
  lng_centro  double precision,
  raio_km     double precision default 10,
  data_de     date default current_date,
  data_ate    date default current_date + 30
)
returns setof v_eventos_mapa as $$
  select * from v_eventos_mapa
  where st_dwithin(
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    st_setsrid(st_makepoint(lng_centro, lat_centro), 4326)::geography,
    raio_km * 1000
  )
  and data_inicio between data_de and data_ate
  order by data_inicio, hora_inicio;
$$ language sql stable;
