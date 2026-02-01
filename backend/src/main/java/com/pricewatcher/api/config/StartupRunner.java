package com.pricewatcher.api.config;

import com.pricewatcher.api.service.PriceMonitorService;
import com.pricewatcher.api.repository.WatchlistRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupRunner implements CommandLineRunner {

    private final PriceMonitorService priceMonitorService;
    private final WatchlistRepository watchlistRepository;

    public StartupRunner(PriceMonitorService priceMonitorService,
            WatchlistRepository watchlistRepository) {
        this.priceMonitorService = priceMonitorService;
        this.watchlistRepository = watchlistRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 [LotusWatcher] Sistema iniciado.");

        long watchlistCount = watchlistRepository.count();
        int uniqueCards = watchlistRepository.findDistinctCardsInWatchlists().size();

        System.out.println("📊 [Diagnóstico] Total de itens na Watchlist: " + watchlistCount);
        System.out.println("📊 [Diagnóstico] Cartas Únicas para Monitorar: " + uniqueCards);

        // Executa APENAS a verificação VIP na inicialização
        System.out.println("🏃 [Startup] Rodando verificação VIP de Watchlists...");
        priceMonitorService.checkPriceAlerts();

        System.out.println("✅ [Startup] Concluído.");
    }
}
