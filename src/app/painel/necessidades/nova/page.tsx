"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NEED_CATEGORIES } from "@/utils/constants";
import panelStyles from "../../painel.module.css";

export default function NovaNecessidade() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixHolder, setPixHolder] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!title || !category || !description) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos." });
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from("organization_needs")
        .insert({
          organization_id: user.id,
          title,
          category,
          description,
          pix_key: pixKey || null,
          pix_holder: pixHolder || null,
          is_active: true,
        });

      if (error) throw error;

      setMessage({ type: "success", text: "Pedido de apoio compartilhado com sucesso!" });
      setTimeout(() => {
        router.push("/painel/necessidades");
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao salvar necessidade:", err);
      setMessage({ type: "error", text: err.message || "Erro ao tentar publicar a necessidade." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className={panelStyles.pageTitle}>Pedir Apoio à Comunidade</h1>
      <p className={panelStyles.pageDescription}>Descreva o que a sua iniciativa mais precisa no momento (como mantimentos, medicamentos, ração ou lar temporário) para mobilizar a comunidade.</p>

      {message && (
        <div className={`${panelStyles.message} ${message.type === "success" ? panelStyles.success : panelStyles.error}`}>
          {message.text}
        </div>
      )}

      <div className={panelStyles.card}>
        <form className={panelStyles.form} onSubmit={handleSaveNeed}>
          
          <div className={panelStyles.formGroup}>
            <label className={panelStyles.label} htmlFor="title">Título da Necessidade *</label>
            <input
              id="title"
              type="text"
              className={panelStyles.input}
              placeholder="Ex: Precisamos de 20kg de ração para filhotes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className={panelStyles.formGroup}>
            <label className={panelStyles.label} htmlFor="category">Categoria da Necessidade *</label>
            <select
              id="category"
              className={panelStyles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={saving}
            >
              <option value="">Selecione uma categoria...</option>
              {NEED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className={panelStyles.formGroup}>
            <label className={panelStyles.label} htmlFor="description">Descrição Detalhada *</label>
            <textarea
              id="description"
              className={panelStyles.textarea}
              placeholder="Descreva a urgência da situação e informe como as pessoas podem ajudar a entregar os donativos ou prestar os serviços necessários..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className={panelStyles.formGrid} style={{ marginTop: "8px" }}>
            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="pixKey">Chave Pix Especial da Campanha (Opcional)</label>
              <input
                id="pixKey"
                type="text"
                className={panelStyles.input}
                placeholder="Ex: E-mail, celular, CNPJ ou chave aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                disabled={saving}
              />
              <p style={{ fontSize: "12px", color: "#666" }}>Deixe em branco para usar o Pix principal da sua ONG.</p>
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="pixHolder">Titular do Pix da Campanha (Opcional)</label>
              <input
                id="pixHolder"
                type="text"
                className={panelStyles.input}
                placeholder="Ex: Nome da ONG ou responsável pelo caso"
                value={pixHolder}
                onChange={(e) => setPixHolder(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className={panelStyles.buttonGroup}>
            <button
              type="submit"
              className={panelStyles.saveButton}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Compartilhar Necessidade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
