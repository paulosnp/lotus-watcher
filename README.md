<div align="center">
  <h1>🌸 LOTUS WATCHER</h1>
  <h3>Monitoramento de Mercado para Magic: The Gathering</h3>

  <p>
    <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java" alt="Java 21">
    <img src="https://img.shields.io/badge/Spring%20Boot-3.2.2-brightgreen?style=for-the-badge&logo=spring" alt="Spring Boot">
    <img src="https://img.shields.io/badge/Angular-18-red?style=for-the-badge&logo=angular" alt="Angular">
    <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql" alt="Database">
    <img src="https://img.shields.io/badge/i18n-PT%2FEN-purple?style=for-the-badge&logo=google-translate" alt="i18n">
  </p>

  <p>Uma aplicação Full Stack robusta para acompanhar a flutuação de preços de cartas TCG em tempo real, fornecendo análises de tendências, histórico gráfico e integração com marketplaces.</p>

  <p>
    <a href="#-funcionalidades-principais">Funcionalidades</a> •
    <a href="#-como-rodar-o-projeto-localmente">Como Rodar</a> •
    <a href="#-arquitetura-e-decisões-técnicas">Arquitetura</a> •
    <a href="#-documentação-da-api">API Docs</a>
  </p>
</div>

---

## 📖 Sobre o Projeto

O **Lotus Watcher** nasceu da necessidade de centralizar e historicizar informações financeiras sobre cartas de *Magic: The Gathering*. Diferente de buscadores comuns que mostram apenas o preço "do momento", este projeto foca na **evolução do valor** ao longo do tempo.

O sistema consome dados da API global **Scryfall**, armazena o histórico de preços em um banco de dados relacional (PostgreSQL) e utiliza algoritmos para identificar oportunidades de compra (Bull Market) ou venda (Bear Market).

Agora conta com um sistema completo de **Autenticação**, **Painel Administrativo** e **Internacionalização (PT/EN)**.

---

## ✨ Funcionalidades Principais

### 🔒 Autenticação & Segurança
* **JWT (JSON Web Token):** Sistema seguro de login e registro.
* **Verificação de Email:** Código de 6 dígitos enviado por email para ativar a conta (via Spring Mail).
* **Guards de Rota:** Proteção no frontend para impedir acesso não autorizado a páginas de Admin ou Perfil.

### 🌍 Internacionalização
* **Suporte Bilíngue:** Tradução completa para Português (PT) e Inglês (EN).
* **Autodetecção:** O sistema identifica o idioma do navegador do usuário na primeira visita.
* **Persistência:** Lembra a preferência do usuário entre sessões.

### 🛡️ Painel Administrativo
* **Gestão de Usuários:** Listagem completa, com opções de Banir/Desbanir e Promover/Rebaixar usuários.
* **Sincronização em Massa:** Dispara atualização de preços de *todas* as cartas no banco via Scryfall.
* **Monitoramento:** Visão geral de cartas cadastradas e estatísticas do sistema.

### 👤 Perfil & Personalização
* **Avatar Customizável:** Upload de imagem de perfil com pré-visualização.
* **Dados Pessoais:** Edição de Nickname e alteração segura de senha.
* **Watchlist Avançada:** 
    * **Bulk Import:** Importe listas inteiras de cartas (formato texto) de uma vez.
    * **Troca de Versão:** Altere a edição (print) da carta diretamente na sua lista, com seletor visual.
    * **Notificações:** Alertas visuais e por email sobre variações de preço.

### Core (Mercado)
* **🔍 Busca Inteligente & Cache:** "Fetch-and-Save" automático do Scryfall.
* **📈 Algo Trading:** Rankings de **Top Risers** e **Top Fallers** em tempo real.
* **📊 Gráficos Interativos:** Histórico de preços com Chart.js.
* **📱 Design Responsivo:** Interface otimizada para Mobile (Menu Hambúrguer, tabelas adaptáveis).

---

## 🛠️ Tecnologias Utilizadas

### Backend (API RESTful)
* **Java 21** & **Spring Boot 3+**: Núcleo da aplicação.
* **Spring Security + JWT**: Autenticação Stateless.
* **Spring Data JPA**: Persistência.
* **JavaMailSender**: Envio de emails transacionais.
* **PostgreSQL**: Banco de dados relacional.
* **Maven**: Gerenciamento de dependências.

### Frontend (SPA)
* **Angular 18+**: Standalone Components (sem NgModules).
* **TypeScript**: Tipagem estática.
* **Angular Material**: UI Kit moderno.
* **Chart.js**: Visualização de dados.
* **SCSS**: Estilização profissional.

---

## 🏗️ Arquitetura e Decisões Técnicas

### 1. Modelo de Dados (Backend)
As tabelas foram renomeadas explicitamente para evitar conflitos de palavras reservadas:
* `tb_cards`: Tabela principal das cartas.
* `tb_users`: Tabela de usuários (com roles e status).
* `tb_price_history`: Histórico de preços (One-to-Many).
* `tb_watchlist_item`: Relacionamento User-Card com metadados (alvos de preço).
* `tb_notifications`: Sistema de alertas persistentes.

### 2. Fluxo de Autenticação
1. Usuário se registra -> Status `DISABLED`.
2. Email com código é enviado.
3. Usuário insere código -> Status `ACTIVE`.
4. Login gera JWT válido por prazo determinado.

### 3. Integração Scryfall (Fetch-and-Save)
Ao buscar uma carta nova na API externa:
1.  Busca no Scryfall.
2.  Salva a entidade `Card` imediatamente.
3.  Adiciona o primeiro registro de histórico para evitar incoerência de dados.

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
* **Java JDK 21**
* **Node.js** (v18+) e **NPM**
* **PostgreSQL** rodando (com banco `lotus` criado)

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/paulosnp/lotus-watcher
cd lotus-watcher
```

### Passo 2: Executar o Backend
Configure o `application.properties` com suas credenciais de banco e email (para testes de auth).
```bash
cd backend
mvn spring-boot:run
```

### Passo 3: Executar o Frontend
Em um **novo terminal**:
```bash
cd frontend
npm install
ng serve
```
*Acesse a aplicação em `http://localhost:4200`*

---

## 🔌 Documentação da API

Principais endpoints do sistema:

### 🔐 Autenticação (`AuthController`)
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registro de novos usuários. |
| `POST` | `/api/auth/login` | Login (Retorna JWT). |
| `POST` | `/api/auth/verify-email` | Validação do código de 6 dígitos. |

### 🃏 Cartas & Mercado (`CardController`)
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/cards/search` | Busca inteligente (DB/Scryfall). |
| `GET` | `/api/cards/market` | Retorna Top Risers e Fallers. |
| `GET` | `/api/cards/{id}` | Detalhes da carta. |
| `GET` | `/api/cards/{id}/history` | Histórico de preços para gráficos. |

### 🔖 Watchlist (`WatchlistController`)
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/watchlist` | Retorna lista do usuário logado. |
| `POST` | `/api/watchlist/add` | Adiciona carta à lista. |
| `POST` | `/api/watchlist/import` | Importação em massa (texto). |

### 🛡️ Admin (`AdminController`)
| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Lista todos os usuários. |
| `POST` | `/api/admin/sync-scryfall` | Força atualização de preços global. |
| `POST` | `/api/admin/users/{id}/ban` | Banir usuário. |

---

<div align="center">
  <small>Desenvolvido por <a href="https://github.com/paulosnp">Paulo Cardoso</a> • 2026</small>
</div>
