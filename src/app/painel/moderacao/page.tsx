"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./moderacao.module.css";

export default function ModeracaoPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function checkAdminAndLoad() {
      // 1. Verifica se há usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Busca o cargo (role) do usuário
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("role")
        .eq("id", user.id)
        .single();

      if (orgError || !orgData || orgData.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // 3. Carrega as organizações registradas
      await loadOrganizations();
    }

    checkAdminAndLoad();
  }, [router]);

  async function loadOrganizations() {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrgs(data);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected" | "pending") => {
    setActioningId(id);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ approval_status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Status da organização atualizado para "${
          newStatus === "approved" ? "Aprovado" : newStatus === "rejected" ? "Recusado" : "Pendente"
        }" com sucesso!`,
      });

      await loadOrganizations();
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      setMessage({ type: "error", text: err.message || "Erro ao atualizar status da organização." });
    } finally {
      setActioningId(null);
    }
  };

  if (loading && isAdmin === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <p style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>Verificando credenciais de administrador...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className={styles.deniedContainer}>
        <h2>🚫 Acesso Negado</h2>
        <p>Você não possui privilégios de administrador para acessar esta página.</p>
        <button onClick={() => router.push("/painel")} className={styles.backButton}>
          Voltar para o Painel
        </button>
      </div>
    );
  }

  // Filtra as organizações pelo status da aba selecionada
  const filteredOrgs = orgs.filter((o) => o.approval_status === activeTab);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>🛡️ Moderação de ONGs</h1>
      <p className={styles.pageDescription}>
        Gerencie e aprove o cadastro de novas organizações e protetores na plataforma Rede Ninhada.
      </p>

      {message && (
        <div className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
          {message.text}
        </div>
      )}

      {/* Abas de Navegação */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === "pending" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pendentes ({orgs.filter((o) => o.approval_status === "pending").length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "approved" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Aprovadas ({orgs.filter((o) => o.approval_status === "approved").length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "rejected" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          Recusadas ({orgs.filter((o) => o.approval_status === "rejected").length})
        </button>
      </div>

      {/* Tabela de Organizações */}
      <div className={styles.card}>
        {loading ? (
          <p>Atualizando lista de organizações...</p>
        ) : filteredOrgs.length === 0 ? (
          <p className={styles.emptyState}>Nenhuma organização encontrada nesta lista.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nome / Info</th>
                  <th>Contato</th>
                  <th>Bairro</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((orgItem) => (
                  <tr key={orgItem.id}>
                    <td>
                      {orgItem.logo_url ? (
                        <img src={orgItem.logo_url} alt="Logo" className={styles.logoMini} />
                      ) : (
                        <div className={styles.logoPlaceholderMini}>
                          {orgItem.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.orgName}>{orgItem.name}</div>
                      <div className={styles.orgSlug}>slug: {orgItem.slug}</div>
                      {orgItem.description && (
                        <div className={styles.orgDesc} title={orgItem.description}>
                          {orgItem.description.length > 60
                            ? orgItem.description.substring(0, 60) + "..."
                            : orgItem.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <a
                        href={`https://wa.me/${orgItem.phone_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.contactLink}
                      >
                        📞 {orgItem.phone_whatsapp}
                      </a>
                    </td>
                    <td>{orgItem.neighborhood}</td>
                    <td>
                      <span className={`${styles.badgeRole} ${orgItem.role === "admin" ? styles.adminRole : ""}`}>
                        {orgItem.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        {orgItem.role === "admin" ? (
                          <span className={styles.textMuted}>Protegido (Admin)</span>
                        ) : (
                          <>
                            {activeTab === "pending" && (
                              <>
                                <button
                                  className={`${styles.actionButton} ${styles.approveButton}`}
                                  onClick={() => handleUpdateStatus(orgItem.id, "approved")}
                                  disabled={actioningId === orgItem.id}
                                >
                                  ✅ Aprovar
                                </button>
                                <button
                                  className={`${styles.actionButton} ${styles.rejectButton}`}
                                  onClick={() => handleUpdateStatus(orgItem.id, "rejected")}
                                  disabled={actioningId === orgItem.id}
                                >
                                  ❌ Recusar
                                </button>
                              </>
                            )}

                            {activeTab === "approved" && (
                              <button
                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                onClick={() => handleUpdateStatus(orgItem.id, "rejected")}
                                disabled={actioningId === orgItem.id}
                              >
                                ⛔ Suspender
                              </button>
                            )}

                            {activeTab === "rejected" && (
                              <button
                                className={`${styles.actionButton} ${styles.approveButton}`}
                                onClick={() => handleUpdateStatus(orgItem.id, "approved")}
                                disabled={actioningId === orgItem.id}
                              >
                                🔄 Re-aprovar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
