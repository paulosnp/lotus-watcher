package com.pricewatcher.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.PriceHistory;
import com.pricewatcher.api.repository.CardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ScryfallService {

    private final CardRepository cardRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ScryfallService(CardRepository cardRepository) {
        this.cardRepository = cardRepository;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    // 🕒 MEGA VERIFICAÇÃO: Todos os dias às 03:00 da manhã (Horário de Brasília)
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 3 * * *", zone = "America/Sao_Paulo")
    public void nightlyMegaSync() {
        System.out.println("🌙 [NightlySync] Iniciando Mega Verificação Noturna...");

        // 1. Importa cartas novas (Bulk)
        importViaBulkData();

        // 2. Atualiza preços das cartas existentes (pode demorar horas)
        // Usamos uma nova thread para não bloquear o Scheduler se syncAllCards não for
        // async
        new Thread(this::syncAllCards).start();
    }

    public Card searchCard(String name) {
        Optional<Card> localCard = cardRepository.findByNameIgnoreCase(name);
        if (localCard.isPresent()) {
            Card existing = localCard.get();
            if (existing.getPriceUsd() != null && existing.getPriceUsd() > 0) {
                return updateCardPrice(existing);
            }
            // Se o preço for zero/nulo, removemos a carta "ruim" do banco e deixamos o
            // código buscar uma nova
            System.out.println("♻️ Carta local '" + name + "' está sem preço ($" + existing.getPriceUsd()
                    + "). Substituindo por melhor versão...");
            cardRepository.delete(existing);
        }

        String encodedName = name.replace(" ", "+");
        String url = "https://api.scryfall.com/cards/named?fuzzy=" + encodedName;

        JsonNode root = fetchJson(url);
        if (root == null)
            return null;

        // SE NÃO TIVER PREÇO, TENTA ACHAR UMA VERSÃO QUE TENHA
        if (!hasValidPrice(root)) {
            System.out.println("⚠️ A versão padrão de " + name + " não tem preço. Buscando alternativas...");
            JsonNode betterVersion = findBestPrint(name);
            if (betterVersion != null) {
                root = betterVersion;
                System.out.println("✅ Versão alternativa encontrada: " + root.get("set_name").asText() + " ($"
                        + root.get("prices").get("usd").asText() + ")");
            }
        }

        return saveCardFromScryfall(root);
    }

    public Card getRandomCard() {
        String url = "https://api.scryfall.com/cards/random?q=lang:en"; // Garante cartas em inglês
        JsonNode root = fetchJson(url);

        if (root != null && hasValidPrice(root)) {
            return saveCardFromScryfall(root);
        } else {
            // Se cair numa carta sem preço (ex: token), tenta de novo (recursivo simples)
            return getRandomCard();
        }
    }

    public JsonNode getSets() {
        // Busca todos os sets
        String url = "https://api.scryfall.com/sets";
        return fetchJson(url);
    }

    public JsonNode searchCards(String query) {
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8);
            String url = "https://api.scryfall.com/cards/search?q=" + encodedQuery;
            return fetchJson(url);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public JsonNode getAutocompleteSuggestions(String query) {
        try {
            // Usamos busca normal com wildcard para 'simular' autocomplete mas trazendo
            // objetos completos (com imagens)
            // auto: prefixo para forçar busca por nome parcial inteligente
            // Construímos a query "bruta" primeiro: name:/^query/
            String rawQuery = "name:/^" + query + "/";

            // Encodamos TUDO para garantir que ^, /, : sejam passados corretamente
            String encodedFullQuery = java.net.URLEncoder.encode(rawQuery, java.nio.charset.StandardCharsets.UTF_8);

            String url = "https://api.scryfall.com/cards/search?q=" + encodedFullQuery
                    + "&unique=cards&order=edhrec&page=1";

            System.out.println(">>> AUTOCOMPLETE URL: " + url); // DEBUG LOG

            JsonNode searchResult = fetchJson(url);

            if (searchResult != null && searchResult.has("data")) {
                com.fasterxml.jackson.databind.node.ArrayNode richSuggestions = (com.fasterxml.jackson.databind.node.ArrayNode) new com.fasterxml.jackson.databind.ObjectMapper()
                        .createArrayNode();

                JsonNode data = searchResult.get("data");
                int count = 0;

                for (JsonNode card : data) {
                    if (count >= 10)
                        break; // Limite de 10 como solicitado

                    com.fasterxml.jackson.databind.node.ObjectNode simpleCard = new com.fasterxml.jackson.databind.ObjectMapper()
                            .createObjectNode();

                    simpleCard.put("name", card.get("name").asText());

                    // Lógica segura para pegar imagem
                    String img = "https://i.imgur.com/LdOBU1I.jpg"; // Fallback
                    if (card.has("image_uris") && card.get("image_uris").has("small")) {
                        img = card.get("image_uris").get("small").asText();
                    } else if (card.has("card_faces") && card.get("card_faces").get(0).has("image_uris")) {
                        img = card.get("card_faces").get(0).get("image_uris").get("small").asText();
                    }
                    simpleCard.put("imageUrl", img);
                    simpleCard.put("id", card.get("id").asText()); // Útil para navegação direta

                    richSuggestions.add(simpleCard);
                    count++;
                }

                com.fasterxml.jackson.databind.node.ObjectNode resultContainer = new com.fasterxml.jackson.databind.ObjectMapper()
                        .createObjectNode();
                resultContainer.set("data", richSuggestions);
                return resultContainer;
            }

            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Transactional
    public Card updateCardPrice(Card card) {
        String url = "https://api.scryfall.com/cards/" + card.getId();
        JsonNode root = fetchJson(url);
        if (root != null) {
            return saveCardFromScryfall(root);
        }
        return card;
    }

    public JsonNode findPrintsByName(String name) {
        try {
            String query = "!\"" + name + "\"";
            String encodedQuery = java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8);
            String url = "https://api.scryfall.com/cards/search?q=" + encodedQuery + "&unique=prints";
            return fetchJson(url);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Card getCardById(String id) {
        String url = "https://api.scryfall.com/cards/" + id;
        JsonNode root = fetchJson(url);
        if (root != null) {
            return saveCardFromScryfall(root);
        }
        return null;
    }

    // Método auxiliar para buscar prints e escolher o melhor
    private JsonNode findBestPrint(String name) {
        JsonNode prints = findPrintsByName(name);
        if (prints != null && prints.has("data")) {
            for (JsonNode print : prints.get("data")) {
                if (hasValidPrice(print)) {
                    return print;
                }
            }
        }
        return null;
    }

    // Verifica se o JSON da carta tem preço válido
    private boolean hasValidPrice(JsonNode root) {
        return root.has("prices")
                && root.get("prices").has("usd")
                && !root.get("prices").get("usd").isNull()
                && root.get("prices").get("usd").asDouble() > 0;
    }

    private JsonNode fetchJson(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "LotusWatcher/1.0 (Java HttpClient)") // Scryfall pede User-Agent
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println(">>> FETCH STATUS: " + response.statusCode() + " for URL: " + url);

            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            } else {
                System.out.println(">>> FETCH ERROR BODY: " + response.body());
            }
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
        return null;
    }

    @Transactional
    public Card saveCardFromScryfall(JsonNode root) {
        String id = root.get("id").asText();

        // Verifica se a carta já existe ou cria uma nova
        Card card = cardRepository.findById(id).orElse(new Card());
        boolean isNew = (card.getId() == null); // Marca se é uma carta nova

        // PREENCHE OS DADOS BÁSICOS
        card.setId(id);
        card.setName(root.get("name").asText());
        card.setSetName(root.get("set_name").asText());

        if (root.has("collector_number")) {
            card.setCollectorNumber(root.get("collector_number").asText());
        }

        if (root.has("image_uris")) {
            if (root.get("image_uris").has("normal")) {
                card.setImageUrl(root.get("image_uris").get("normal").asText());
            }
        } else if (root.has("card_faces") && root.get("card_faces").get(0).has("image_uris")) {
            card.setImageUrl(root.get("card_faces").get(0).get("image_uris").get("normal").asText());
        }

        // Salva a carta imediatamente se for nova para garantir o ID
        if (isNew) {
            card = cardRepository.saveAndFlush(card); // saveAndFlush força a ida ao banco imediatamente
        }

        // TRATAMENTO DE PREÇO E HISTÓRICO
        Double newPrice = 0.0;
        if (root.has("prices") && root.get("prices").has("usd") && !root.get("prices").get("usd").isNull()) {
            newPrice = root.get("prices").get("usd").asDouble();
        }

        Double currentDbPrice = card.getPriceUsd();

        // Se o preço mudou OU se é carta nova, adiciona histórico
        if (currentDbPrice == null || !currentDbPrice.equals(newPrice)) {
            PriceHistory history = new PriceHistory();
            history.setPriceUsd(newPrice);
            history.setTimestamp(LocalDateTime.now());
            history.setCard(card);

            card.getPriceHistory().add(history);
            card.setPriceUsd(newPrice);
        }

        card.setLastUpdate(LocalDateTime.now());

        recalculateVariation(card);

        // Salva novamente (agora com o histórico atualizado)
        return cardRepository.save(card);
    }

    // --- SYNC STATUS MONITORING ---
    public static class SyncStatus {
        public volatile boolean isRunning = false;
        public volatile int total = 0;
        public volatile int current = 0;
        public volatile int percent = 0;
    }

    private final SyncStatus syncStatus = new SyncStatus();

    public SyncStatus getSyncStatus() {
        return syncStatus;
    }

    // Sincroniza TODAS as cartas do banco (pode demorar)
    public void syncAllCards() {
        if (syncStatus.isRunning) {
            System.out.println("⚠️ [ScryfallSync] Sincronização já está em andamento.");
            return;
        }

        // Set running to true BEFORE starting the thread to avoid race condition
        syncStatus.isRunning = true;
        syncStatus.total = 0;
        syncStatus.current = 0;
        syncStatus.percent = 0;

        new Thread(() -> {
            System.out.println("🔄 [ScryfallSync] Iniciando sincronização em massa...");

            try {
                java.util.List<Card> allCards = cardRepository.findAll();
                syncStatus.total = allCards.size();
                syncStatus.current = 0;
                syncStatus.percent = 0;

                int updated = 0;
                for (Card card : allCards) {
                    try {
                        updateCardPrice(card);
                        updated++;

                        // Update Status
                        syncStatus.current = updated;
                        if (syncStatus.total > 0) {
                            syncStatus.percent = (int) ((updated / (double) syncStatus.total) * 100);
                        }

                        if (updated % 10 == 0) {
                            System.out.println("🔄 [ScryfallSync] Atualizadas " + updated + "/" + allCards.size());
                        }
                        Thread.sleep(100); // 100ms delay to be gentle on API
                    } catch (Exception e) {
                        System.err.println("❌ Falha ao atualizar " + card.getName() + ": " + e.getMessage());
                    }
                }
                System.out.println("✅ [ScryfallSync] Sincronização concluída! Total: " + updated);
            } catch (Exception e) {
                System.err.println("❌ Erro fatal na sincronização: " + e.getMessage());
            } finally {
                // Clean up status after small delay
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                syncStatus.isRunning = false;
                syncStatus.total = 0;
                syncStatus.current = 0;
                syncStatus.percent = 0;
            }
        }).start();
    }

    // --- BULK IMPORT (STREAMING) ---
    public void importViaBulkData() {
        if (syncStatus.isRunning) {
            System.out.println("⚠️ [ScryfallImport] Processo já está em andamento.");
            return;
        }

        syncStatus.isRunning = true;
        syncStatus.total = 0; // Unknown initially
        syncStatus.current = 0;
        syncStatus.percent = 0;

        new Thread(() -> {
            System.out.println("🚀 [ScryfallImport] Iniciando importação em massa (Bulk Import)...");
            long startTime = System.currentTimeMillis();

            try {
                // 1. Get Bulk Data URL for "default_cards" (English + Unique)
                String bulkUrl = getBulkDataUrl("default_cards");
                if (bulkUrl == null) {
                    throw new RuntimeException("Não foi possível obter a URL do Bulk Data.");
                }
                System.out.println("📥 [ScryfallImport] Baixando de: " + bulkUrl);

                // 2. Load existing IDs to memory (Quick Lookup)
                System.out.println("💾 [ScryfallImport] Carregando IDs existentes...");
                java.util.Set<String> existingIds = cardRepository.findAllIds();
                System.out.println("💾 [ScryfallImport] " + existingIds.size() + " cartas já no banco.");

                // 3. Stream & Process
                java.net.URL url = java.net.URI.create(bulkUrl).toURL();
                try (java.io.InputStream is = url.openStream();
                        com.fasterxml.jackson.core.JsonParser parser = new com.fasterxml.jackson.core.JsonFactory()
                                .createParser(is)) {

                    if (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.START_ARRAY) {
                        throw new IllegalStateException("Expected content to be an array");
                    }

                    java.util.List<Card> batch = new java.util.ArrayList<>();
                    int processed = 0;
                    int added = 0;

                    while (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.END_ARRAY) {
                        // Parse JSON Object to Node
                        JsonNode root = objectMapper.readTree(parser);
                        String id = root.get("id").asText();

                        // Filter: Import ONLY if NOT exists
                        if (!existingIds.contains(id)) {
                            Card card = convertJsonToCard(root);
                            batch.add(card);
                            added++;
                        }

                        processed++;
                        syncStatus.current = added; // Track ADDED cards

                        // Update approximate percent (assuming ~90k cards for progress bar visual only)
                        syncStatus.percent = (int) Math.min(99, (processed / 90000.0) * 100);

                        // Batch Save (Chunk size: 1000)
                        if (batch.size() >= 1000) {
                            cardRepository.saveAll(batch);
                            cardRepository.flush();
                            batch.clear();
                            System.out.println("📦 [ScryfallImport] Lote salvo. Total adicionado: " + added);
                        }
                    }

                    // Save remaining
                    if (!batch.isEmpty()) {
                        cardRepository.saveAll(batch);
                        cardRepository.flush();
                    }

                    long duration = (System.currentTimeMillis() - startTime) / 1000;
                    System.out
                            .println("✅ [ScryfallImport] Concluído! " + added + " novas cartas em " + duration + "s.");
                }

            } catch (Exception e) {
                System.err.println("❌ [ScryfallImport] Erro fatal: " + e.getMessage());
                e.printStackTrace();
            } finally {
                syncStatus.isRunning = false;
                syncStatus.percent = 100;
            }
        }).start();
    }

    private String getBulkDataUrl(String type) {
        JsonNode root = fetchJson("https://api.scryfall.com/bulk-data");
        if (root != null && root.has("data")) {
            for (JsonNode item : root.get("data")) {
                if (item.get("type").asText().equals(type)) {
                    return item.get("download_uri").asText();
                }
            }
        }
        return null;
    }

    private Card convertJsonToCard(JsonNode root) {
        Card card = new Card();
        card.setId(root.get("id").asText());
        card.setName(root.get("name").asText());
        card.setSetName(root.get("set_name").asText());

        if (root.has("collector_number"))
            card.setCollectorNumber(root.get("collector_number").asText());

        if (root.has("image_uris") && root.get("image_uris").has("normal")) {
            card.setImageUrl(root.get("image_uris").get("normal").asText());
        } else if (root.has("card_faces") && root.get("card_faces").get(0).has("image_uris")) {
            card.setImageUrl(root.get("card_faces").get(0).get("image_uris").get("normal").asText());
        }

        Double price = 0.0;
        if (root.has("prices") && root.get("prices").has("usd") && !root.get("prices").get("usd").isNull()) {
            price = root.get("prices").get("usd").asDouble();
        }
        card.setPriceUsd(price);
        card.setLastUpdate(LocalDateTime.now());

        // Init history for new card
        PriceHistory history = new PriceHistory();
        history.setPriceUsd(price);
        history.setTimestamp(LocalDateTime.now());
        history.setCard(card);
        card.getPriceHistory().add(history);

        // Como é nova, variação é zero
        card.setPriceChangePercentage(0.0);

        return card;
    }

    private void recalculateVariation(Card card) {
        if (card.getPriceHistory().isEmpty() || card.getPriceUsd() == null) {
            card.setPriceChangePercentage(0.0);
            return;
        }

        // Pega o histórico mais antigo (o primeiro inserido)
        Double oldPrice = card.getPriceHistory().get(0).getPriceUsd();
        Double currentPrice = card.getPriceUsd();

        if (oldPrice == 0) {
            card.setPriceChangePercentage(0.0);
        } else {
            double change = ((currentPrice - oldPrice) / oldPrice) * 100;
            card.setPriceChangePercentage(change);
        }
    }
}