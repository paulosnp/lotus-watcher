package com.pricewatcher.api.dto;

import lombok.Data;

public class AuthDto {
    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String tokenType = "Bearer";

        public AuthResponse(String accessToken) {
            this.accessToken = accessToken;
        }
    }

    // --- NOVOS DTOs ---

    @Data
    @lombok.AllArgsConstructor
    public static class UserDataDto {
        private String id;
        private String name;
        private String email;
        private String avatar;
        private String role;
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
    }

    @Data
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
    }
}
