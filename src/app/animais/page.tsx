"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CIDADES_MARANHAO } from "@/utils/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./catalogo.module.css";

// Função para calcular o tempo aguardando adoção
function getWaitingTimeText(publishedAtStr: string): string {
  const publishedAt = new Date(publishedAtStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - publishedAt.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `Aguardando há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `Aguardando há ${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
    } else {
      const diffYears = Math.floor(diffMonths / 12);
      return `Aguardando há ${diffYears} ${diffYears === 1 ? "ano" : "anos"}`;
    }
  }
}

export default function CatalogoAnimais() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allPets, setAllPets] = useState<any[]>([]);
  const [filteredPets, setFilteredPets] = useState<any[]>([]);

  // Estados dos filtros
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");

  useEffect(() => {
    async function loadPets() {
      setLoading(true);
      try {
        // Busca apenas animais com status 'Disponivel'
        // RLS garante que só retornará animais de ONGs ativas/aprovadas
        const { data, error } = await supabase
          .from("animals")
          .select(`
            *,
            organizations (
              name,
              approval_status
            ),
            animal_images (
              url,
              display_order
            )
          `)
          .eq("status", "Disponivel")
          .order("published_at", { ascending: false });

        if (error) throw error;

        setAllPets(data || []);
        setFilteredPets(data || []);
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPets();
  }, []);

  // Efeito de filtragem local instantânea
  useEffect(() => {
    let result = [...allPets];

    if (speciesFilter) {
      result = result.filter((pet) => pet.species === speciesFilter);
    }

    if (neighborhoodFilter) {
      result = result.filter((pet) => pet.neighborhood === neighborhoodFilter);
    }

    setFilteredPets(result);
  }, [speciesFilter, neighborhoodFilter, allPets]);

  const handleClearFilters = () => {
    setSpeciesFilter("");
    setNeighborhoodFilter("");
  };

  const isLongWait = (publishedAtStr: string): boolean => {
    const publishedAt = new Date(publishedAtStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - publishedAt.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 90; // Espera longa considerada acima de 3 meses
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Encontrar um amigo pet</h1>
          <p className={styles.subtitle}>
            Conecte-se com animais resgatados que aguardam um lar no Maranhão e ajude a fortalecer a nossa rede de acolhimento.
          </p>
        </header>

      {/* Filtros de Busca */}
      <section className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="species-select">Espécie</label>
          <select
            id="species-select"
            className={styles.select}
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
          >
            <option value="">Todas as espécies</option>
            <option value="Cachorro">Cachorros</option>
            <option value="Gato">Gatos</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="neighborhood-select">Cidade (Maranhão)</label>
          <select
            id="neighborhood-select"
            className={styles.select}
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
          >
            <option value="">Todas as cidades</option>
            {CIDADES_MARANHAO.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {(speciesFilter || neighborhoodFilter) && (
          <button className={styles.clearButton} onClick={handleClearFilters}>
            Limpar Filtros
          </button>
        )}
      </section>

      {/* Listagem de Animais */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>Carregando animais disponíveis...</p>
        </div>
      ) : filteredPets.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>Nenhum animal encontrado</h3>
          <p className={styles.emptyDescription}>
            Tente alterar ou limpar os filtros de busca para encontrar outros pets aguardando acolhimento.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPets.map((pet) => {
            const sortedImages = pet.animal_images?.sort((a: any, b: any) => a.display_order - b.display_order);
            const coverImage = sortedImages?.[0]?.url;
            const waitingText = getWaitingTimeText(pet.published_at);
            const isLongWaiting = isLongWait(pet.published_at);

            return (
              <article
                key={pet.id}
                className={styles.card}
                onClick={() => router.push(`/animais/${pet.slug}`)}
              >
                <div className={styles.imageContainer}>
                  {coverImage ? (
                    <img src={coverImage} alt={pet.name} className={styles.image} />
                  ) : (
                    <div className={styles.noImage}>🐾</div>
                  )}

                  {/* Badges de Contexto Dinâmicos */}
                  <div className={styles.badgeArea}>
                    {pet.adoption_priority === "Urgente" && (
                      <span className={`${styles.badge} ${styles.badgeUrgente}`}>🚨 Urgente</span>
                    )}
                    {pet.adoption_priority === "Destaque" && (
                      <span className={`${styles.badge} ${styles.badgeDestaque}`}>⭐ Destaque</span>
                    )}
                    {pet.is_special_care && (
                      <span className={`${styles.badge} ${styles.badgeCuidados}`}>🏥 Especial</span>
                    )}
                    {isLongWaiting && (
                      <span className={`${styles.badge} ${styles.badgeLongaEspera}`}>💜 Espera Longa</span>
                    )}
                  </div>
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <h2 className={styles.name}>{pet.name}</h2>
                  </div>

                  <div className={styles.meta}>
                    <span>{pet.species}</span>
                    <span>•</span>
                    <span>{pet.sex}</span>
                    <span>•</span>
                    <span>{pet.size}</span>
                  </div>

                  <span className={styles.waitingTime}>
                    🕒 {waitingText}
                  </span>
                </div>

                <div className={styles.footer}>
                  <span>Por: <span className={styles.orgName}>{pet.organizations?.name}</span></span>
                  <span>📍 {pet.neighborhood}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}
