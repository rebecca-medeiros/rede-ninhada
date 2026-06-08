-- Script de Banco de Dados — Rede Ninhada (Supabase/PostgreSQL)
-- Execute este script no painel SQL do seu projeto do Supabase (SQL Editor -> New Query)

-- 1. Habilitar Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Tabela de Organizações / Protetores
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Integrado ao Auth do Supabase
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT 'São Luís' NOT NULL,
    phone_whatsapp VARCHAR(20) NOT NULL,
    social_links JSONB DEFAULT '{}'::jsonb,
    donation_methods JSONB DEFAULT '{}'::jsonb,
    logo_url VARCHAR(500),
    approval_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_role CHECK (role IN ('user', 'admin'))
);

-- 3. Tabela de Animais
CREATE TABLE public.animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) UNIQUE, -- Gerado automaticamente pelo Trigger na inserção
    species VARCHAR(50) NOT NULL,
    sex VARCHAR(10) NOT NULL,
    approximate_age VARCHAR(50) NOT NULL,
    size VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT 'São Luís' NOT NULL,
    storytelling TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Disponivel' NOT NULL, 
    adoption_priority VARCHAR(20) DEFAULT 'Normal' NOT NULL,
    personality_tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_castrated BOOLEAN DEFAULT FALSE NOT NULL,
    is_vaccinated BOOLEAN DEFAULT FALSE NOT NULL,
    is_dewormed BOOLEAN DEFAULT FALSE NOT NULL,
    is_special_care BOOLEAN DEFAULT FALSE NOT NULL,
    comp_with_dogs BOOLEAN DEFAULT TRUE NOT NULL,
    comp_with_cats BOOLEAN DEFAULT TRUE NOT NULL,
    comp_with_children BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_animal_status CHECK (status IN ('Disponivel', 'Reservado', 'Adotado', 'Arquivado')),
    CONSTRAINT chk_adoption_priority CHECK (adoption_priority IN ('Normal', 'Destaque', 'Urgente'))
);

-- 4. Tabela de Necessidades das Organizações
CREATE TABLE public.organization_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    pix_key VARCHAR(100),
    pix_holder VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_need_category CHECK (category IN ('Ração', 'Medicamentos', 'Lar temporário', 'Voluntários', 'Transporte', 'Eventos', 'Outros'))
);

-- 5. Imagens dos Animais
CREATE TABLE public.animal_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Leads de Adoção (Manifestações de Interesse)
CREATE TABLE public.adoption_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    adopter_name VARCHAR(150) NOT NULL,
    adopter_whatsapp VARCHAR(20) NOT NULL,
    adopter_neighborhood VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Novo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_lead_status CHECK (status IN ('Novo', 'Em Contato', 'Aprovado', 'Rejeitado'))
);

-- 7. Índices Otimizados para Busca Local e Descoberta
CREATE INDEX idx_animals_search_lookup ON public.animals(species, status, city, neighborhood, adoption_priority);
CREATE INDEX idx_animals_slug ON public.animals(slug);
CREATE INDEX idx_needs_active_lookup ON public.organization_needs(is_active, category);
CREATE INDEX idx_animals_published ON public.animals(published_at DESC);

-- 8. Função e Trigger para Geração Automática de Slugs Únicos de Animais
CREATE OR REPLACE FUNCTION public.generate_animal_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
BEGIN
  -- Cria o slug base removendo acentos, convertendo para minúsculas e substituindo caracteres especiais por hífens
  base_slug := lower(unaccent(NEW.name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' THEN
    base_slug := 'animal';
  END IF;
  
  final_slug := base_slug;
  
  -- Garante a unicidade do slug no banco adicionando um sufixo numérico em caso de colisão
  WHILE EXISTS (SELECT 1 FROM public.animals WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_animal_slug
BEFORE INSERT OR UPDATE OF name ON public.animals
FOR EACH ROW
EXECUTE FUNCTION public.generate_animal_slug();

-- 9.5 Função para verificar se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Habilitar RLS (Row Level Security) em Todas as Tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_leads ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de Segurança RLS (Moderação e Acesso Comunitário)

-- 10.1 Políticas para public.organizations
CREATE POLICY select_organizations ON public.organizations
    FOR SELECT USING (
        approval_status = 'approved' 
        OR auth.uid() = id 
        OR public.is_admin()
    );

CREATE POLICY update_organizations ON public.organizations
    FOR UPDATE USING (
        auth.uid() = id 
        OR public.is_admin()
    ) WITH CHECK (
        auth.uid() = id 
        OR public.is_admin()
    );

-- 10.2 Políticas para public.animals
CREATE POLICY select_public_animals ON public.animals
    FOR SELECT USING (
        (status != 'Arquivado' AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND approval_status = 'approved'))
        OR auth.uid() = organization_id
    );

CREATE POLICY modify_own_animals ON public.animals
    FOR ALL USING (auth.uid() = organization_id);

-- 10.3 Políticas para public.organization_needs
CREATE POLICY select_public_needs ON public.organization_needs
    FOR SELECT USING (
        (is_active = true AND EXISTS (SELECT 1 FROM public.organizations WHERE id = organization_id AND approval_status = 'approved'))
        OR auth.uid() = organization_id
    );

CREATE POLICY modify_own_needs ON public.organization_needs
    FOR ALL USING (auth.uid() = organization_id);

-- 10.4 Políticas para public.animal_images
CREATE POLICY select_public_images ON public.animal_images
    FOR SELECT USING (true);

CREATE POLICY modify_own_animal_images ON public.animal_images
    FOR ALL USING (EXISTS (SELECT 1 FROM public.animals WHERE id = animal_id AND organization_id = auth.uid()));

-- 10.5 Políticas para public.adoption_leads
CREATE POLICY insert_public_leads ON public.adoption_leads
    FOR INSERT WITH CHECK (true); -- Qualquer pessoa pode enviar um lead de adoção

CREATE POLICY select_own_leads ON public.adoption_leads
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.animals WHERE id = animal_id AND organization_id = auth.uid()));

