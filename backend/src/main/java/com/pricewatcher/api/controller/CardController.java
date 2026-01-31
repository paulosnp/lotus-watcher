package com.pricewatcher.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.PriceHistory;
import com.pricewatcher.api.repository.CardRepository;
import com.pricewatcher.api.service.ScryfallService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/cards")
@CrossOrigin(origins = "http://localhost:4200")
public class CardController {

    private final CardRepository cardRepository;
    private final ScryfallService scryfallService;

    public CardController(CardRepository cardRepository, ScryfallService scryfallService) {
        this.cardRepository = cardRepository;
        this.scryfallService = scryfallService;
        System.out.println(">>> CARD CONTROLLER INICIALIZADO COM AUTOCOMPLETE! <<<");
    }

    @GetMapping("/search")
    public ResponseEntity<Card> searchCard(@RequestParam String name) {
        Card card = scryfallService.searchCard(name);
        if (card != null) {
            return ResponseEntity.ok(card);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search-results")
    public ResponseEntity<String> searchCards(@RequestParam String q) {
        JsonNode results = scryfallService.searchCards(q);
        if (results != null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(results.toString());
        }
        // Retorna lista vazia em vez de 404 para evitar erro no console
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"object\": " + "\"list\", \"data\": []}");
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<String> params(@RequestParam String q) {
        System.out.println(">>> REQUEST RECEBIDO: " + q);
        JsonNode results = scryfallService.getAutocompleteSuggestions(q);
        if (results != null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(results.toString());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/random")
    public ResponseEntity<Card> getRandomCard() {
        Card card = scryfallService.getRandomCard();
        if (card != null) {
            return ResponseEntity.ok(card);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/sets")
    public ResponseEntity<String> getSets() {
        // Retorna o JSON direto do Scryfall (proxy simples)
        JsonNode sets = scryfallService.getSets();
        if (sets != null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(sets.toString());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Card> getCardById(@PathVariable String id) {
        // Tenta buscar no banco local
        return cardRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    // Se não achar, busca na API do Scryfall e salva no banco
                    Card apiCard = scryfallService.getCardById(id);
                    if (apiCard != null) {
                        return ResponseEntity.ok(apiCard);
                    }
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<PriceHistory>> getCardHistory(@PathVariable String id) {
        return cardRepository.findById(id)
                .map(card -> ResponseEntity.ok(card.getPriceHistory()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/market")
    public Map<String, List<Card>> getMarketOverview() {
        List<Card> allCards = cardRepository.findAll();

        // Calcula a porcentagem para cada carta
        for (Card card : allCards) {
            card.setPriceChangePercentage(calcularVariacao(card));
        }

        // Ordena os Vencedores
        List<Card> risers = allCards.stream()
                .sorted(Comparator.comparing(Card::getPriceChangePercentage).reversed())
                .limit(5)
                .toList();

        // Ordena os Perdedores
        List<Card> fallers = allCards.stream()
                .sorted(Comparator.comparing(Card::getPriceChangePercentage))
                .limit(5)
                .toList();

        Map<String, List<Card>> marketData = new HashMap<>();
        marketData.put("risers", risers);
        marketData.put("fallers", fallers);

        return marketData;
    }

    @GetMapping("/prints/{name}")
    public ResponseEntity<JsonNode> getCardPrints(@PathVariable String name) {
        JsonNode prints = scryfallService.findPrintsByName(name);
        if (prints != null) {
            return ResponseEntity.ok(prints);
        }
        return ResponseEntity.notFound().build();
    }

    private double calcularVariacao(Card card) {
        if (card.getPriceUsd() == null || card.getPriceHistory().isEmpty()) {
            return 0.0;
        }

        double currentPrice = card.getPriceUsd();
        // Pega o preço mais antigo disponível para comparar
        double oldPrice = card.getPriceHistory().get(0).getPriceUsd();

        if (oldPrice == 0)
            return 0.0;

        return ((currentPrice - oldPrice) / oldPrice) * 100;
    }
}