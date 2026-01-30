package com.pricewatcher.api.model;

import jakarta.persistence.*; // Se der erro aqui, tente "import javax.persistence.*;"
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "tb_cards")
public class Card {

    @Id
    private String id; // UUID da carta vindo do Scryfall

    private String name;
    private String setName;
    private String collectorNumber;
    private Double priceUsd;

    @Column(length = 1000) // Aumenta o tamanho para garantir que links grandes caibam
    private String imageUrl;

    private LocalDateTime lastUpdate;

    // --- RELACIONAMENTO COM HISTÓRICO ---
    // mappedBy = "card" refere-se ao campo 'card' dentro da classe PriceHistory
    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PriceHistory> priceHistory = new ArrayList<>();

    // --- CAMPO CALCULADO (NÃO VAI PRO BANCO) ---
    @Transient
    private Double priceChangePercentage;

    // --- CONSTRUTORES ---
    public Card() {
        // Construtor vazio necessário para o JPA
    }

    // --- GETTERS E SETTERS ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSetName() {
        return setName;
    }

    public void setSetName(String setName) {
        this.setName = setName;
    }

    public String getCollectorNumber() {
        return collectorNumber;
    }

    public void setCollectorNumber(String collectorNumber) {
        this.collectorNumber = collectorNumber;
    }

    public Double getPriceUsd() {
        return priceUsd;
    }

    public void setPriceUsd(Double priceUsd) {
        this.priceUsd = priceUsd;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    // Importante: O Getter e Setter precisam ser tipados com <PriceHistory>
    public List<PriceHistory> getPriceHistory() {
        return priceHistory;
    }

    public void setPriceHistory(List<PriceHistory> priceHistory) {
        this.priceHistory = priceHistory;
    }

    public Double getPriceChangePercentage() {
        return priceChangePercentage;
    }

    public void setPriceChangePercentage(Double priceChangePercentage) {
        this.priceChangePercentage = priceChangePercentage;
    }
}