import Link from "next/link";
import Logo from "./Logo";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div>
          <Link href="/" className={styles.footerLogo}>
            <Logo size={28} colorMode="dark" />
          </Link>
          <p className={styles.footerDesc} style={{ marginTop: "12px" }}>
            Uma iniciativa para unificar a causa animal e construir pontes sólidas de solidariedade no Maranhão.
          </p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/animais" className={styles.footerLink}>
            Encontrar um amigo pet
          </Link>
          <Link href="/ajuda" className={styles.footerLink}>
            Quero Ajudar
          </Link>
          <Link href="/faq" className={styles.footerLink}>
            Perguntas Frequentes (FAQ)
          </Link>
          <Link href="/login" className={styles.footerLink}>
            Entrar como ONG
          </Link>
        </div>
      </div>
      <p className={styles.copyright}>
        © {new Date().getFullYear()} Rede Ninhada. Desenvolvido com carinho para a comunidade protetora do Maranhão.
      </p>
    </footer>
  );
}
