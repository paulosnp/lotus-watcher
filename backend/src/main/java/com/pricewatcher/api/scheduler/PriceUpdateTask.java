package com.pricewatcher.api.scheduler;

import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.repository.CardRepository;
import com.pricewatcher.api.service.ScryfallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PriceUpdateTask {

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private ScryfallService scryfallService;

    // Configuração do Agendamento
    // initialDelay = 10000 (10 segundos após ligar o servidor, ele roda a primeira vez)
    // fixedRate = 60000 (Roda a cada 60 segundos - PARA TESTE)
    @Scheduled(initialDelay = 10000, fixedRate = 60000)
    public void runPriceUpdate() {
        System.out.println("--- INICIANDO ROBÔ DE ATUALIZAÇÃO DE PREÇOS ---");

        List<Card> allCards = cardRepository.findAll();
        System.out.println("Total de cartas para monitorar: " + allCards.size());

        for (Card card : allCards) {
            // Chama o serviço para atualizar essa carta
            scryfallService.updateCardPrice(card);

            // IMPORTANTE: Pausa de 100ms para respeitar a regra do Scryfall
            // Se não fizermos isso, eles podem bloquear seu IP.
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        System.out.println("--- FIM DA ATUALIZAÇÃO ---");
    }
}