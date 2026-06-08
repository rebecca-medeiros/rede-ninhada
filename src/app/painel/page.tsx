"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CIDADES_MARANHAO } from "@/utils/constants";
import styles from "./painel.module.css";

export default function PerfilONG() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<any>(null);

  // Estados do formulário
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixHolder, setPixHolder] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setOrg(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setNeighborhood(data.neighborhood || "");
        setWhatsapp(data.phone_whatsapp || "");
        setInstagram(data.social_links?.instagram || "");
        setFacebook(data.social_links?.facebook || "");
        setPixKey(data.donation_methods?.pix_key || "");
        setPixHolder(data.donation_methods?.pix_holder || "");
        setLogoUrl(data.logo_url || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Formato do nome do arquivo: id-usuario/logo
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/logo-${Date.now()}.${fileExt}`;

      // Upload do arquivo para o bucket 'logos' (certifique-se de criar este bucket público no Supabase)
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      setMessage({ type: "success", text: "Logo enviado com sucesso! Clique em 'Salvar Alterações' para confirmar." });
    } catch (err: any) {
      console.error("Erro no upload do logo:", err);
      setMessage({ type: "error", text: err.message || "Erro ao enviar o logo." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("organizations")
        .update({
          name,
          description,
          neighborhood,
          phone_whatsapp: whatsapp,
          logo_url: logoUrl,
          social_links: {
            instagram,
            facebook,
          },
          donation_methods: {
            pix_key: pixKey,
            pix_holder: pixHolder,
          },
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setMessage({ type: "error", text: err.message || "Erro ao salvar alterações." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Carregando dados do perfil...</p>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Perfil da Iniciativa</h1>
      <p className={styles.pageDescription}>Cuide das informações sobre sua organização que são exibidas para a comunidade e futuros adotantes.</p>

      {message && (
        <div className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
          {message.text}
        </div>
      )}

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSave}>
          
          {/* Logo Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Logotipo ou Foto de Perfil</label>
            <div className={styles.logoUploadArea}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className={styles.logoPreview} />
              ) : (
                <div className={styles.logoPlaceholder}>
                  {name ? name.substring(0, 2).toUpperCase() : "ONG"}
                </div>
              )}
              <div>
                <label htmlFor="logo-file" className={styles.uploadButtonLabel}>
                  {uploadingLogo ? "Enviando..." : "Escolher Imagem"}
                </label>
                <input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleUploadLogo}
                  disabled={uploadingLogo || saving}
                />
                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>Tamanho recomendado: 200x200px (JPG ou PNG).</p>
              </div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.label} htmlFor="name">Nome da ONG / Iniciativa *</label>
              <input
                id="name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.label} htmlFor="description">Descrição / Missão da Organização</label>
              <textarea
                id="description"
                className={styles.textarea}
                placeholder="Conte sobre o foco da sua ONG, animais resgatados, como o grupo surgiu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="neighborhood">Cidade de Atuação *</label>
              <select
                id="neighborhood"
                className={styles.select}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
                disabled={saving}
              >
                <option value="">Selecione a cidade...</option>
                {CIDADES_MARANHAO.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="whatsapp">WhatsApp Público para Adoções *</label>
              <input
                id="whatsapp"
                type="tel"
                className={styles.input}
                placeholder="Ex: 98991234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="instagram">Usuário Instagram (sem @)</label>
              <input
                id="instagram"
                type="text"
                className={styles.input}
                placeholder="Ex: rede.ninhada"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="facebook">Link Facebook (URL completa)</label>
              <input
                id="facebook"
                type="url"
                className={styles.input}
                placeholder="Ex: https://facebook.com/ong"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Módulo de Doação Simplificado */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="pix-key">Chave Pix de Doação</label>
              <input
                id="pix-key"
                type="text"
                className={styles.input}
                placeholder="E-mail, CNPJ, Celular ou Aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="pix-holder">Nome do Titular do Pix</label>
              <input
                id="pix-holder"
                type="text"
                className={styles.input}
                placeholder="Nome da ONG ou do protetor responsável"
                value={pixHolder}
                onChange={(e) => setPixHolder(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.saveButton} disabled={saving || uploadingLogo}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
