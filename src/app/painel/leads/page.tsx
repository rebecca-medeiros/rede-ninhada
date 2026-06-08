"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./leads.module.css";
import panelStyles from "../painel.module.css";

export default function LeadsRecebidos() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadLeads() {
    setLoading(true);
    try {
      // Busca leads cujos animais pertencem à organização atual
      // RLS restringe a busca automaticamente apenas aos animais da ONG logada
      const { data, error } = await supabase
        .from("adoption_leads")
        .select(`
          *,
          animals!inner (
            name,
            species
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar leads:", err);
      setMessage({ type: "error", text: "Não foi possível carregar as manifestações de interesse." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setMessage(null);
    try {
      const { error } = await supabase
        .from("adoption_leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      setMessage({ type: "success", text: "Status da intenção de adoção atualizado!" });
      loadLeads();
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      setMessage({ type: "error", text: "Erro ao tentar atualizar o status." });
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Novo": return styles.statusNovo;
      case "Em Contato": return styles.statusEmContato;
      case "Aprovado": return styles.statusAprovado;
      case "Rejeitado": return styles.statusRejeitado;
      default: return "";
    }
  };

  const generateWhatsappUrl = (phone: string, petName: string, adopterName: string) => {
    const text = `Olá, ${adopterName}! Faço parte da Rede Ninhada e vi que você tem interesse em dar um lar para o(a) ${petName}. Vamos conversar sobre como funciona o acolhimento?`;
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
  };

  return (
    <div>
      <h1 className={panelStyles.pageTitle}>Interessados em Adoção</h1>
      <p className={panelStyles.pageDescription}>
        Gerencie os pedidos de adoção e contatos das pessoas que se interessaram pelos animais sob seus cuidados. Use os botões para iniciar uma conversa de triagem no WhatsApp.
      </p>

      {message && (
        <div className={`${panelStyles.message} ${message.type === "success" ? panelStyles.success : panelStyles.error}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Carregando manifestações de interesse...</p>
      ) : leads.length === 0 ? (
        <div className={panelStyles.card} style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#777" }}>Ainda não há manifestações de interesse de adoção por aqui.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Data</th>
                <th className={styles.th}>Animal</th>
                <th className={styles.th}>Interessado</th>
                <th className={styles.th}>Mensagem</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.date}>
                      {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.petName}>
                      {lead.animals?.name}
                    </span>
                    <div style={{ fontSize: "11px", color: "#666" }}>{lead.animals?.species}</div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.adopterInfo}>
                      <span className={styles.adopterName}>{lead.adopter_name}</span>
                      <span className={styles.adopterLocation}>📍 {lead.adopter_neighborhood}</span>
                      <span style={{ fontSize: "12px", color: "#666" }}>📱 {lead.adopter_whatsapp}</span>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <p className={styles.message}>{lead.message}</p>
                  </td>
                  <td className={styles.td}>
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      className={`${styles.statusSelect} ${getStatusClass(lead.status)}`}
                    >
                      <option value="Novo">Novo</option>
                      <option value="Em Contato">Em Contato</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Rejeitado">Rejeitado</option>
                    </select>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionsRow}>
                      <a
                        href={generateWhatsappUrl(
                          lead.adopter_whatsapp,
                          lead.animals?.name,
                          lead.adopter_name
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnWhatsapp}
                      >
                        💬 Falar no WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
