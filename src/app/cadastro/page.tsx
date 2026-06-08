"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CIDADES_MARANHAO } from "@/utils/constants";
import Logo from "@/components/Logo";
import styles from "./cadastro.module.css";

export default function Cadastro() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validações básicas
    if (!name || !neighborhood || !whatsapp || !email || !password) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos obrigatórios." });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "A senha deve ter no mínimo 6 caracteres." });
      setLoading(false);
      return;
    }

    try {
      // 1. Registrar no Supabase Auth passando metadados adicionais
      // O trigger do banco (trg_on_auth_user_created) lerá estes dados e criará
      // o perfil correspondente na tabela pública com bypass de RLS de forma segura.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            neighborhood,
            phone_whatsapp: whatsapp,
          },
        },
      });

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        throw new Error("Erro inesperado: Usuário não pôde ser criado.");
      }

      setMessage({
        type: "success",
        text: "Cadastro realizado com sucesso! Sua conta está aguardando aprovação administrativa. Você será redirecionado para a tela de login.",
      });

      // Limpa formulário
      setName("");
      setNeighborhood("");
      setWhatsapp("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redireciona após 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3500);
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setMessage({
        type: "error",
        text: err.message || "Ocorreu um erro ao tentar realizar o cadastro.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <Logo size={40} />
          </div>
          <h1 className={styles.title}>Rede Ninhada</h1>
          <p className={styles.subtitle}>Crie o perfil da sua ONG ou iniciativa de proteção</p>
        </div>

        {message && (
          <div className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
            {message.text}
          </div>
        )}

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="name">Nome da ONG / Protetor *</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              placeholder="Ex: Anjos de Patas SLZ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="neighborhood">Cidade de Atuação (Maranhão) *</label>
            <select
              id="neighborhood"
              className={styles.select}
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Selecione uma cidade...</option>
              {CIDADES_MARANHAO.map((bairro) => (
                <option key={bairro} value={bairro}>
                  {bairro}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="whatsapp">WhatsApp de Contato (DDD + Número) *</label>
            <input
              id="whatsapp"
              type="tel"
              className={styles.input}
              placeholder="Ex: 98991234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">E-mail de Login *</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="Ex: contato@ong.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Senha *</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Mínimo de 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="confirm-password">Confirmar Senha *</label>
            <input
              id="confirm-password"
              type="password"
              className={styles.input}
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Cadastrando..." : "Criar Cadastro"}
          </button>
        </form>

        <p className={styles.footerText}>
          Já possui cadastro?{" "}
          <Link href="/login" className={styles.link}>
            Fazer Login
          </Link>
        </p>
      </div>
    </main>
  );
}
