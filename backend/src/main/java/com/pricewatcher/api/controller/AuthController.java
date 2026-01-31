package com.pricewatcher.api.controller;

import com.pricewatcher.api.dto.AuthDto.*;
import com.pricewatcher.api.model.User;
import com.pricewatcher.api.repository.UserRepository;
import com.pricewatcher.api.security.JwtTokenProvider;
import com.pricewatcher.api.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider, EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(authentication);

            return ResponseEntity.ok(new AuthResponse(token));
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Collections.singletonMap("error", "Conta não verificada. Cheque seu email!"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Collections.singletonMap("error", "Email ou senha incorretos."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        System.out.println("📝 [AuthController] Recebida solicitação de registro: " + registerRequest.getEmail());

        try {
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(java.util.Collections.singletonMap("error", "Email já cadastrado!"));
            }

            User user = new User();
            user.setName(registerRequest.getName());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setRole("USER");

            // NOVO: Bloqueia e gera token numérico de 6 dígitos
            user.setEnabled(false);
            String token = String.valueOf(new java.util.Random().nextInt(900000) + 100000); // Gera entre 100000 e
                                                                                            // 999999
            user.setVerificationToken(token);

            userRepository.save(user);

            // NOVO: Envia email com o código
            emailService.sendVerificationEmail(user.getEmail(), token);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(java.util.Collections.singletonMap("message", "Registro com sucesso! Verifique seu email."));
        } catch (Exception e) {
            e.printStackTrace(); // <--- ISSO VAI MOSTRAR O ERRO NO TERMINAL!
            return ResponseEntity.internalServerError()
                    .body(java.util.Collections.singletonMap("error", "Erro interno: " + e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        java.util.Optional<User> userOptional = userRepository.findByVerificationToken(token);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setEnabled(true);
            user.setVerificationToken(null); // Limpa o token pra não usar 2x
            userRepository.save(user);
            return ResponseEntity.ok(java.util.Collections.singletonMap("message", "Email verificado com sucesso!"));
        } else {
            return ResponseEntity.badRequest()
                    .body(java.util.Collections.singletonMap("error", "Token inválido ou expirado."));
        }
    }
}
