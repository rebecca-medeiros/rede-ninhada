"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import styles from "./painel.module.css";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      // 1. Busca sessão do usuário logado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Busca dados cadastrais da organização para monitorar aprovação
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setOrg(data);
      }

      setLoading(false);
    }

    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "var(--background)",
        }}
      >
        <p style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>Carregando painel...</p>
      </div>
    );
  }

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
            <Logo size={24} colorMode="dark" />
          </div>
          <nav className={styles.nav}>
            <Link
              href="/painel"
              className={`${styles.navLink} ${isLinkActive("/painel") ? styles.activeNavLink : ""}`}
            >
              ✏️ Perfil da Iniciativa
            </Link>
            
            <Link
              href="/painel/animais"
              className={`${styles.navLink} ${
                isLinkActive("/painel/animais") || pathname.startsWith("/painel/animais/")
                  ? styles.activeNavLink
                  : ""
              }`}
            >
              🐾 Histórias que Compartilho
            </Link>
            
            <Link
              href="/painel/necessidades"
              className={`${styles.navLink} ${
                isLinkActive("/painel/necessidades") || pathname.startsWith("/painel/necessidades/")
                  ? styles.activeNavLink
                  : ""
              }`}
            >
              ❤️ Necessidades de Apoio
            </Link>

            <Link
              href="/painel/leads"
              className={`${styles.navLink} ${isLinkActive("/painel/leads") ? styles.activeNavLink : ""}`}
            >
              📨 Pedidos de Adoção
            </Link>

            {org?.role === "admin" && (
              <Link
                href="/painel/moderacao"
                className={`${styles.navLink} ${
                  isLinkActive("/painel/moderacao") || pathname.startsWith("/painel/moderacao/")
                    ? styles.activeNavLink
                    : ""
                }`}
              >
                🛡️ Moderação de ONGs
              </Link>
            )}
          </nav>
        </div>

        <button onClick={handleLogout} className={styles.logoutButton}>
          🚪 Sair do Painel
        </button>
      </aside>

      <main className={styles.main}>
        {org?.approval_status === "pending" && (
          <div className={`${styles.headerBanner} ${styles.bannerPending}`}>
            ⚠️ Sua conta está aguardando aprovação da moderação. Seus animais e necessidades ainda não aparecem nas buscas públicas.
          </div>
        )}
        {org?.approval_status === "rejected" && (
          <div className={`${styles.headerBanner} ${styles.bannerRejected}`}>
            ❌ Seu perfil foi recusado na moderação. Por favor, entre em contato para esclarecimentos.
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
