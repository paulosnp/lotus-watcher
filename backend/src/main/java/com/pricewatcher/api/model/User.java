package com.pricewatcher.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Hash

    private String name;

    private String role; // "USER", "ADMIN"

    @Column(nullable = false)
    private boolean enabled = false; // Novo: Bloqueado até verificar email

    private String verificationToken; // Novo: Token enviado por email

    private LocalDateTime createdAt = LocalDateTime.now();
}
