import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./home.module.css";
import catalogStyles from "./animais/catalogo.module.css";
import needsStyles from "./ajuda/ajuda.module.css";

// Helper para calcular o tempo de espera (Server-side)
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

export const revalidate = 60; // Revalida a página a cada 60 segundos para atualizar métricas de forma custo zero

export default async function Home() {
  // 1. Fetch de Métricas de Impacto no banco (Custo Zero)
  const { count: totalAnimals } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true });

  const { count: totalAdoptions } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("status", "Adotado");

  const { count: totalOrgs } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved");

  const { count: totalResolvedNeeds } = await supabase
    .from("organization_needs")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  // 2. Fetch de 4 animais recentes disponíveis para adoção
  const { data: recentPets } = await supabase
    .from("animals")
    .select(`
      *,
      organizations!inner (
        name,
        approval_status
      ),
      animal_images (
        url,
        display_order
      )
    `)
    .eq("status", "Disponivel")
    .eq("organizations.approval_status", "approved")
    .order("published_at", { ascending: false })
    .limit(4);

  // 3. Fetch de 3 necessidades urgentes ativas
  const { data: recentNeeds } = await supabase
    .from("organization_needs")
    .select(`
      *,
      organizations!inner (
        name,
        neighborhood,
        approval_status,
        logo_url
      )
    `)
    .eq("is_active", true)
    .eq("organizations.approval_status", "approved")
    .order("created_at", { ascending: false })
    .limit(3);

  // 4. Fetch de ONGs parceiras homologadas
  const { data: partnerOrgs } = await supabase
    .from("organizations")
    .select("name, logo_url, neighborhood, slug")
    .eq("approval_status", "approved")
    .limit(6);

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Ração": return needsStyles.catRacao;
      case "Medicamentos": return needsStyles.catMedicamentos;
      case "Lar temporário": return needsStyles.catLarTemporario;
      case "Voluntários": return needsStyles.catVoluntarios;
      case "Transporte": return needsStyles.catTransporte;
      case "Eventos": return needsStyles.catEventos;
      default: return needsStyles.catOutros;
    }
  };

  return (
    <div className={styles.container}>
      <Header />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Conectando amor, acolhendo vidas</h1>
          <p className={styles.heroSubtitle}>
            Conectamos protetores, ONGs, voluntários e adotantes para fortalecer a causa animal e salvar vidas.
          </p>
          <div className={styles.heroButtonGroup}>
            <Link href="/animais" className={styles.btnPrimary}>Encontrar um amigo pet</Link>
            <Link href="/ajuda" className={styles.btnSecondary}>Quero Ajudar</Link>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <img
            src="/ilustracao-abraco-emblem.png"
            alt="Ilustração de cão, gato e humano abraçados - Rede Ninhada"
            className={styles.heroImage}
          />
        </div>
      </section>

      {/* Métricas de Impacto */}
      <section className={styles.metricsSection}>
        <div className={styles.metricsContainer}>
          <div className={styles.metricCard}>
            <span className={styles.metricNumber}>{totalAnimals || 0}</span>
            <span className={styles.metricLabel}>🐾 Histórias Compartilhadas</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricNumber}>{totalAdoptions || 0}</span>
            <span className={styles.metricLabel}>🏡 Vidas Acolhidas</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricNumber}>{totalOrgs || 0}</span>
            <span className={styles.metricLabel}>🤝 Organizações da Rede</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricNumber}>{totalResolvedNeeds || 0}</span>
            <span className={styles.metricLabel}>❤️ Apoios Recebidos</span>
          </div>
        </div>
      </section>

      {/* Seção 1: Como ajudar hoje? */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Como fazer a diferença hoje?</h2>
        </div>
        <div className={styles.helpGrid}>
          <Link href="/animais" className={styles.helpCard}>
            <span className={styles.helpIcon}>🐕</span>
            <h3 className={styles.helpTitle}>Acolher</h3>
            <p className={styles.helpDesc}>Dê um lar amoroso e mude a vida de um amigo.</p>
          </Link>
          <Link href="/ajuda?categoria=Ração" className={styles.helpCard}>
            <span className={styles.helpIcon}>💰</span>
            <h3 className={styles.helpTitle}>Apoiar com Doações</h3>
            <p className={styles.helpDesc}>Contribua com rações e medicamentos necessários.</p>
          </Link>
          <Link href="/ajuda?categoria=Lar%20temporário" className={styles.helpCard}>
            <span className={styles.helpIcon}>🏠</span>
            <h3 className={styles.helpTitle}>Lar Temporário</h3>
            <p className={styles.helpDesc}>Acolha provisoriamente um pet em recuperação.</p>
          </Link>
          <Link href="/ajuda?categoria=Voluntários" className={styles.helpCard}>
            <span className={styles.helpIcon}>🤝</span>
            <h3 className={styles.helpTitle}>Quero Ajudar</h3>
            <p className={styles.helpDesc}>Ofereça seu apoio em transporte ou feiras da rede.</p>
          </Link>
          <Link href="/animais" className={styles.helpCard}>
            <span className={styles.helpIcon}>📢</span>
            <h3 className={styles.helpTitle}>Espalhar a Causa</h3>
            <p className={styles.helpDesc}>Compartilhe a história de quem procura um lar.</p>
          </Link>
        </div>
      </section>

      {/* Seção 2: Animais aguardando um lar */}
      {recentPets && recentPets.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Histórias esperando por um lar</h2>
            <Link href="/animais" className={styles.sectionLink}>Conhecer todos os pets ➔</Link>
          </div>
          <div className={styles.petsGrid}>
            {recentPets.map((pet) => {
              const coverImage = pet.animal_images?.[0]?.url;
              const waitingText = getWaitingTimeText(pet.published_at);
              const isLongWaiting = Math.floor(Math.abs(new Date().getTime() - new Date(pet.published_at).getTime()) / (1000 * 60 * 60 * 24)) >= 90;

              return (
                <Link href={`/animais/${pet.slug}`} key={pet.id} className={catalogStyles.card}>
                  <div className={catalogStyles.imageContainer}>
                    {coverImage ? (
                      <img src={coverImage} alt={pet.name} className={catalogStyles.image} />
                    ) : (
                      <div className={catalogStyles.noImage}>🐾</div>
                    )}
                    <div className={catalogStyles.badgeArea}>
                      {pet.adoption_priority === "Urgente" && (
                        <span className={`${catalogStyles.badge} ${catalogStyles.badgeUrgente}`}>🚨 Urgente</span>
                      )}
                      {pet.is_special_care && (
                        <span className={`${catalogStyles.badge} ${catalogStyles.badgeCuidados}`}>🏥 Especial</span>
                      )}
                      {isLongWaiting && (
                        <span className={`${catalogStyles.badge} ${catalogStyles.badgeLongaEspera}`}>💜 Espera Longa</span>
                      )}
                    </div>
                  </div>

                  <div className={catalogStyles.info}>
                    <h3 className={catalogStyles.name}>{pet.name}</h3>
                    <div className={catalogStyles.meta}>
                      <span>{pet.species}</span>
                      <span>•</span>
                      <span>{pet.sex}</span>
                    </div>
                    <span className={catalogStyles.waitingTime}>🕒 {waitingText}</span>
                  </div>

                  <div className={catalogStyles.footer}>
                    <span>Por: <span className={catalogStyles.orgName}>{pet.organizations?.name}</span></span>
                    <span>📍 {pet.neighborhood}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Seção 3: Necessidades urgentes da rede */}
      {recentNeeds && recentNeeds.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Necessidades de apoio da rede</h2>
            <Link href="/ajuda" className={styles.sectionLink}>Ver formas de ajudar ➔</Link>
          </div>
          <div className={styles.needsGrid}>
            {recentNeeds.map((need) => (
              <article key={need.id} className={needsStyles.card}>
                <div className={needsStyles.cardHeader}>
                  <span className={`${needsStyles.categoryBadge} ${getCategoryClass(need.category)}`}>
                    {need.category}
                  </span>
                  <span style={{ fontSize: "12px", color: "#888" }}>
                    🕒 {new Date(need.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <h3 className={needsStyles.needTitle}>{need.title}</h3>
                <p className={needsStyles.needDescription}>{need.description}</p>

                <div className={needsStyles.footer}>
                  {need.organizations?.logo_url ? (
                    <img src={need.organizations.logo_url} alt={need.organizations.name} className={needsStyles.orgLogo} />
                  ) : (
                    <div className={needsStyles.orgPlaceholder}>
                      {need.organizations?.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className={needsStyles.orgInfo}>
                    <span className={needsStyles.orgName}>{need.organizations?.name}</span>
                    <span className={needsStyles.orgLocation}>📍 {need.organizations?.neighborhood}</span>
                  </div>
                </div>

                <Link href={`/ajuda?categoria=${encodeURIComponent(need.category)}`} className={needsStyles.helpButton}>
                  🤝 Quero Ajudar
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Seção 4: ONGs e protetores parceiros */}
      {partnerOrgs && partnerOrgs.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Organizações da rede</h2>
          </div>
          <div className={styles.orgsGrid}>
            {partnerOrgs.map((org: any) => (
              <div key={org.slug} className={styles.orgCard}>
                {org.logo_url ? (
                  <img src={org.logo_url} alt={org.name} className={styles.orgLogo} />
                ) : (
                  <div className={styles.orgLogoPlaceholder}>
                    {org.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={styles.orgName}>{org.name}</span>
                <span style={{ fontSize: "11px", color: "#888" }}>📍 {org.neighborhood}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Seção 5: Histórias de Acolhimento (Evolução Futura) */}
      <section className={styles.section} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "80px", marginBottom: "80px" }}>
        <h2 className={styles.sectionTitle} style={{ textAlign: "center", marginBottom: "16px" }}>Histórias de Acolhimento</h2>
        <p style={{ textAlign: "center", color: "#666", maxWidth: "600px", margin: "0 auto 40px auto", fontSize: "15px" }}>
          Em breve, compartilharemos relatos emocionantes de adoções bem-sucedidas e reencontros felizes no Maranhão. A proteção animal é sobre transformar vidas!
        </p>
      </section>

      {/* Seção 6: FAQ Rápido */}
      <section className={styles.faqSection} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "80px", marginBottom: "80px" }}>
        <h2 className={styles.sectionTitle} style={{ textAlign: "center", marginBottom: "12px" }}>Dúvidas Frequentes</h2>
        <p style={{ textAlign: "center", color: "#666", maxWidth: "600px", margin: "0 auto 32px auto", fontSize: "15px" }}>
          Tem dúvidas sobre como adotar, doar ou cadastrar sua iniciativa? Veja as perguntas mais comuns abaixo:
        </p>

        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>Como funciona o processo de adoção na Rede Ninhada?</summary>
            <p className={styles.faqAnswer}>
              Nós atuamos como uma ponte de conexão rápida. Ao escolher um pet na galeria e clicar em "Quero Adotar", você insere seus dados básicos de contato. Em seguida, a plataforma abre o WhatsApp da ONG ou protetor responsável com uma mensagem de apresentação pronta para vocês iniciarem a entrevista e triagem.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>Como posso doar rações, remédios ou oferecer Lar Temporário?</summary>
            <p className={styles.faqAnswer}>
              Acesse a página "Como Ajudar" para visualizar a lista de demandas ativas. Você pode filtrar por categoria (como Ração ou Lar Temporário), copiar a chave Pix da ONG para doar diretamente, ou clicar em "Chamar no WhatsApp" para combinar a entrega física de suprimentos ou voluntariado.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqQuestion}>Sou protetor independente ou represento uma ONG. Como posso participar?</summary>
            <p className={styles.faqAnswer}>
              Basta clicar em "Painel ONG" no topo da página e realizar o cadastro da sua iniciativa. Todos os novos perfis passam por uma validação rápida da administração da Rede Ninhada para garantir a segurança dos doadores. Uma vez homologado, você terá acesso total para publicar seus animais e gerenciar necessidades.
            </p>
          </details>
        </div>

        <div className={styles.faqCtaArea}>
          <Link href="/faq" className={styles.btnSecondary} style={{ padding: "12px 28px", fontSize: "14px" }}>
            Ver FAQ Completo ➔
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
