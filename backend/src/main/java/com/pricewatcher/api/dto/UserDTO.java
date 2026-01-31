package com.pricewatcher.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDTO(UUID id, String name, String email, String role, boolean enabled, LocalDateTime createdAt) {
}
