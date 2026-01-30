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
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
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

        // Salva novamente (agora com o histórico atualizado)
        return cardRepository.save(card);
    }
}