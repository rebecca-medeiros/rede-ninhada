import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PetDetailsClient from "./PetDetailsClient";

type Props = {
  params: Promise<{ slug: string }>;
};

// 1. Geração Dinâmica de Metadados Open Graph para Compartilhamento Social (SEO)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;

  const { data: animal } = await supabase
    .from("animals")
    .select("name, species, sex, size, neighborhood, city, personality_tags, animal_images(url)")
    .eq("slug", slug)
    .single();

  if (!animal) {
    return {
      title: "Animal Não Encontrado — Rede Ninhada",
    };
  }

  const coverImage = animal.animal_images?.[0]?.url || "";
  const tagsText = animal.personality_tags?.length > 0 
    ? `(${animal.personality_tags.slice(0, 3).join(", ")})` 
    : "";

  return {
    title: `${animal.name} procura um lar — Rede Ninhada`,
    description: `${animal.species} ${animal.sex} ${tagsText}, porte ${animal.size.toLowerCase()}, aguardando adoção em ${animal.neighborhood}, ${animal.city}.`,
    openGraph: {
      title: `${animal.name} procura um lar — Rede Ninhada`,
      description: `${animal.species} ${animal.sex} ${tagsText}, porte ${animal.size.toLowerCase()}, aguardando adoção em ${animal.neighborhood}, ${animal.city}.`,
      images: coverImage ? [{ url: coverImage }] : [],
      url: `https://redeninhada.com.br/animais/${slug}`,
      siteName: "Rede Ninhada",
      locale: "pt_BR",
      type: "website",
    },
  };
}

// 2. Renderização do Server Component com Fetch do Supabase
export default async function DetalheAnimal({ params }: Props) {
  const slug = (await params).slug;

  const { data: animal, error } = await supabase
    .from("animals")
    .select(`
      *,
      organizations (
        name,
        neighborhood,
        phone_whatsapp,
        logo_url,
        donation_methods
      ),
      animal_images (
        url,
        display_order
      )
    `)
    .eq("slug", slug)
    .single();

  if (error || !animal) {
    return (
      <>
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            backgroundColor: "var(--background)",
            minHeight: "60vh",
          }}
        >
          <h2 style={{ color: "var(--color-primary-dark)", marginBottom: "12px" }}>Animal não encontrado</h2>
          <p style={{ color: "#666" }}>A ficha deste pet pode ter sido removida ou o endereço está incorreto.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <PetDetailsClient animal={animal} />
      <Footer />
    </>
  );
}
