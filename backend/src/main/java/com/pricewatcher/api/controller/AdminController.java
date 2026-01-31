package com.pricewatcher.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final com.pricewatcher.api.repository.UserRepository userRepository;
    private final com.pricewatcher.api.repository.CardRepository cardRepository;
    private final com.pricewatcher.api.service.ScryfallService scryfallService;

    public AdminController(com.pricewatcher.api.repository.UserRepository userRepository,
            com.pricewatcher.api.repository.CardRepository cardRepository,
            com.pricewatcher.api.service.ScryfallService scryfallService) {
        this.userRepository = userRepository;
        this.cardRepository = cardRepository;
        this.scryfallService = scryfallService;
    }

    @GetMapping("/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> checkAdminAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Access Granted");
        response.put("role", "ADMIN");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalCards", cardRepository.count());
        return ResponseEntity.ok(stats);
    }

    @org.springframework.web.bind.annotation.GetMapping("/scryfall/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.pricewatcher.api.service.ScryfallService.SyncStatus> getSyncStatus() {
        return ResponseEntity.ok(scryfallService.getSyncStatus());
    }

    @org.springframework.web.bind.annotation.PostMapping("/scryfall/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> triggerSync() {
        scryfallService.syncAllCards();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Sync process started in background.");
        return ResponseEntity.ok(response);
    }

    @org.springframework.web.bind.annotation.GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.pricewatcher.api.dto.UserDTO>> listUsers(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {

        org.springframework.data.domain.Page<com.pricewatcher.api.model.User> users = userRepository.findAll(
                org.springframework.data.domain.PageRequest.of(page, size,
                        org.springframework.data.domain.Sort.by("email")));

        org.springframework.data.domain.Page<com.pricewatcher.api.dto.UserDTO> dtoPage = users
                .map(user -> new com.pricewatcher.api.dto.UserDTO(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole(),
                        user.isEnabled(),
                        user.getCreatedAt()));

        return ResponseEntity.ok(dtoPage);
    }

    @org.springframework.web.bind.annotation.PostMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(
            @org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setEnabled(!user.isEnabled());
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User status updated to: " + (user.isEnabled() ? "Active" : "Banned/Disabled"));
            response.put("enabled", user.isEnabled());
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.PostMapping("/users/{id}/toggle-role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> toggleUserRole(
            @org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        return userRepository.findById(id).map(user -> {
            if (user.getRole().equals("ADMIN")) {
                // Prevent self-demotion
                String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication().getName();
                if (user.getEmail().equals(currentUsername)) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "You cannot demote yourself.");
                    return ResponseEntity.status(403).body(error);
                }
                user.setRole("USER");
            } else {
                user.setRole("ADMIN");
            }
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User role updated to: " + user.getRole());
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cards")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<com.pricewatcher.api.model.Card>> listAllCards(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "name") String sortBy) {

        return ResponseEntity.ok(cardRepository.findAll(
                org.springframework.data.domain.PageRequest.of(page, size,
                        org.springframework.data.domain.Sort.by(sortBy))));
    }
}
