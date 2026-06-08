"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";
import styles from "./login.module.css";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email || !password) {
      setMessage({ type: "error", text: "Por favor, preencha todos os campos." });
      setLoading(false);
      return;
    }

    try {
      // 1. Autenticar no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Verificar status do perfil na tabela public.organizations
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("approval_status")
        .eq("id", data.user.id)
        .single();

      if (orgError) {
        // Se a conta auth existe mas não tem perfil correspondente, podemos direcionar para criar ou reportar
        console.error("Erro ao buscar perfil:", orgError);
        // Deixa prosseguir para o painel, lá tratamos a falta de perfil
      }

      setMessage({ type: "success", text: "Login realizado com sucesso! Redirecionando..." });

      // Redireciona para o painel de controle da ONG
      router.push("/painel");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setMessage({
        type: "error",
        text: err.message || "E-mail ou senha incorretos.",
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
          <p className={styles.subtitle}>Painel administrativo para ONGs e Protetores</p>
        </div>

        {message && (
          <div className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
            {message.text}
          </div>
        )}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="contato@ong.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Acessar Painel"}
          </button>
        </form>

        <p className={styles.footerText}>
          Ainda não é cadastrado?{" "}
          <Link href="/cadastro" className={styles.link}>
            Cadastre sua ONG
          </Link>
        </p>
      </div>
    </main>
  );
}
