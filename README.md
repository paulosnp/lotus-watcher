<div align="center">
  <h1>🌸 LOTUS WATCHER</h1>
  <h3>Monitoramento de Mercado para Magic: The Gathering</h3>

  <p>
    <img src="https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=java" alt="Java 17">
    <img src="https://img.shields.io/badge/Spring%20Boot-3.0-brightgreen?style=for-the-badge&logo=spring" alt="Spring Boot">
    <img src="https://img.shields.io/badge/Angular-17-red?style=for-the-badge&logo=angular" alt="Angular">
    <img src="https://img.shields.io/badge/PostgreSQL-H2-blue?style=for-the-badge&logo=postgresql" alt="Database">
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

O sistema consome dados da API global **Scryfall**, armazena o histórico de preços em um banco de dados relacional e utiliza algoritmos para identificar oportunidades de compra (Bull Market) ou venda (Bear Market), servindo como uma ferramenta analítica para colecionadores e investidores.

---

## ✨ Funcionalidades Principais

* **🔍 Busca Inteligente & Cache:** Integração com a API do Scryfall. O sistema prioriza a busca local para performance e, se não encontrar, busca na API externa e salva automaticamente os dados para consultas futuras.
* **📈 Dashboard de Mercado (Algo Trading):** Algoritmo matemático implementado com `Java Streams` que calcula a variação percentual exata (Preço Atual vs. Preço Histórico) para gerar os rankings de **Top Risers** (Maiores Altas) e **Top Fallers** (Maiores Quedas) em tempo real.
* **📊 Gráficos Interativos:** Visualização da evolução de preços utilizando **Chart.js**, permitindo análise temporal da volatilidade da carta.
* **🛒 Integração com E-commerce:** Botão inteligente que gera links diretos para a **LigaMagic** (maior marketplace do Brasil) baseado no nome exato da carta, facilitando a aquisição.
* **🔄 Multiversos (Prints):** Sistema capaz de buscar e listar todas as impressões/versões alternativas de uma mesma carta.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API RESTful)
* **Java 17** & **Spring Boot 3**: Núcleo da aplicação.
* **Spring Data JPA (Hibernate)**: Camada de persistência e ORM.
* **H2 Database / PostgreSQL**: Banco de dados (H2 para dev/testes, pronto para PostgreSQL em produção).
* **Jackson Library**: Processamento avançado de JSON para lidar com a estrutura complexa da API do Scryfall.
* **Maven**: Gerenciamento de dependências e build.

### Frontend (SPA)
* **Angular 17**: Framework moderno utilizando a nova arquitetura de **Standalone Components**.
* **TypeScript**: Para garantir tipagem forte e reduzir erros em tempo de execução.
* **Angular Material**: Biblioteca de UI para componentes visuais (Cards, Inputs, Botões).
* **Chart.js & ng2-charts**: Renderização de gráficos financeiros de alto desempenho no Canvas HTML5.
* **SCSS**: Estilização modular e responsiva.

---

## 🏗️ Arquitetura e Decisões Técnicas

### 1. Campo Calculado `@Transient`
Para evitar redundância e economizar espaço em disco, o cálculo de variação percentual (`priceChangePercentage`) **não é salvo no banco**. Ele é calculado em memória (Runtime) sempre que o Dashboard é solicitado.
```java
@Transient
private Double priceChangePercentage; // Calculado on-the-fly pela API
```

### 2. Estratégia de "Fetch-and-Save"
O serviço implementa um padrão de cache inteligente:
1. Usuário busca "Sol Ring".
2. API verifica o Banco de Dados Local.
3. Se não existe, vai ao Scryfall, baixa os dados, cria o registro inicial de histórico e salva.
4. Próximas buscas são instantâneas (0ms de latência de rede externa).

### 3. Blindagem do Frontend
Uso de `ChangeDetectorRef` e tratamento de erros assíncronos no Angular para garantir que a interface não trave mesmo se a API externa demorar a responder.

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
* **Java JDK 17** ou superior.
* **Node.js** (v18+) e **NPM**.
* **Maven** instalado (ou use o wrapper `mvnw` incluso).

### Passo 1: Clonar o Repositório
```bash
git clone [https://github.com/paulosnp/lotus-watcher](https://github.com/paulosnp/lotus-watcher)
cd lotus-watcher
```

### Passo 2: Executar o Backend
Vá até a pasta do servidor e inicie o Spring Boot:
```bash
cd backend
mvn spring-boot:run
```
*O servidor iniciará na porta `8080`. O Banco de Dados será criado automaticamente.*

### Passo 3: Executar o Frontend
Em um **novo terminal**, vá até a pasta da interface:
```bash
cd frontend
npm install
ng serve
```
*Acesse a aplicação em `http://localhost:4200`*

---

## 🔌 Documentação da API

Principais endpoints disponíveis para consumo:

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/cards/search?name={nome}` | Busca uma carta. Se não existir no BD, busca no Scryfall e salva. |
| `GET` | `/api/cards/market` | Retorna o JSON com as listas de "Maiores Altas" e "Maiores Baixas". |
| `GET` | `/api/cards/{id}` | Retorna os detalhes completos de uma carta específica pelo ID. |
| `GET` | `/api/cards/{id}/history` | Retorna a lista de histórico de preços para plotar o gráfico. |
| `GET` | `/api/cards/prints/{name}` | Busca outras versões/artes da mesma carta. |

---

## 🔮 Melhorias Futuras (Roadmap)

* [ ] **Job de Atualização Automática:** Criar um `@Scheduled` no Spring para atualizar os preços de todas as cartas do banco toda madrugada.
* [ ] **Spring Security:** Adicionar login para usuários salvarem suas "Wishlists".
* [ ] **Docker Compose:** Criar um arquivo para subir Banco + Back + Front com um único comando.

---

<div align="center">
  <small>Desenvolvido por <a href="https://github.com/paulosnp">Paulo Cardoso</a> • 2026</small>
</div>