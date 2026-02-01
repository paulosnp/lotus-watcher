package com.pricewatcher.api.repository;

import com.pricewatcher.api.model.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WatchlistRepository extends JpaRepository<WatchlistItem, UUID> {
    List<WatchlistItem> findByUserId(UUID userId);

    Optional<WatchlistItem> findByUserIdAndCardId(UUID userId, String cardId); // Card ID is String from Scryfall

    List<WatchlistItem> findByTargetPriceIsNotNull();
}
