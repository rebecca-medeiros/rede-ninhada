"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./faq.module.css";

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<"adopter" | "ong">("adopter");

  const adopterFaq = [
    {
      q: "Como funciona o processo de adoção na Rede Ninhada?",
      a: "A Rede Ninhada atua como uma ponte de conexão local. Ao navegar pela nossa galeria e escolher um pet, você poderá clicar em 'Quero Adotar' e preencher um formulário rápido com seus contatos. Em seguida, a plataforma redirecionará você para uma conversa no WhatsApp da ONG ou protetor responsável, já com a sua mensagem de apresentação montada. A triagem, entrevista e os termos de adoção são combinados diretamente com eles."
    },
    {
      q: "A Rede Ninhada cobra alguma taxa para adoção?",
      a: "Não. A Rede Ninhada é uma plataforma 100% gratuita e de impacto social, mantida de forma voluntária. Não cobramos taxas para adoção de animais nem pelo cadastro das organizações."
    },
    {
      q: "Como posso ter certeza de que minha doação Pix foi recebida?",
      a: "As doações de suprimentos e financeiras são feitas de forma direta na conta bancária da própria ONG, sem intermediação ou retenção de valores por parte da Rede Ninhada. A chave Pix e o nome do titular são mostrados diretamente na tela e você transfere pelo aplicativo do seu próprio banco. Recomendamos que envie o comprovante de transferência diretamente pelo WhatsApp da ONG correspondente para confirmação."
    },
    {
      q: "Quero ajudar temporariamente. O que é um Lar Temporário (LT)?",
      a: "O Lar Temporário consiste em acolher provisoriamente em sua residência um animal resgatado que está em tratamento, recuperando-se de cirurgias ou simplesmente aguardando uma adoção definitiva quando a ONG não possui vagas em seu abrigo. ONGs parceiras costumam fornecer a ração e o suporte veterinário durante esse período. É uma ajuda de valor imensurável para salvar vidas!"
    },
    {
      q: "Posso cadastrar um animal de rua que eu resgatei?",
      a: "No momento, as publicações de animais na galeria são exclusivas para ONGs e Protetores Independentes cadastrados e homologados na moderação da Rede Ninhada. Caso você tenha resgatado um animal, recomendamos entrar em contato com as iniciativas cadastradas listadas no site para buscar apoio na divulgação."
    }
  ];

  const ongFaq = [
    {
      q: "Como faço para cadastrar meu grupo de proteção ou ONG?",
      a: "Acesse a opção 'Painel ONG' no menu superior ou vá diretamente até a página de Cadastro (/cadastro) e preencha as informações básicas do seu projeto (Nome, WhatsApp, Bairro de atuação, etc.). Para garantir a segurança dos doadores e adotantes, sua conta passará por uma rápida moderação humana antes de ser homologada e ativada."
    },
    {
      q: "Por que meus animais e necessidades não aparecem nas buscas públicas?",
      a: "Caso sua iniciativa seja nova, seu perfil provavelmente ainda está no status de moderação 'pendente'. Enquanto sua conta não for aprovada por nossa equipe administrativa, seus animais e necessidades cadastrados só estarão visíveis para você no seu Painel, aparecendo um banner de aviso no topo da sua tela."
    },
    {
      q: "Como funciona a compressão de imagens de pets no painel?",
      a: "Desenvolvemos um sistema inteligente de compressão client-side. Ao fazer o upload da foto do animal no painel, a imagem (mesmo que tenha 10MB tirada de um celular moderno) é compactada no próprio navegador para menos de 200KB mantendo a qualidade. Isso economiza o armazenamento gratuito de infraestrutura e acelera drasticamente seus uploads no painel."
    },
    {
      q: "O que são os badges dinâmicos (Urgente, Espera Longa e Especial)?",
      a: "São selos visuais automáticos para direcionar a atenção do adotante:\n\n• Urgente: Definido pela própria ONG no painel para casos de risco ou superlotação.\n• Especial: Exibido para pets que requerem tratamentos de saúde contínuos ou portadores de deficiências.\n• Espera Longa: Adicionado automaticamente pelo sistema quando o animal está listado para adoção há mais de 3 meses."
    },
    {
      q: "O que acontece quando um adotante envia interesse pelo animal?",
      a: "Os dados do interessado (Nome, Telefone, Bairro e Apresentação) são salvos de forma segura no banco de dados e ficam listados na sua aba 'Leads Recebidos' no Painel. O adotante é imediatamente direcionado para o seu WhatsApp com a mensagem pronta, bastando você dar sequência na sua triagem padrão de adoção responsável."
    }
  ];

  const currentFaq = activeTab === "adopter" ? adopterFaq : ongFaq;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Perguntas Frequentes (FAQ)</h1>
          <p className={styles.subtitle}>
            Tire suas principais dúvidas sobre o funcionamento da plataforma Rede Ninhada, doações e processos de adoção.
          </p>
        </header>

        {/* Abas */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${activeTab === "adopter" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("adopter")}
          >
            🐾 Adotantes & Ajudantes
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "ong" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("ong")}
          >
            🤝 ONGs & Protetores
          </button>
        </div>

        {/* Acordeões com detalhes/summary */}
        <section className={styles.faqList}>
          {currentFaq.map((item, index) => (
            <details key={index} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>{item.q}</summary>
              <p className={styles.faqAnswer} style={{ whiteSpace: "pre-line" }}>{item.a}</p>
            </details>
          ))}
        </section>

        {/* Call to Action */}
        <div className={styles.ctaCard}>
          <h3 className={styles.ctaTitle}>Ainda ficou com alguma dúvida?</h3>
          <p className={styles.ctaText}>
            Se você encontrou alguma inconsistência ou precisa de suporte adicional, entre em contato direto com a Rede Ninhada.
          </p>
          <a
            href="https://wa.me/5598999999999?text=Olá! Estou usando a Rede Ninhada e gostaria de tirar uma dúvida."
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            💬 Falar Conosco no WhatsApp
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
}
