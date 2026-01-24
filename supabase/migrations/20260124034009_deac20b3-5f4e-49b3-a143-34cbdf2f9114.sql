-- Inserir sorteios de exemplo
INSERT INTO raffles (title, description, image_url, price, total_numbers, draw_date, status, created_by)
VALUES 
  ('iPhone 15 Pro Max', 'Concorra a um iPhone 15 Pro Max 256GB novinho em folha! Sorteio oficial com transmissão ao vivo.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 25.00, 100, NOW() + INTERVAL '7 days', 'open', '5b202b75-9669-4587-9d9f-7d5a59b32c0b'),
  ('PlayStation 5', 'PS5 com controle DualSense e jogo de brinde! Não perca essa oportunidade.', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800', 15.00, 200, NOW() + INTERVAL '14 days', 'open', '5b202b75-9669-4587-9d9f-7d5a59b32c0b'),
  ('Smart TV 55"', 'TV 4K Samsung 55 polegadas com sistema Tizen. Perfeita para sua sala!', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', 10.00, 150, NOW() + INTERVAL '10 days', 'open', '5b202b75-9669-4587-9d9f-7d5a59b32c0b'),
  ('MacBook Air M2', 'O notebook mais desejado do momento. MacBook Air com chip M2, 8GB RAM e 256GB SSD.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 50.00, 50, NOW() + INTERVAL '21 days', 'open', '5b202b75-9669-4587-9d9f-7d5a59b32c0b');

-- Inserir raspadinhas de exemplo
INSERT INTO scratch_cards (id, title, description, cover_image_url, price, is_active, created_by)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Raspadinha da Sorte', 'Teste sua sorte! Encontre 3 símbolos iguais e ganhe prêmios de até R$ 500!', 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800', 5.00, true, '5b202b75-9669-4587-9d9f-7d5a59b32c0b'),
  ('a2222222-2222-2222-2222-222222222222', 'Mega Prêmios', 'A raspadinha com os maiores prêmios! Diamantes valem até R$ 1.000!', 'https://images.unsplash.com/photo-1551847677-dc82d764e1eb?w=800', 10.00, true, '5b202b75-9669-4587-9d9f-7d5a59b32c0b'),
  ('a3333333-3333-3333-3333-333333333333', 'Frutas Premiadas', 'Raspadinha temática de frutas com prêmios deliciosos!', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800', 3.00, true, '5b202b75-9669-4587-9d9f-7d5a59b32c0b');

-- Símbolos para "Raspadinha da Sorte"
INSERT INTO scratch_symbols (scratch_card_id, name, image_url, prize_value, probability)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Estrela', 'https://cdn-icons-png.flaticon.com/512/541/541415.png', 10.00, 0.20),
  ('a1111111-1111-1111-1111-111111111111', 'Trevo', 'https://cdn-icons-png.flaticon.com/512/2722/2722997.png', 25.00, 0.15),
  ('a1111111-1111-1111-1111-111111111111', 'Coração', 'https://cdn-icons-png.flaticon.com/512/833/833472.png', 50.00, 0.10),
  ('a1111111-1111-1111-1111-111111111111', 'Diamante', 'https://cdn-icons-png.flaticon.com/512/2945/2945634.png', 100.00, 0.05),
  ('a1111111-1111-1111-1111-111111111111', 'Coroa', 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png', 500.00, 0.02);

-- Símbolos para "Mega Prêmios"  
INSERT INTO scratch_symbols (scratch_card_id, name, image_url, prize_value, probability)
VALUES 
  ('a2222222-2222-2222-2222-222222222222', 'Moeda', 'https://cdn-icons-png.flaticon.com/512/2150/2150150.png', 20.00, 0.20),
  ('a2222222-2222-2222-2222-222222222222', 'Ouro', 'https://cdn-icons-png.flaticon.com/512/2534/2534039.png', 100.00, 0.10),
  ('a2222222-2222-2222-2222-222222222222', 'Rubi', 'https://cdn-icons-png.flaticon.com/512/6454/6454087.png', 250.00, 0.05),
  ('a2222222-2222-2222-2222-222222222222', 'Diamante', 'https://cdn-icons-png.flaticon.com/512/2945/2945634.png', 500.00, 0.03),
  ('a2222222-2222-2222-2222-222222222222', 'Tesouro', 'https://cdn-icons-png.flaticon.com/512/1355/1355637.png', 1000.00, 0.01);

-- Símbolos para "Frutas Premiadas"
INSERT INTO scratch_symbols (scratch_card_id, name, image_url, prize_value, probability)
VALUES 
  ('a3333333-3333-3333-3333-333333333333', 'Cereja', 'https://cdn-icons-png.flaticon.com/512/1625/1625060.png', 5.00, 0.25),
  ('a3333333-3333-3333-3333-333333333333', 'Laranja', 'https://cdn-icons-png.flaticon.com/512/415/415733.png', 10.00, 0.20),
  ('a3333333-3333-3333-3333-333333333333', 'Uva', 'https://cdn-icons-png.flaticon.com/512/765/765560.png', 25.00, 0.12),
  ('a3333333-3333-3333-3333-333333333333', 'Melancia', 'https://cdn-icons-png.flaticon.com/512/1514/1514922.png', 50.00, 0.08),
  ('a3333333-3333-3333-3333-333333333333', 'Sete', 'https://cdn-icons-png.flaticon.com/512/8002/8002294.png', 100.00, 0.03);