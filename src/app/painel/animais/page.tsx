"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./animais.module.css";
import panelStyles from "../painel.module.css";

export default function ListaAnimais() {
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadAnimals() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca animais da organização atual, juntamente com suas imagens
      const { data, error } = await supabase
        .from("animals")
        .select(`
          *,
          animal_images (
            url,
            display_order
          )
        `)
        .eq("organization_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnimals(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar animais:", err);
      setMessage({ type: "error", text: "Não foi possível carregar a lista de animais." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnimals();
  }, []);

  const handleUpdateStatus = async (animalId: string, newStatus: string) => {
    setMessage(null);
    try {
      const { error } = await supabase
        .from("animals")
        .update({ status: newStatus })
        .eq("id", animalId);

      if (error) throw error;

      setMessage({ type: "success", text: `Status do animal atualizado para ${newStatus}!` });
      loadAnimals(); // Recarrega dados
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      setMessage({ type: "error", text: "Erro ao tentar atualizar o status." });
    }
  };

  const handleDeleteAnimal = async (animalId: string) => {
    if (!confirm("Tem certeza que deseja remover este animal permanentemente? Esta ação não pode ser desfeita.")) return;

    setMessage(null);
    try {
      const { error } = await supabase
        .from("animals")
        .delete()
        .eq("id", animalId);

      if (error) throw error;

      setMessage({ type: "success", text: "Amigo removido com sucesso!" });
      loadAnimals();
    } catch (err: any) {
      console.error("Erro ao deletar animal:", err);
      setMessage({ type: "error", text: "Erro ao tentar remover o animal." });
    }
  };

  return (
    <div>
      <div className={styles.headerArea}>
        <div>
          <h1 className={panelStyles.pageTitle}>Nossos Animais</h1>
          <p className={panelStyles.pageDescription}>Gerencie as histórias, fotos e status de adoção dos amigos sob os cuidados de sua organização.</p>
        </div>
        <Link href="/painel/animais/novo" className={styles.buttonAdd}>
          ➕ Compartilhar nova história
        </Link>
      </div>

      {message && (
        <div className={`${panelStyles.message} ${message.type === "success" ? panelStyles.success : panelStyles.error}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Carregando animais...</p>
      ) : animals.length === 0 ? (
        <div className={styles.petCard} style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "#777", marginBottom: "20px" }}>Você ainda não compartilhou histórias de animais.</p>
          <Link href="/painel/animais/novo" className={styles.buttonAdd} style={{ display: "inline-flex" }}>
            Compartilhar primeira história
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {animals.map((pet) => {
            // Pega a imagem com menor display_order ou a primeira disponível
            const sortedImages = pet.animal_images?.sort((a: any, b: any) => a.display_order - b.display_order);
            const coverImage = sortedImages?.[0]?.url;

            return (
              <div key={pet.id} className={styles.petCard}>
                <div className={styles.imageArea}>
                  {coverImage ? (
                    <img src={coverImage} alt={pet.name} className={styles.petImage} />
                  ) : (
                    <div className={styles.noImage}>🐾</div>
                  )}
                  <span
                    className={`${styles.badgePriority} ${
                      pet.adoption_priority === "Urgente"
                        ? styles.badgeUrgente
                        : pet.adoption_priority === "Destaque"
                        ? styles.badgeDestaque
                        : styles.badgeNormal
                    }`}
                  >
                    {pet.adoption_priority}
                  </span>
                </div>

                <div className={styles.petInfo}>
                  <div className={styles.petHeader}>
                    <h3 className={styles.petName}>{pet.name}</h3>
                    <span
                      className={`${styles.badgeStatus} ${
                        pet.status === "Disponivel"
                          ? styles.statusDisponivel
                          : pet.status === "Reservado"
                          ? styles.statusReservado
                          : pet.status === "Adotado"
                          ? styles.statusAdotado
                          : styles.statusArquivado
                      }`}
                    >
                      {pet.status}
                    </span>
                  </div>

                  <div className={styles.petMeta}>
                    <span>{pet.species}</span>
                    <span>•</span>
                    <span>{pet.sex}</span>
                    <span>•</span>
                    <span>{pet.neighborhood}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {pet.status === "Disponivel" && (
                    <button
                      onClick={() => handleUpdateStatus(pet.id, "Reservado")}
                      className={styles.btnAction}
                    >
                      🤝 Reservar
                    </button>
                  )}
                  {pet.status === "Reservado" && (
                    <button
                      onClick={() => handleUpdateStatus(pet.id, "Disponivel")}
                      className={styles.btnAction}
                    >
                      🔓 Disponibilizar
                    </button>
                  )}
                  {pet.status !== "Adotado" && (
                    <button
                      onClick={() => handleUpdateStatus(pet.id, "Adotado")}
                      className={styles.btnAction}
                      style={{ color: "var(--color-success)" }}
                    >
                      🏡 Adotado!
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAnimal(pet.id)}
                    className={`${styles.btnAction} ${styles.btnDelete}`}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
