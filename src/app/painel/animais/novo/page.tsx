"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CIDADES_MARANHAO, PERSONALITY_TAGS } from "@/utils/constants";
import imageCompression from "browser-image-compression";
import styles from "./../animais.module.css";
import panelStyles from "../../painel.module.css";

export default function NovoAnimal() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados do pet
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cachorro");
  const [sex, setSex] = useState("Macho");
  const [approximateAge, setApproximateAge] = useState("");
  const [size, setSize] = useState("Médio");
  const [neighborhood, setNeighborhood] = useState("");
  const [storytelling, setStorytelling] = useState("");
  const [priority, setPriority] = useState("Normal");
  
  // Flags médicas
  const [isCastrated, setIsCastrated] = useState(false);
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isDewormed, setIsDewormed] = useState(false);
  const [isSpecialCare, setIsSpecialCare] = useState(false);

  // Matriz de compatibilidade
  const [compWithDogs, setCompWithDogs] = useState(true);
  const [compWithCats, setCompWithCats] = useState(true);
  const [compWithChildren, setCompWithChildren] = useState(true);

  // Tags selecionadas
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Imagens
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleTagChange = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    // Limita a 5 fotos
    const limitedFiles = [...imageFiles, ...filesArray].slice(0, 5);
    setImageFiles(limitedFiles);

    // Previews das imagens
    const previews = limitedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index: number) => {
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedFiles);

    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updatedPreviews);
  };

  const compressAndUploadImages = async (userId: string, animalId: string): Promise<string[]> => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    const options = {
      maxSizeMB: 0.2, // 200KB
      maxWidthOrHeight: 800, // 800px no maior lado
      useWebWorker: true,
    };

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        // 1. Comprime a imagem no client-side para poupar banda e storage
        const compressedFile = await imageCompression(file, options);
        
        // 2. Faz o upload da imagem comprimida para o bucket publico 'pets'
        const fileExt = file.name.split(".").pop();
        const filePath = `${userId}/${animalId}/pet-photo-${i + 1}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("pets")
          .upload(filePath, compressedFile, { upsert: true });

        if (uploadError) throw uploadError;

        // 3. Pega a URL pública
        const { data: { publicUrl } } = supabase.storage
          .from("pets")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error(`Erro ao subir imagem ${i + 1}:`, err);
      }
    }

    setUploadingImages(false);
    return uploadedUrls;
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (imageFiles.length === 0) {
      setMessage({ type: "error", text: "Por favor, selecione pelo menos 1 foto do animal." });
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // 1. Criar o registro do animal (o slug é gerado pela Trigger SQL automatically)
      const { data: petData, error: petError } = await supabase
        .from("animals")
        .insert({
          organization_id: user.id,
          name,
          species,
          sex,
          approximate_age: approximateAge,
          size,
          neighborhood,
          storytelling,
          status: "Disponivel",
          adoption_priority: priority,
          personality_tags: selectedTags,
          is_castrated: isCastrated,
          is_vaccinated: isVaccinated,
          is_dewormed: isDewormed,
          is_special_care: isSpecialCare,
          comp_with_dogs: compWithDogs,
          comp_with_cats: compWithCats,
          comp_with_children: compWithChildren,
        })
        .select("id")
        .single();

      if (petError) throw petError;
      const animalId = petData.id;

      // 2. Comprimir e fazer o upload das fotos
      const imageUrls = await compressAndUploadImages(user.id, animalId);

      if (imageUrls.length > 0) {
        // 3. Gravar na tabela public.animal_images
        const imagesPayload = imageUrls.map((url, index) => ({
          animal_id: animalId,
          url,
          display_order: index,
        }));

        const { error: imagesError } = await supabase
          .from("animal_images")
          .insert(imagesPayload);

        if (imagesError) throw imagesError;
      }

      setMessage({ type: "success", text: "História do amigo compartilhada com sucesso!" });
      setTimeout(() => {
        router.push("/painel/animais");
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao salvar animal:", err);
      setMessage({ type: "error", text: err.message || "Erro ao tentar salvar o animal." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className={panelStyles.pageTitle}>Compartilhe a história de um animal que procura um lar</h1>
      <p className={panelStyles.pageDescription}>Escreva sobre o amigo resgatado. Conte sua história para aproximá-lo de quem deseja acolher.</p>

      {message && (
        <div className={`${panelStyles.message} ${message.type === "success" ? panelStyles.success : panelStyles.error}`}>
          {message.text}
        </div>
      )}

      <div className={panelStyles.card}>
        <form className={panelStyles.form} onSubmit={handleSavePet}>
          
          {/* Seção de Fotos com Upload Comprimido */}
          <div className={panelStyles.formGroup}>
            <label className={panelStyles.label}>Fotos do Animal (Mínimo 1, Máximo 5) *</label>
            <div className={styles.uploadSection} onClick={() => document.getElementById("pet-images")?.click()}>
              <p style={{ fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "4px" }}>Clique para selecionar ou arraste as fotos</p>
              <p style={{ fontSize: "13px", color: "#666" }}>As imagens serão comprimidas automaticamente no seu navegador.</p>
              <input
                id="pet-images"
                type="file"
                multiple
                accept="image/*"
                className={styles.fileInput}
                onChange={handleSelectImages}
                disabled={saving || uploadingImages}
              />
            </div>

            {imagePreviews.length > 0 && (
              <div className={styles.previewGrid}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={styles.previewContainer}>
                    <img src={preview} alt={`Preview ${index + 1}`} className={styles.previewImg} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className={styles.removeImgBtn}
                      disabled={saving || uploadingImages}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={panelStyles.formGrid}>
            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="name">Nome do Pet *</label>
              <input
                id="name"
                type="text"
                className={panelStyles.input}
                placeholder="Ex: Floquinho"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving || uploadingImages}
              />
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="species">Espécie *</label>
              <select
                id="species"
                className={panelStyles.select}
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                required
                disabled={saving || uploadingImages}
              >
                <option value="Cachorro">Cachorro</option>
                <option value="Gato">Gato</option>
              </select>
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="sex">Sexo *</label>
              <select
                id="sex"
                className={panelStyles.select}
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                required
                disabled={saving || uploadingImages}
              >
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </select>
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="age">Idade Aproximada *</label>
              <input
                id="age"
                type="text"
                className={panelStyles.input}
                placeholder="Ex: 6 meses, 2 anos"
                value={approximateAge}
                onChange={(e) => setApproximateAge(e.target.value)}
                required
                disabled={saving || uploadingImages}
              />
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="size">Porte *</label>
              <select
                id="size"
                className={panelStyles.select}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                required
                disabled={saving || uploadingImages}
              >
                <option value="Pequeno">Pequeno</option>
                <option value="Médio">Médio</option>
                <option value="Grande">Grande</option>
              </select>
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="neighborhood">Cidade de Localização *</label>
              <select
                id="neighborhood"
                className={panelStyles.select}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                required
                disabled={saving || uploadingImages}
              >
                <option value="">Selecione a cidade...</option>
                {CIDADES_MARANHAO.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className={panelStyles.formGroup}>
              <label className={panelStyles.label} htmlFor="priority">Prioridade de Adoção *</label>
              <select
                id="priority"
                className={panelStyles.select}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
                disabled={saving || uploadingImages}
              >
                <option value="Normal">Normal</option>
                <option value="Destaque">Destaque</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>

            <div className={`${panelStyles.formGroup} ${panelStyles.formGroupFull}`}>
              <label className={panelStyles.label} htmlFor="storytelling">História & Temperamento *</label>
              <textarea
                id="storytelling"
                className={panelStyles.textarea}
                placeholder="Conte de onde ele foi resgatado, como se comporta, nível de energia..."
                value={storytelling}
                onChange={(e) => setStorytelling(e.target.value)}
                required
                disabled={saving || uploadingImages}
              />
            </div>

            {/* Checkboxes de Saúde/Médicos */}
            <div className={`${panelStyles.formGroup} ${panelStyles.formGroupFull}`}>
              <label className={panelStyles.label}>Informações Médicas / Cuidados</label>
              <div className={styles.tagGrid}>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isCastrated}
                    onChange={(e) => setIsCastrated(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Castrado
                </label>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isVaccinated}
                    onChange={(e) => setIsVaccinated(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Vacinado
                </label>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isDewormed}
                    onChange={(e) => setIsDewormed(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Vermifugado
                </label>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isSpecialCare}
                    onChange={(e) => setIsSpecialCare(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Necessita Cuidados Especiais
                </label>
              </div>
            </div>

            {/* Matriz de Compatibilidade */}
            <div className={`${panelStyles.formGroup} ${panelStyles.formGroupFull}`}>
              <label className={panelStyles.label}>Compatível com:</label>
              <div className={styles.tagGrid}>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={compWithDogs}
                    onChange={(e) => setCompWithDogs(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Outros cães
                </label>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={compWithCats}
                    onChange={(e) => setCompWithCats(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Outros gatos
                </label>
                <label className={styles.tagLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={compWithChildren}
                    onChange={(e) => setCompWithChildren(e.target.checked)}
                    disabled={saving || uploadingImages}
                  />
                  Crianças
                </label>
              </div>
            </div>

            {/* Tags de Personalidade */}
            <div className={`${panelStyles.formGroup} ${panelStyles.formGroupFull}`}>
              <label className={panelStyles.label}>Tags de Personalidade (Dicionário Estático)</label>
              <div className={styles.tagGrid}>
                {PERSONALITY_TAGS.map((tag) => (
                  <label key={tag} className={styles.tagLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                      disabled={saving || uploadingImages}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={panelStyles.buttonGroup}>
            <button
              type="submit"
              className={panelStyles.saveButton}
              disabled={saving || uploadingImages}
            >
              {saving ? "Salvando..." : uploadingImages ? "Subindo Imagens..." : "Compartilhar História"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
