package com.pricewatcher.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationDto {
    private UUID id;
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String type;

    public NotificationDto(UUID id, String title, String message, boolean isRead, LocalDateTime createdAt,
            String type) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.createdAt = createdAt;
        this.type = type;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRead() {
        return isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getType() {
        return type;
    }
}