CREATE POLICY update_own_leads ON public.adoption_leads
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.animals WHERE id = animal_id AND organization_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.animals WHERE id = animal_id AND organization_id = auth.uid()));

-- ==========================================
-- 11. Criação Automática dos Buckets de Storage e Políticas
-- ==========================================

-- 11.1 Criação dos Buckets 'pets' e 'logos' (com limite de 1MB e imagens JPG/PNG/WEBP)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('pets', 'pets', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]),
  ('logos', 'logos', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- 11.2 Políticas para o bucket 'pets'
CREATE POLICY "Permitir leitura pública de fotos de pets"
ON storage.objects FOR SELECT
USING (bucket_id = 'pets');

CREATE POLICY "Permitir upload de fotos apenas para ONGs autenticadas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Permitir atualização de fotos apenas pela própria ONG"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Permitir exclusão de fotos apenas pela própria ONG"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 11.2 Políticas para o bucket 'logos'
CREATE POLICY "Permitir leitura pública de logos de ONGs"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Permitir upload de logo apenas pela própria ONG"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Permitir atualização de logo apenas pela própria ONG"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Permitir exclusão de logo apenas pela própria ONG"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- 12. Criação Automática de Perfil da ONG após Cadastro (auth.users)
-- ==========================================

-- Função que extrai os metadados do auth e insere na tabela pública de organizações
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 1;
  name_val TEXT;
  is_first BOOLEAN;
  initial_role VARCHAR(20) := 'user';
  initial_status VARCHAR(50) := 'pending';
BEGIN
  -- Checa se é o primeiro usuário a se registrar para torná-lo administrador automaticamente
  SELECT NOT EXISTS (SELECT 1 FROM public.organizations) INTO is_first;
  IF is_first THEN
    initial_role := 'admin';
    initial_status := 'approved';
  END IF;

  -- Extrai o nome enviado nos metadados do cadastro
  name_val := NEW.raw_user_meta_data->>'name';
  
  IF name_val IS NULL OR name_val = '' THEN
    name_val := 'ONG ou Protetor';
  END IF;

  -- Gera o slug amigável
  base_slug := lower(unaccent(name_val));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' THEN
    base_slug := 'ong';
  END IF;
  
  final_slug := base_slug;
  
  -- Garante a unicidade do slug da organização
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;

  -- Insere o perfil com bypass de RLS (SECURITY DEFINER garante acesso de gravação)
  INSERT INTO public.organizations (id, name, slug, neighborhood, phone_whatsapp, approval_status, role)
  VALUES (
    NEW.id,
    name_val,
    final_slug,
    COALESCE(NEW.raw_user_meta_data->>'neighborhood', 'Centro'), -- Valor padrão caso não enviado
    COALESCE(NEW.raw_user_meta_data->>'phone_whatsapp', '98999999999'),
    initial_status,
    initial_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger disparado após a inserção na tabela do Supabase Auth
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trigger de segurança para impedir que usuários alterem seu próprio status ou role via API pública
CREATE OR REPLACE FUNCTION public.protect_org_roles_and_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloqueia alterações em role e approval_status apenas se a alteração vier da API do cliente (role = 'authenticated')
  -- e o usuário correspondente não for um administrador. Permite livre alteração via SQL Editor/Superuser.
  IF current_setting('role', true) = 'authenticated' AND NOT public.is_admin() THEN
    NEW.approval_status := OLD.approval_status;
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trg_protect_org_roles_and_approval
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.protect_org_roles_and_approval();


