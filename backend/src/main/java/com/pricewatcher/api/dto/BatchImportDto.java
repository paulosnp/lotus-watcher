package com.pricewatcher.api.dto;

import java.util.List;

public class BatchImportDto {
    private List<String> cardNames;

    public List<String> getCardNames() {
        return cardNames;
    }

    public void setCardNames(List<String> cardNames) {
        this.cardNames = cardNames;
    }
}
