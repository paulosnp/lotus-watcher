package com.pricewatcher.api.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WatchlistItemDto {
    private String cardId;
    private BigDecimal targetPrice;
    private String notes;
    private String tag;
}
