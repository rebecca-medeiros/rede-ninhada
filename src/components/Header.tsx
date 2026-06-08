import Link from "next/link";
import Logo from "./Logo";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.navbar}>
      <Link href="/" className={styles.logo}>
        <Logo size={28} />
      </Link>
      <nav className={styles.navLinks}>
        <Link href="/animais" className={styles.navLink}>
          Encontrar um amigo pet
        </Link>
        <Link href="/ajuda" className={styles.navLink}>
          Quero Ajudar
        </Link>
        <Link href="/login" className={styles.navLink}>
          Painel ONG
        </Link>
        <Link href="/animais" className={`${styles.navLink} ${styles.btnNavCta}`}>
          Adoção Responsável
        </Link>
      </nav>
    </header>
  );
}
