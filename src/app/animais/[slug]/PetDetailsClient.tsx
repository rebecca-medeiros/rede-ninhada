"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CIDADES_MARANHAO } from "@/utils/constants";
import styles from "./detalhe.module.css";

// Helper para calcular tempo de espera
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

export default function PetDetailsClient({ animal }: { animal: any }) {
  const router = useRouter();
  
  // Ordenar imagens pelo display_order
  const images = animal.animal_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Estados do formulário de Lead
  const [adopterName, setAdopterName] = useState("");
  const [adopterWhatsapp, setAdopterWhatsapp] = useState("");
  const [adopterNeighborhood, setAdopterNeighborhood] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);

  const activeImage = images[activeImageIndex]?.url;
  const waitingText = getWaitingTimeText(animal.published_at);
  
  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const isLongWait = () => {
    const publishedAt = new Date(animal.published_at);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 90;
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);

    if (!adopterName || !adopterWhatsapp || !adopterNeighborhood || !leadMessage) {
      alert("Por favor, preencha todos os campos do formulário.");
      setSubmittingLead(false);
      return;
    }

    try {
      // 1. Grava a intenção de adoção no banco de dados (para fins de histórico e métricas)
      const { error } = await supabase
        .from("adoption_leads")
        .insert({
          animal_id: animal.id,
          adopter_name: adopterName,
          adopter_whatsapp: adopterWhatsapp,
          adopter_neighborhood: adopterNeighborhood,
          message: leadMessage,
          status: "Novo",
        });

      if (error) throw error;

      // 2. Prepara e abre a URL de conversa direta com a ONG no WhatsApp
      const phone = animal.organizations?.phone_whatsapp;
      const messageText = `Olá, ${animal.organizations?.name}! Enviei meu interesse de adoção pelo animal "${animal.name}" através da Rede Ninhada.\n\nMeus dados:\n- Nome: ${adopterName}\n- Bairro: ${adopterNeighborhood}\n- Apresentação: ${leadMessage}\n\nGostaria de conversar sobre a adoção!`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;

      window.open(whatsappUrl, "_blank");
      
      // Fecha modal e limpa os campos
      setShowLeadModal(false);
      setAdopterName("");
      setAdopterWhatsapp("");
      setAdopterNeighborhood("");
      setLeadMessage("");
      
      alert("Interesse registrado! Redirecionando para o WhatsApp da ONG...");
    } catch (err: any) {
      console.error("Erro ao enviar lead:", err);
      alert(err.message || "Não foi possível registrar seu interesse de adoção.");
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className={styles.container}>
      <button onClick={() => router.push("/animais")} className={styles.backButton}>
        ⬅️ Voltar para a Galeria
      </button>

      <div className={styles.grid}>
        {/* Coluna da Esquerda: Mídia */}
        <div className={styles.mediaColumn}>
          <div className={styles.mainImageContainer}>
            {activeImage ? (
              <img src={activeImage} alt={animal.name} className={styles.mainImage} />
            ) : (
              <div className={styles.noImage}>🐾</div>
            )}
          </div>

          {images.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {images.map((img: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`${styles.thumbnail} ${index === activeImageIndex ? styles.thumbnailActive : ""}`}
                >
                  <img src={img.url} alt={`Thumbnail ${index + 1}`} className={styles.thumbnailImg} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Coluna da Direita: Informações */}
        <div className={styles.infoColumn}>
          <div className={styles.header}>
            <div className={styles.badgeRow}>
              {animal.adoption_priority === "Urgente" && (
                <span className={`${styles.badge} ${styles.badgeUrgente}`}>🚨 Urgente</span>
              )}
              {animal.adoption_priority === "Destaque" && (
                <span className={`${styles.badge} ${styles.badgeDestaque}`}>⭐ Destaque</span>
              )}
              {animal.is_special_care && (
                <span className={`${styles.badge} ${styles.badgeCuidados}`}>🏥 Necessita Cuidados</span>
              )}
              {isLongWait() && (
                <span className={`${styles.badge} ${styles.badgeLongaEspera}`}>💜 Espera Longa</span>
              )}
            </div>
            <h1 className={styles.title}>{animal.name}</h1>
            <div className={styles.metaRow}>
              <span>📍 {animal.neighborhood}, {animal.city}</span>
              <span>•</span>
              <span className={styles.waitingTime}>🕒 {waitingText}</span>
            </div>
          </div>

          {/* Tags de Personalidade */}
          {animal.personality_tags?.length > 0 && (
            <div>
              <h3 className={styles.sectionTitle}>Sobre mim</h3>
              <div className={styles.tagsContainer}>
                {animal.personality_tags.map((tag: string) => (
                  <span key={tag} className={styles.tag}>
                    🐾 {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ficha Técnica */}
          <div>
            <h3 className={styles.sectionTitle}>Detalhes e Cuidados</h3>
            <div className={styles.specsGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Espécie:</span>
                <span className={styles.specValue}>{animal.species}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Sexo:</span>
                <span className={styles.specValue}>{animal.sex}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Idade aproximada:</span>
                <span className={styles.specValue}>{animal.approximate_age}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Porte:</span>
                <span className={styles.specValue}>{animal.size}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Castrado?</span>
                <span className={styles.specValue}>{animal.is_castrated ? "Sim" : "Não"}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Vacinado?</span>
                <span className={styles.specValue}>{animal.is_vaccinated ? "Sim" : "Não"}</span>
              </div>
            </div>
          </div>

          {/* Storytelling */}
          <div>
            <h3 className={styles.sectionTitle}>Minha História</h3>
            <p className={styles.storyText}>{animal.storytelling}</p>
          </div>

          {/* Card da ONG & CTA */}
          <div className={styles.actionCard}>
            <div className={styles.orgArea}>
              {animal.organizations?.logo_url ? (
                <img src={animal.organizations.logo_url} alt={animal.organizations.name} className={styles.orgLogo} />
              ) : (
                <div className={styles.orgPlaceholder}>
                  {animal.organizations?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className={styles.orgInfo}>
                <span className={styles.orgName}>{animal.organizations?.name}</span>
                <span className={styles.orgLocation}>📍 Atuação: {animal.organizations?.neighborhood}</span>
              </div>
            </div>
            
            <button onClick={() => setShowLeadModal(true)} className={styles.ctaButton}>
              ❤️ Quero Adotar
            </button>

            {/* Doação direta via Pix */}
            {animal.organizations?.donation_methods?.pix_key && (
              <div className={styles.pixArea}>
                <span className={styles.pixLabel}>Apoie com uma Doação Pix:</span>
                <div className={styles.pixKeyWrapper}>
                  <code className={styles.pixKey}>{animal.organizations.donation_methods.pix_key}</code>
                  <button
                    onClick={() => handleCopyPix(animal.organizations.donation_methods.pix_key)}
                    className={styles.copyPixBtn}
                  >
                    {copiedPix ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                {animal.organizations.donation_methods.pix_holder && (
                  <span className={styles.pixHolder}>
                    Titular: <strong>{animal.organizations.donation_methods.pix_holder}</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Interesse em Adoção (Lead Completo) */}
      {showLeadModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 1000,
          backdropFilter: "blur(2px)"
        }}>
          <div style={{
            backgroundColor: "white", padding: "32px", borderRadius: "16px",
            maxWidth: "460px", width: "100%", position: "relative",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
          }}>
            <button 
              onClick={() => setShowLeadModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#888" }}
            >
              ×
            </button>
            <h3 style={{ marginBottom: "8px", color: "var(--color-primary-dark)", fontSize: "20px", fontWeight: 700 }}>Interesse em Adotar</h3>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              Preencha seus dados para entrar em contato com a ONG. Ao clicar em "Enviar", salvaremos seus dados e abriremos o WhatsApp da organização.
            </p>

            <form onSubmit={handleSubmitLead} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-dark)" }}>Seu Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  required
                  value={adopterName}
                  onChange={(e) => setAdopterName(e.target.value)}
                  disabled={submittingLead}
                  style={{ padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-dark)" }}>Seu WhatsApp (DDD + Número) *</label>
                <input
                  type="tel"
                  placeholder="Ex: 98991234567"
                  required
                  value={adopterWhatsapp}
                  onChange={(e) => setAdopterWhatsapp(e.target.value)}
                  disabled={submittingLead}
                  style={{ padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-dark)" }}>Sua Cidade (Maranhão) *</label>
                <select
                  required
                  value={adopterNeighborhood}
                  onChange={(e) => setAdopterNeighborhood(e.target.value)}
                  disabled={submittingLead}
                  style={{ padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", outline: "none", cursor: "pointer" }}
                >
                  <option value="">Selecione sua cidade...</option>
                  {CIDADES_MARANHAO.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-primary-dark)" }}>Mensagem de Apresentação *</label>
                <textarea
                  placeholder="Fale brevemente sobre você, se tem outros pets ou se mora em casa/apartamento..."
                  required
                  rows={4}
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                  disabled={submittingLead}
                  style={{ padding: "10px 14px", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "none" }}
                />
              </div>

              <button 
                type="submit"
                disabled={submittingLead}
                className={styles.ctaButton}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {submittingLead ? "Registrando..." : "Enviar Interesse e Ir ao WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
