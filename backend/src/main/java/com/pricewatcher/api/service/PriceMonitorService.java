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

@Service
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

    // Cron every 30 minutes: 0 0/30 * * * *
    // For Dev/Testing, we can use fixedRate = 60000 (1 minute) if needed
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void checkPriceAlerts() {
        System.out.println("⏰ [PriceMonitor] Iniciando ciclo de monitoramento VIP...");

        // 1. ATUALIZAÇÃO VIP: Busca cartas que estão em watchlists e atualiza preço
        // AGORA
        List<Card> watchedCards = watchlistRepository.findDistinctCardsInWatchlists();
        System.out
                .println("💎 [PriceMonitor] Atualizando " + watchedCards.size() + " cartas monitoradas na Scryfall...");

        for (Card card : watchedCards) {
            try {
                scryfallService.updateCardPrice(card);
                Thread.sleep(100); // Delay suave para não tomar Rate Limit
            } catch (Exception e) {
                System.err.println("⚠️ Erro ao atualizar preço da carta " + card.getName() + ": " + e.getMessage());
            }
        }
        System.out.println("✅ [PriceMonitor] Preços atualizados! Verificando disparos de alerta...");

        // 2. VERIFICAÇÃO DE ALERTAS (Lógica original)
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
                    // Notify again if price dropped MORE since last notification
                    // e.g. Dropped from $10 to $9 (Notified), then to $5 (Notify again!)
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

        // As we are in a Transactional method (checkPriceAlerts), managed entities are
        // auto-saved,
        // but explicit save is safer/clearer
        watchlistRepository.save(item);

        System.out.println("✅ [PriceMonitor] Alerta enviado para " + item.getUser().getEmail() + " sobre "
                + item.getCard().getName());
    }

    // Helper for manual trigger/testing
    public void forceRunNow() {
        checkPriceAlerts();
    }
}
