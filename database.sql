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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected'))
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

-- 9. Habilitar RLS (Row Level Security) em Todas as Tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_leads ENABLE ROW LEVEL SECURITY;

-- 10. Políticas de Segurança RLS (Moderação e Acesso Comunitário)

-- 10.1 Políticas para public.organizations
CREATE POLICY select_approved_organizations ON public.organizations
    FOR SELECT USING (approval_status = 'approved' OR auth.uid() = id);

CREATE POLICY insert_own_organization ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY update_own_organization ON public.organizations
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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
