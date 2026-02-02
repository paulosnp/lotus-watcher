package com.pricewatcher.api.controller;

import com.pricewatcher.api.dto.WatchlistItemDto;
import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.User;
import com.pricewatcher.api.model.WatchlistItem;
import com.pricewatcher.api.repository.CardRepository;
import com.pricewatcher.api.repository.UserRepository;
import com.pricewatcher.api.repository.WatchlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private com.pricewatcher.api.service.ScryfallService scryfallService;

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("Not authenticated");
    }

    @GetMapping
    public ResponseEntity<List<WatchlistItem>> getWatchlist() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(watchlistRepository.findByUserId(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> addToWatchlist(@RequestBody WatchlistItemDto dto) {
        User user = getAuthenticatedUser();
        String cardId = dto.getCardId(); // Scryfall ID is String

        Optional<Card> cardOpt = cardRepository.findById(cardId);
        if (cardOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Card not found");
        }

        // Check if already in watchlist
        Optional<WatchlistItem> existing = watchlistRepository.findByUserIdAndCardId(user.getId(), cardId);
        if (existing.isPresent()) {
            // Update existing? Or just error? Let's update.
            WatchlistItem item = existing.get();
            item.setNotes(dto.getNotes());
            item.setTargetPrice(dto.getTargetPrice());
            item.setTag(dto.getTag());
            watchlistRepository.save(item);
            return ResponseEntity.ok(item);
        }

        WatchlistItem item = new WatchlistItem();
        item.setUser(user);
        item.setCard(cardOpt.get());
        item.setNotes(dto.getNotes());
        item.setTargetPrice(dto.getTargetPrice());
        item.setTag(dto.getTag());

        watchlistRepository.save(item);
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> removeFromWatchlist(@PathVariable UUID itemId) {
        User user = getAuthenticatedUser();
        Optional<WatchlistItem> item = watchlistRepository.findById(itemId);

        if (item.isPresent()) {
            if (!item.get().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Not authorized");
            }
            watchlistRepository.delete(item.get());
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<?> updateWatchlistItem(@PathVariable UUID itemId, @RequestBody WatchlistItemDto dto) {
        User user = getAuthenticatedUser();
        Optional<WatchlistItem> itemOpt = watchlistRepository.findById(itemId);

        if (itemOpt.isPresent()) {
            WatchlistItem item = itemOpt.get();
            if (!item.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("Not authorized");
            }

            // HANDLE CARD SWAP
            if (dto.getCardId() != null && !dto.getCardId().equals(item.getCard().getId())) {
                // Check if new card exists locally
                Optional<Card> newCardOpt = cardRepository.findById(dto.getCardId());
                Card newCard = null;

                if (newCardOpt.isPresent()) {
                    newCard = newCardOpt.get();
                } else {
                    // Fetch from Scryfall
                    newCard = scryfallService.getCardById(dto.getCardId());
                }

                if (newCard != null) {
                    item.setCard(newCard); // SWAP
                } else {
                    return ResponseEntity.badRequest().body("Invalid Card ID: " + dto.getCardId());
                }
            }

            item.setNotes(dto.getNotes());
            item.setTargetPrice(dto.getTargetPrice());
            item.setTag(dto.getTag());
            watchlistRepository.save(item);
            return ResponseEntity.ok(item);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<com.pricewatcher.api.dto.BatchImportResultDto> batchImport(
            @RequestBody com.pricewatcher.api.dto.BatchImportDto dto) {
        User user = getAuthenticatedUser();

        List<String> added = new java.util.ArrayList<>();
        List<String> notFound = new java.util.ArrayList<>();

        for (String rawName : dto.getCardNames()) {
            if (rawName == null || rawName.trim().isEmpty())
                continue;

            // Basic cleaning: remove quantity like "1x " or "4 " at start
            String name = rawName.trim().replaceAll("^\\d+\\s*[xX]?\\s*", "");

            Optional<Card> cardOpt = cardRepository.findFirstByNameIgnoreCase(name);

            if (cardOpt.isPresent()) {
                Card card = cardOpt.get();
                // Check duplicate
                Optional<WatchlistItem> existing = watchlistRepository.findByUserIdAndCardId(user.getId(),
                        card.getId());
                if (existing.isEmpty()) {
                    WatchlistItem item = new WatchlistItem();
                    item.setUser(user);
                    item.setCard(card);
                    item.setNotes("Imported");
                    item.setCreatedAt(java.time.LocalDateTime.now());
                    watchlistRepository.save(item);
                    added.add(card.getName());
                } else {
                    // Already exists, treat as "added" (or maybe ignored, but let's confirm
                    // success)
                    added.add(card.getName() + " (Já existe)");
                }
            } else {
                notFound.add(name);
            }
        }

        return ResponseEntity.ok(new com.pricewatcher.api.dto.BatchImportResultDto(added, notFound));
    }
}
