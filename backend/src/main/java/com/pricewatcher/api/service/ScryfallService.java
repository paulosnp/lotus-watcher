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
            return updateCardPrice(localCard.get());
        }

        String encodedName = name.replace(" ", "+");
        String url = "https://api.scryfall.com/cards/named?fuzzy=" + encodedName;
        return fetchAndSave(url);
    }

    public Card updateCardPrice(Card card) {
        String url = "https://api.scryfall.com/cards/" + card.getId();
        return fetchAndSave(url);
    }

    public JsonNode findPrintsByName(String name) {
        String encodedName = name.replace(" ", "+");
        String url = "https://api.scryfall.com/cards/search?q=!\"" + encodedName + "\"&unique=prints";

        try {
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Card fetchAndSave(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                return saveCardFromScryfall(root);
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