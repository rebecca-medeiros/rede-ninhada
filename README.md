# 🐾 Rede Ninhada — Conectando amor, acolhendo vidas

A **Rede Ninhada** é uma plataforma web desenvolvida para unificar e fortalecer a causa animal no estado do Maranhão. O projeto funciona como uma ponte inteligente ligando ONGs, protetores independentes, voluntários e adotantes, reduzindo a fragmentação da causa e agilizando o acolhimento de animais resgatados.

---

> [!IMPORTANT]
> **Status do Projeto:** 🚧 Este é um projeto autoral e privado em andamento, idealizado e desenvolvido de forma individual por mim (**Rebecca Medeiros**). O código e a marca são de uso pessoal e proprietário.

---

## 🎨 Funcionalidades do MVP

### 1. Área Pública
*   **Landing Page de Impacto:** Exibição dinâmica de métricas de impacto calculadas automaticamente (vidas acolhidas, necessidades atendidas, iniciativas homologadas) e seção de Dúvidas Frequentes (FAQ).
*   **Galeria de Adoção:** Catálogo de pets filtrável por espécie e cidades do Maranhão, exibindo o tempo de espera real de cada animal.
*   **Compartilhamento Otimizado (SSR):** Integração de Server-Side Rendering nas páginas de detalhe do pet para geração dinâmica de metatags Open Graph (título, descrição e foto do pet no card de visualização ao compartilhar links em redes sociais ou WhatsApp).
*   **Triagem e Contato Direto:** Formulário de manifestação de interesse que armazena os dados do adotante no banco e redireciona o usuário para o WhatsApp da ONG correspondente com uma mensagem de apresentação pré-formatada.
*   **Portal "Como Ajudar":** Centralizador de necessidades urgentes (Ração, Medicamentos, Lar Temporário), exibindo as chaves Pix das ONGs e links de contato rápido.

### 2. Painel das ONGs & Protetores (Área Restrita)
*   **Gestão de Perfil:** Atualização de logotipo, biografia, contatos de rede social e chaves de pagamento (Pix).
*   **Histórias Compartilhadas (Pets):** Gerenciamento completo das fichas dos animais (com compressão automática de imagem client-side), status de adoção (Disponível, Reservado, Adotado) e tags comportamentais.
*   **Necessidades de Apoio:** Publicação, atualização e encerramento de campanhas de suprimentos.
*   **Pedidos de Adoção:** Visualização centralizada dos contatos de pessoas interessadas nos pets, facilitando o acompanhamento da triagem.

### 3. Painel Administrativo de Moderação (ACL)
*   **Fila de Homologação:** Rota e menu de acesso restritos a administradores da rede para aprovar, suspender ou recusar novos cadastros de ONGs, garantindo a idoneidade e segurança da rede.

---

## 🛠️ Stack Tecnológica

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
*   **Estilização:** Vanilla CSS customizado (Design System responsivo estruturado via variáveis de CSS globais)
*   **Backend & Infraestrutura:** [Supabase](https://supabase.com/) (Auth, PostgreSQL relacional, Row Level Security para proteção de dados sensíveis, Storage público para fotos de pets/logos e Triggers executados em PL/pgSQL).

---

## 🚀 Execução em Ambiente Local

### Pré-requisitos
*   Node.js instalado (v18 ou superior)

### 1. Instalar as Dependências
Na pasta raiz do projeto, instale os pacotes necessários:
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Certifique-se de que o arquivo `.env.local` está configurado na raiz com as chaves corretas do projeto no Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=seu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador para ver a plataforma rodando localmente.