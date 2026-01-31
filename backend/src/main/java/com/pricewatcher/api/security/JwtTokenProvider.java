package com.pricewatcher.api.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @org.springframework.beans.factory.annotation.Value("${app.jwt-secret}")
    private String jwtSecret;

    private Key key;
    private static final long JWT_EXPIRATION_MS = 86400000; // 1 dia

    @jakarta.annotation.PostConstruct
    public void init() {
        if (jwtSecret != null && jwtSecret.length() >= 64) {
            this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        } else {
            // Fallback para dev se não tiver config
            this.key = Keys.secretKeyFor(SignatureAlgorithm.HS512);
        }
    }

    private Key getSigningKey() {
        return key;
    }

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();

        // Obter roles
        String role = authentication.getAuthorities().stream()
                .findFirst().map(r -> r.getAuthority().replace("ROLE_", ""))
                .orElse("USER");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION_MS);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (io.jsonwebtoken.security.SignatureException ex) {
            System.err.println("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            System.err.println("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty");
        }
        return false;
    }
}
