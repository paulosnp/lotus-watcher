package com.pricewatcher.api.service;

import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.Notification;
import com.pricewatcher.api.model.WatchlistItem;
import com.pricewatcher.api.repository.NotificationRepository;
import com.pricewatcher.api.repository.WatchlistRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.pricewatcher.api.service.ScryfallService;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PriceMonitorService {

    private final WatchlistRepository watchlistRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final ScryfallService scryfallService;

    public PriceMonitorService(WatchlistRepository watchlistRepository,
            NotificationRepository notificationRepository,
            EmailService emailService,
            ScryfallService scryfallService) {
        this.watchlistRepository = watchlistRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.scryfallService = scryfallService;
    }

    // Cron every 30 minutes
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void checkPriceAlerts() {
        log.info("⏰ [PriceMonitor] Iniciando ciclo de monitoramento VIP...");

        // 1. Refresh prices for monitored cards
        List<Card> watchedCards = watchlistRepository.findDistinctCardsInWatchlists();
        log.info("💎 [PriceMonitor] Atualizando {} cartas monitoradas na Scryfall...", watchedCards.size());

        for (Card card : watchedCards) {
            try {
                scryfallService.updateCardPrice(card);
                Thread.sleep(100); // Rate limit protection
            } catch (Exception e) {
                log.error("⚠️ Erro ao atualizar preço da carta {}: {}", card.getName(), e.getMessage());
            }
        }
        log.info("✅ [PriceMonitor] Preços atualizados! Verificando disparos de alerta...");

        // 2. Alert Checks
        // Fetch items with a set target price
        List<WatchlistItem> items = watchlistRepository.findByTargetPriceIsNotNull();

        for (WatchlistItem item : items) {
            processItem(item);
        }
    }

    private void processItem(WatchlistItem item) {
        Card card = item.getCard();
        if (card.getPriceUsd() == null)
            return;

        BigDecimal price = BigDecimal.valueOf(card.getPriceUsd());
        BigDecimal target = item.getTargetPrice();

        // Check if price is below or equal to target
        if (price.compareTo(target) <= 0) {

            // Check Cooldown (24h)
            boolean shouldNotify = false;
            if (item.getLastNotifiedAt() == null) {
                shouldNotify = true;
            } else {
                LocalDateTime yesterday = LocalDateTime.now().minusHours(24);
                if (item.getLastNotifiedAt().isBefore(yesterday)) {
                    shouldNotify = true;
                } else if (item.getLastNotifiedPrice() != null) {
                    // Notify again if price dropped significantly since last notification
                    BigDecimal lastPrice = BigDecimal.valueOf(item.getLastNotifiedPrice());
                    // If current price is at least 1% lower than last notified price
                    if (price.compareTo(lastPrice) < 0) {
                        shouldNotify = true;
                    }
                }
            }

            if (shouldNotify) {
                sendAlert(item, price, target);
            }
        }
    }

    private void sendAlert(WatchlistItem item, BigDecimal currentPrice, BigDecimal targetPrice) {
        // 1. Send Email
        emailService.sendPriceAlert(
                item.getUser().getEmail(),
                item.getCard().getName(),
                currentPrice.doubleValue(),
                targetPrice.doubleValue());

        // 2. Create In-App Notification
        Notification notification = new Notification();
        notification.setUser(item.getUser());
        notification.setTitle("Alerta de Preço: " + item.getCard().getName());
        notification.setMessage("O preço caiu para $" + currentPrice + "! Seu alvo era $" + targetPrice);
        notification.setType(Notification.NotificationType.PRICE_ALERT);

        notificationRepository.save(notification);

        // 3. Update Watchlist Item logic
        item.setLastNotifiedAt(LocalDateTime.now());
        item.setLastNotifiedPrice(currentPrice.doubleValue());

        // Explicit save for clarity
        watchlistRepository.save(item);

        log.info("✅ [PriceMonitor] Alerta enviado para {} sobre {}", item.getUser().getEmail(),
                item.getCard().getName());
    }

    // Helper for manual trigger/testing
    public void forceRunNow() {
        checkPriceAlerts();
    }
}
