package com.pricewatcher.api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.PriceHistory;
import com.pricewatcher.api.repository.CardRepository;
import com.pricewatcher.api.service.ScryfallService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@RestController
@RequestMapping("/api/cards")
@Slf4j
public class CardController {

    private final CardRepository cardRepository;
    private final ScryfallService scryfallService;

    public CardController(CardRepository cardRepository, ScryfallService scryfallService) {
        this.cardRepository = cardRepository;
        this.scryfallService = scryfallService;
        log.info(">>> CARD CONTROLLER INICIALIZADO COM AUTOCOMPLETE! <<<");
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
        // Return empty list safely
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"object\": \"list\", \"data\": []}");
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<String> params(@RequestParam String q) {
        log.info(">>> REQUEST RECEBIDO: {}", q);
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
        // Agora usamos o banco para ordenar, evitando carregar 90k cartas na memória
        List<Card> risers = cardRepository.findTop5ByOrderByPriceChangePercentageDesc();
        List<Card> fallers = cardRepository.findTop5ByOrderByPriceChangePercentageAsc();

        Map<String, List<Card>> marketData = new HashMap<>();
        marketData.put("risers", risers);
        marketData.put("fallers", fallers);

        return marketData;
    }

    @GetMapping("/prints/{name}")
    public ResponseEntity<String> getCardPrints(@PathVariable String name) {
        JsonNode prints = scryfallService.findPrintsByName(name);
        if (prints != null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(prints.toString());
        }
        return ResponseEntity.notFound().build();
    }

}