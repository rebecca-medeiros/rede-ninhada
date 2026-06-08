"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./necessidades.module.css";
import panelStyles from "../painel.module.css";

export default function ListaNecessidades() {
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadNeeds() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organization_needs")
        .select("*")
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNeeds(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar necessidades:", err);
      setMessage({ type: "error", text: "Não foi possível carregar as necessidades." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNeeds();
  }, []);

  const handleToggleActive = async (needId: string, currentStatus: boolean) => {
    setMessage(null);
    try {
      const { error } = await supabase
        .from("organization_needs")
        .update({ is_active: !currentStatus })
        .eq("id", needId);

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Necessidade marcada como ${!currentStatus ? "ativa" : "atendida/concluída"}!`,
      });
      loadNeeds();
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      setMessage({ type: "error", text: "Erro ao tentar atualizar o status." });
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!confirm("Tem certeza que deseja remover esta necessidade permanentemente?")) return;

    setMessage(null);
    try {
      const { error } = await supabase
        .from("organization_needs")
        .delete()
        .eq("id", needId);

      if (error) throw error;

      setMessage({ type: "success", text: "Necessidade removida com sucesso!" });
      loadNeeds();
    } catch (err: any) {
      console.error("Erro ao deletar necessidade:", err);
      setMessage({ type: "error", text: "Erro ao tentar remover a necessidade." });
    }
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

  return (
    <div>
      <div className={styles.headerArea}>
        <div>
          <h1 className={panelStyles.pageTitle}>Necessidades de Apoio</h1>
          <p className={panelStyles.pageDescription}>Compartilhe as necessidades mais urgentes do seu abrigo para que a comunidade possa ajudar com suprimentos, rações ou acolhimento temporário.</p>
        </div>
        <Link href="/painel/necessidades/nova" className={styles.buttonAdd}>
          ➕ Compartilhar Necessidade
        </Link>
      </div>

      {message && (
        <div className={`${panelStyles.message} ${message.type === "success" ? panelStyles.success : panelStyles.error}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Carregando necessidades...</p>
      ) : needs.length === 0 ? (
        <div className={panelStyles.card} style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#777", marginBottom: "20px" }}>Nenhuma necessidade de apoio cadastrada por aqui ainda.</p>
          <Link href="/painel/necessidades/nova" className={styles.buttonAdd} style={{ display: "inline-flex" }}>
            Compartilhar primeira necessidade
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {needs.map((need) => (
            <div key={need.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={`${styles.categoryBadge} ${getCategoryClass(need.category)}`}>
                  {need.category}
                </span>
                <span className={`${styles.statusBadge} ${need.is_active ? styles.statusAtivo : styles.statusResolvido}`}>
                  {need.is_active ? "Ativa" : "Atendida"}
                </span>
              </div>

              <h3 className={styles.needTitle}>{need.title}</h3>
              <p className={styles.needDescription}>{need.description}</p>
              
              <span className={styles.date}>
                Publicada em: {new Date(need.created_at).toLocaleDateString("pt-BR")}
              </span>

              <div className={styles.cardActions}>
                {need.is_active ? (
                  <button
                    onClick={() => handleToggleActive(need.id, need.is_active)}
                    className={`${styles.btnAction} ${styles.btnResolve}`}
                  >
                    ✅ Resolvida
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleActive(need.id, need.is_active)}
                    className={styles.btnAction}
                  >
                    🔄 Reativar
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNeed(need.id)}
                  className={`${styles.btnAction} ${styles.btnDelete}`}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
