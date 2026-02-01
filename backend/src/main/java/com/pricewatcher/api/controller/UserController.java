package com.pricewatcher.api.controller;

import com.pricewatcher.api.dto.AuthDto.*;
import com.pricewatcher.api.model.Card;
import com.pricewatcher.api.model.User;
import com.pricewatcher.api.repository.CardRepository;
import com.pricewatcher.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Set;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, CardRepository cardRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.cardRepository = cardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDataDto> getCurrentUser() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(new UserDataDto(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getAvatar(),
                user.getRole()));
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        User user = getAuthenticatedUser();
        user.setName(request.getName());
        userRepository.save(user);
        return ResponseEntity.ok(Collections.singletonMap("message", "Perfil atualizado com sucesso!"));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Senha atual incorreta!"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Collections.singletonMap("message", "Senha alterada com sucesso!"));
    }

    // --- WATCHLIST ENDPOINTS ---

    @GetMapping("/watchlist")
    public ResponseEntity<Set<Card>> getWatchlist() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(user.getWatchlist());
    }

    @PostMapping("/watchlist/{cardId}")
    public ResponseEntity<?> addToWatchlist(@PathVariable String cardId) {
        User user = getAuthenticatedUser();

        // Verifica se a carta existe no banco. Se não existir, erro 404.
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        user.getWatchlist().add(card);
        userRepository.save(user);

        return ResponseEntity.ok(Collections.singletonMap("message", "Carta adicionada à watchlist!"));
    }

    @DeleteMapping("/watchlist/{cardId}")
    public ResponseEntity<?> removeFromWatchlist(@PathVariable String cardId) {
        User user = getAuthenticatedUser();

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("Card not found"));

        user.getWatchlist().remove(card);
        userRepository.save(user);

        return ResponseEntity.ok(Collections.singletonMap("message", "Carta removida da watchlist!"));
    }
}
