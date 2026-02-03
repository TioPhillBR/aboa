
-- Insert sample raffles
INSERT INTO public.raffles (title, description, price, total_numbers, draw_date, status, image_url, allowed_locations) VALUES
('iPhone 15 Pro Max', 'Concorra a um iPhone 15 Pro Max 256GB na cor Titânio Natural! O smartphone mais avançado da Apple.', 5.00, 500, NOW() + INTERVAL '7 days', 'open', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', ARRAY['SP', 'RJ', 'MG']),
('PlayStation 5', 'Ganhe um PS5 com controle DualSense e 2 jogos inclusos. Diversão garantida!', 3.00, 300, NOW() + INTERVAL '5 days', 'open', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800', NULL),
('Notebook Gamer ASUS ROG', 'Notebook Gamer ASUS ROG com RTX 4060, 16GB RAM e SSD 512GB. Para os gamers de verdade!', 10.00, 1000, NOW() + INTERVAL '14 days', 'open', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', NULL),
('Smart TV Samsung 65"', 'Smart TV Samsung 65" 4K QLED com Alexa integrada. Cinema em casa!', 2.00, 200, NOW() + INTERVAL '10 days', 'open', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800', ARRAY['SP', 'RJ']),
('Airpods Pro 2', 'Apple Airpods Pro 2ª geração com cancelamento de ruído. Som premium!', 1.50, 150, NOW() + INTERVAL '3 days', 'open', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800', NULL);

-- Create new scratch cards
INSERT INTO public.scratch_cards (id, title, description, price, is_active, cover_image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Mega Prêmios', 'Prêmios de até R$ 500! Raspe e descubra sua sorte.', 3.00, true, 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800'),
('22222222-2222-2222-2222-222222222222', 'Raspadinha da Sorte', 'Ganhe até R$ 100 na hora! Chances incríveis.', 2.00, true, 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800'),
('33333333-3333-3333-3333-333333333333', 'Jackpot Dourado', 'O prêmio máximo é R$ 1.000! Você pode ser o próximo!', 5.00, true, 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800');

-- Create batches for the new scratch cards
INSERT INTO public.scratch_card_batches (scratch_card_id, batch_name, total_cards, total_prizes, prize_config, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'Lote Inicial', 500, 100, '{"prizes": [{"value": 500, "quantity": 2}, {"value": 100, "quantity": 10}, {"value": 50, "quantity": 20}, {"value": 10, "quantity": 68}]}', true),
('22222222-2222-2222-2222-222222222222', 'Lote Janeiro', 300, 60, '{"prizes": [{"value": 100, "quantity": 5}, {"value": 50, "quantity": 15}, {"value": 20, "quantity": 40}]}', true),
('33333333-3333-3333-3333-333333333333', 'Lote Premium', 200, 30, '{"prizes": [{"value": 1000, "quantity": 1}, {"value": 200, "quantity": 4}, {"value": 100, "quantity": 10}, {"value": 50, "quantity": 15}]}', true);

-- Create symbols for Mega Prêmios (probability between 0 and 1)
INSERT INTO public.scratch_symbols (scratch_card_id, name, image_url, prize_value, probability, total_quantity, remaining_quantity) VALUES
('11111111-1111-1111-1111-111111111111', 'Diamante', 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=200', 500, 0.0040, 2, 2),
('11111111-1111-1111-1111-111111111111', 'Ouro', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200', 100, 0.0200, 10, 10),
('11111111-1111-1111-1111-111111111111', 'Prata', 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=200', 50, 0.0400, 20, 20),
('11111111-1111-1111-1111-111111111111', 'Bronze', 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=200', 10, 0.1360, 68, 68),
('11111111-1111-1111-1111-111111111111', 'Vazio', 'https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?w=200', 0, 0.8000, 400, 400);

-- Create symbols for Raspadinha da Sorte
INSERT INTO public.scratch_symbols (scratch_card_id, name, image_url, prize_value, probability, total_quantity, remaining_quantity) VALUES
('22222222-2222-2222-2222-222222222222', 'Estrela', 'https://images.unsplash.com/photo-1533709752211-118fcaf03312?w=200', 100, 0.0167, 5, 5),
('22222222-2222-2222-2222-222222222222', 'Coração', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=200', 50, 0.0500, 15, 15),
('22222222-2222-2222-2222-222222222222', 'Trevo', 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?w=200', 20, 0.1333, 40, 40),
('22222222-2222-2222-2222-222222222222', 'Vazio', 'https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?w=200', 0, 0.8000, 240, 240);

-- Create symbols for Jackpot Dourado
INSERT INTO public.scratch_symbols (scratch_card_id, name, image_url, prize_value, probability, total_quantity, remaining_quantity) VALUES
('33333333-3333-3333-3333-333333333333', 'Jackpot', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=200', 1000, 0.0050, 1, 1),
('33333333-3333-3333-3333-333333333333', 'Coroa', 'https://images.unsplash.com/photo-1579403124614-197f69d8187b?w=200', 200, 0.0200, 4, 4),
('33333333-3333-3333-3333-333333333333', 'Anel', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200', 100, 0.0500, 10, 10),
('33333333-3333-3333-3333-333333333333', 'Moeda', 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=200', 50, 0.0750, 15, 15),
('33333333-3333-3333-3333-333333333333', 'Vazio', 'https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?w=200', 0, 0.8500, 170, 170);
