package com.pricewatcher.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tb_price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double priceUsd;
    private Double priceEur;

    private LocalDateTime timestamp; // Data e hora exata da coleta

    // Relacionamento: Vários históricos pertencem a UMA carta
    @ManyToOne
    @JoinColumn(name = "card_id") // Cria a coluna 'card_id' no banco que aponta para tb_cards
    @JsonIgnore // Evita loop infinito se tentarmos converter para JSON depois
    private Card card;
}