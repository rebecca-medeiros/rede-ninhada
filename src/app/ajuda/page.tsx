"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NEED_CATEGORIES } from "@/utils/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./ajuda.module.css";

export default function ComoAjudar() {
  const [loading, setLoading] = useState(true);
  const [allNeeds, setAllNeeds] = useState<any[]>([]);
  const [filteredNeeds, setFilteredNeeds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");

  // Inicializa o filtro ativo a partir do query param da URL (?categoria=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get("categoria");
    if (catParam) {
      setActiveTab(catParam);
    }
  }, []);

  // Modal Estado
  const [activeNeed, setActiveNeed] = useState<any | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadNeeds() {
      setLoading(true);
      try {
        // Busca necessidades ativas. RLS garante que só ONGs aprovadas retornam
        const { data, error } = await supabase
          .from("organization_needs")
          .select(`
            *,
            organizations (
              name,
              neighborhood,
              phone_whatsapp,
              logo_url,
              donation_methods
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAllNeeds(data || []);
        setFilteredNeeds(data || []);
      } catch (err) {
        console.error("Erro ao carregar necessidades:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNeeds();
  }, []);

  // Filtragem local instantânea por categoria
  useEffect(() => {
    if (activeTab) {
      setFilteredNeeds(allNeeds.filter((need) => need.category === activeTab));
    } else {
      setFilteredNeeds(allNeeds);
    }
  }, [activeTab, allNeeds]);

  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Ração": return styles.catRacao;
      case "Medicamentos": return styles.catMedicamentos;
      case "Lar temporário": return styles.catLarTemporario;
      case "Voluntários": return styles.catVoluntarios;
      case "Transporte": return styles.catTransporte;
      case "Eventos": return styles.catEventos;
      default: return styles.catOutros;
    }
  };

  const generateWhatsappUrl = (phone: string, title: string, orgName: string) => {
    const text = `Olá, ${orgName}! Vi na Rede Ninhada que vocês estão precisando de apoio para "${title}". Como posso ajudar a fazer a diferença?`;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Como Fazer a Diferença Hoje</h1>
          <p className={styles.subtitle}>
            Organizações e protetores da rede do Maranhão precisam de apoio para continuar cuidando e salvando vidas. Confira as necessidades de apoio da nossa comunidade e faça parte dessa rede de acolhimento.
          </p>
        </header>

      {/* Categorias Barra */}
      <section className={styles.categoriesBar}>
        <button
          className={`${styles.categoryTab} ${activeTab === "" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("")}
        >
          Ver Todas
        </button>
        {NEED_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryTab} ${activeTab === cat ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Grid de Necessidades */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>Carregando necessidades urgentes...</p>
        </div>
      ) : filteredNeeds.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>Nenhuma necessidade ativa</h3>
          <p className={styles.emptyDescription}>
            Nenhuma demanda de ajuda cadastrada nesta categoria no momento. Obrigado por querer apoiar!
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredNeeds.map((need) => (
            <article key={need.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={`${styles.categoryBadge} ${getCategoryClass(need.category)}`}>
                  {need.category}
                </span>
                <span style={{ fontSize: "12px", color: "#888" }}>
                  🕒 {new Date(need.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <h2 className={styles.needTitle}>{need.title}</h2>
              <p className={styles.needDescription}>{need.description}</p>

              <div className={styles.footer}>
                {need.organizations?.logo_url ? (
                  <img src={need.organizations.logo_url} alt={need.organizations.name} className={styles.orgLogo} />
                ) : (
                  <div className={styles.orgPlaceholder}>
                    {need.organizations?.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className={styles.orgInfo}>
                  <span className={styles.orgName}>{need.organizations?.name}</span>
                  <span className={styles.orgLocation}>📍 Atuação: {need.organizations?.neighborhood}</span>
                </div>
              </div>

              <button className={styles.helpButton} onClick={() => setActiveNeed(need)}>
                🤝 Quero Ajudar
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Modal Quero Ajudar */}
      {activeNeed && (
        <div className={styles.modalOverlay} onClick={() => setActiveNeed(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setActiveNeed(null)}>
              ×
            </button>

            <h3 className={styles.modalTitle}>Apoiar Necessidade</h3>
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.5 }}>
              Você está se oferecendo para ajudar a <strong>{activeNeed.organizations?.name}</strong> com a demanda: <strong>"{activeNeed.title}"</strong>.
            </p>

            {/* Pix Box */}
            {(activeNeed.pix_key || activeNeed.organizations?.donation_methods?.pix_key) && (
              <div>
                <h4 className={styles.modalSectionTitle}>Contribuição Financeira (Pix)</h4>
                <div className={styles.pixBox}>
                  <div className={styles.pixKeyRow}>
                    <span className={styles.pixKey}>
                      {activeNeed.pix_key || activeNeed.organizations.donation_methods.pix_key}
                    </span>
                    <button
                      onClick={() => handleCopyPix(activeNeed.pix_key || activeNeed.organizations.donation_methods.pix_key)}
                      className={styles.copyButton}
                    >
                      {copySuccess ? "Copiado!" : "Copiar Chave"}
                    </button>
                  </div>
                  {(activeNeed.pix_holder || activeNeed.organizations?.donation_methods?.pix_holder) && (
                    <span className={styles.pixHolder}>
                      Titular: <strong>{activeNeed.pix_holder || activeNeed.organizations.donation_methods.pix_holder}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Contato Direto */}
            <div>
              <h4 className={styles.modalSectionTitle}>Combinar Entrega ou Serviço</h4>
              <a
                href={generateWhatsappUrl(
                  activeNeed.organizations?.phone_whatsapp,
                  activeNeed.title,
                  activeNeed.organizations?.name
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappButton}
              >
                💬 Chamar ONG no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}
