-- Dados de exemplo para desenvolvimento
-- Executa após o schema.sql

insert into organizadores (nome, slug, descricao, endereco, cidade, estado, cep, lat, lng, instagram, estilos, plano)
values
  ('Bar do Léo', 'bar-do-leo',
   'O melhor pagode do centro há 15 anos. Toda quinta e sexta tem samba ao vivo.',
   'Rua Augusta, 1200, Consolação', 'São Paulo', 'SP', '01305-100',
   -23.5545, -46.6580, '@bardoleo', ARRAY['pagode','samba-de-raiz'], 'pro'),

  ('Espaço Samba Vivo', 'espaco-samba-vivo',
   'Espaço cultural dedicado ao samba de raiz e ao partido alto.',
   'Rua Treze de Maio, 487, Bela Vista', 'São Paulo', 'SP', '01327-000',
   -23.5614, -46.6453, '@sambavivo', ARRAY['samba-de-raiz','partido-alto'], 'gratis'),

  ('Quiosque da Orla', 'quiosque-da-orla',
   'Pagode com vista para o mar todo fim de semana.',
   'Av. Atlântica, 3456, Copacabana', 'Rio de Janeiro', 'RJ', '22070-001',
   -22.9711, -43.1822, '@quiosquedaorla', ARRAY['pagode','samba-rock'], 'pro'),

  ('Casa do Partido', 'casa-do-partido',
   'Roda de partido alto toda terça. Entrada gratuita.',
   'Rua Barão de São Félix, 45, Centro', 'Rio de Janeiro', 'RJ', '20260-040',
   -22.9064, -43.1822, '@casadopartido', ARRAY['partido-alto','samba-de-raiz'], 'gratis');

-- Eventos de exemplo (organizador_id será resolvido via subquery em produção)
-- Aqui usamos CTE para pegar os IDs
with orgs as (
  select id, slug from organizadores
)
insert into eventos (organizador_id, nome, descricao, estilos, data_inicio, hora_inicio, hora_fim, recorrencia, tipo_ingresso, preco, status)
select
  o.id,
  ev.nome, ev.descricao, ev.estilos,
  ev.data_inicio::date, ev.hora_inicio::time, ev.hora_fim::time,
  ev.recorrencia, ev.tipo_ingresso, ev.preco::numeric, 'publicado'
from orgs o
join (values
  ('bar-do-leo',       'Pagode toda quinta',          'Pagode ao vivo com open bar das 20h às 22h', ARRAY['pagode'],           current_date+2, '20:00','23:30','semanal',  'pago',     25),
  ('bar-do-leo',       'Roda de samba especial',      'Convidados especiais toda última sexta do mês', ARRAY['samba-de-raiz'], current_date+4, '19:00','00:00','mensal',   'pago',     35),
  ('espaco-samba-vivo','Partido alto — entrada livre', 'Roda aberta para todos os sambistas', ARRAY['partido-alto'],            current_date+1, '18:00','22:00','quinzenal','gratuito', null),
  ('espaco-samba-vivo','Noite de raiz',               'Samba de raiz com mestres do gênero', ARRAY['samba-de-raiz'],           current_date+6, '20:00','23:00','unico',    'pago',     15),
  ('quiosque-da-orla', 'Pagode beira mar',            'Todo sábado, vista pro mar e muito samba', ARRAY['pagode','samba-rock'],current_date+3, '17:00','22:00','semanal',  'gratuito', null),
  ('casa-do-partido',  'Roda de terça',               'Toda terça, a melhor roda de partido alto do Rio', ARRAY['partido-alto'],current_date+1,'21:00','01:00','semanal',  'gratuito', null)
) as ev(slug, nome, descricao, estilos, data_inicio, hora_inicio, hora_fim, recorrencia, tipo_ingresso, preco)
on o.slug = ev.slug;
