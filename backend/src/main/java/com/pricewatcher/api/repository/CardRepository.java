package com.pricewatcher.api.repository;

import com.pricewatcher.api.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional; // <--- OBRIGATÓRIO

public interface CardRepository extends JpaRepository<Card, String> {

    // Esse é o método que estava faltando:
    Optional<Card> findFirstByNameIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Query("SELECT c.id FROM Card c")
    java.util.Set<String> findAllIds();

    java.util.List<Card> findTop5ByOrderByPriceChangePercentageDesc();

    java.util.List<Card> findTop5ByOrderByPriceChangePercentageAsc();
}