<div align="center">
  <h1>🌸 LOTUS WATCHER</h1>
  <h3>Monitoramento de Mercado para Magic: The Gathering</h3>

  <p>
    <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java" alt="Java 21">
    <img src="https://img.shields.io/badge/Spring%20Boot-4.0.2-brightgreen?style=for-the-badge&logo=spring" alt="Spring Boot">
    <img src="https://img.shields.io/badge/Angular-21-red?style=for-the-badge&logo=angular" alt="Angular">
    <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql" alt="Database">
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

---

## ✨ Funcionalidades Principais

* **🔍 Busca Inteligente & Cache:** Integração com Scryfall. O sistema prioriza a busca local (DB) para performance; se não encontrar, busca na API externa e salva automaticamente ("Fetch-and-Save").
* **📈 Dashboard de Mercado (Algo Trading):** Algoritmo implementado com `Java Streams` que calcula a variação percentual exata (Preço Atual vs. Preço Histórico) para gerar rankings de **Top Risers** e **Top Fallers**.
* **📊 Gráficos Interativos:** Visualização da evolução de preços utilizando **Chart.js**, permitindo análise temporal da volatilidade.
* **🛒 Integração com E-commerce:** Botão inteligente que gera links diretos para a **LigaMagic** baseado no nome exato da carta.
* **🔄 Multiversos (Prints):** Sistema capaz de buscar e listar todas as impressões/versões alternativas de uma mesma carta.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API RESTful)
* **Java 21** & **Spring Boot 4.0.2**: Núcleo da aplicação.
* **Spring Data JPA (Hibernate)**: Persistência e ORM.
* **PostgreSQL**: Banco de dados principal relacional.
* **Jackson Library**: Processamento de JSON da API Scryfall.
* **Maven**: Gerenciamento de build.

### Frontend (SPA)
* **Angular 21**: Framework utilizando arquitetura de **Standalone Components**.
* **TypeScript**: Tipagem estática forte.
* **Angular Material**: Biblioteca de UI (Cards, Inputs, Botões).
* **Chart.js & ng2-charts**: Renderização de gráficos financeiros.
* **SCSS**: Estilização modular.

---

## 🏗️ Arquitetura e Decisões Técnicas

O projeto segue uma estrutura de **Monorepo** (`/backend` e `/frontend` no mesmo repositório).

### 1. Modelo de Dados (Backend)
As tabelas foram renomeadas explicitamente para evitar conflitos de palavras reservadas:
* `tb_cards`: Tabela principal das cartas.
* `tb_price_history`: Tabela com o histórico de preços (Relacionamento One-to-Many).

```java
@Entity @Table(name = "tb_cards")
public class Card { ... }
```

### 2. Campo Calculado (Runtime)
O cálculo de variação percentual (`priceChangePercentage`) **não é persistido**. É um campo `@Transient` calculado em memória pelo Controller ao comparar o `priceUsd` atual com o registro mais antigo do histórico.

### 3. Integridade de Dados (Fetch-and-Save)
Ao buscar uma carta nova na API externa:
1.  Busca no Scryfall.
2.  Salva a entidade `Card` imediatamente com `cardRepository.saveAndFlush(card)`.
3.  Adiciona o primeiro registro de histórico.
4.  Isso previne erros de *Foreign Key Constraint* que ocorreriam se tentássemos salvar o histórico antes do ID da carta existir no banco.

### 4. Frontend Standalone & Performance
*   **Standalone Components:** Não utilizamos `app.module.ts`. Cada componente (Dashboard, CardDetails) importa suas dependências diretamente.
*   **Blindagem:** Implementação de `ChangeDetectorRef` para forçar atualizações de UI em operações assíncronas complexas, evitando que a interface "trave" ou desatualize.

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
Vá até a pasta do servidor:
```bash
cd backend
mvn spring-boot:run
```
*O servidor iniciará na porta `8080`.*
> **Nota:** A aplicação espera um banco PostgreSQL com usuário `postgres` e senha `postgres`. Se sua senha for diferente, defina a variável de ambiente `DB_PASSWORD` ou edite o `application.properties`.

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

Principais endpoints (`CardController`):

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/cards/search?name={nome}` | "Fetch-and-Save": Busca no DB ou no Scryfall. |
| `GET` | `/api/cards/market` | Retorna risers/fallers calculados em memória. |
| `GET` | `/api/cards/{id}` | Detalhes da carta. |
| `GET` | `/api/cards/{id}/history` | Histórico de preços para o gráfico. |
| `GET` | `/api/cards/prints/{name}` | Outras versões (prints) da carta. |

---

<div align="center">
  <small>Desenvolvido por <a href="https://github.com/paulosnp">Paulo Cardoso</a> • 2026</small>
</div>
