package com.pricewatcher.api.controller;

import com.pricewatcher.api.model.Notification;
import com.pricewatcher.api.model.User;
import com.pricewatcher.api.repository.NotificationRepository;
import com.pricewatcher.api.repository.UserRepository;
import com.pricewatcher.api.service.PriceMonitorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final PriceMonitorService priceMonitorService;

    public NotificationController(NotificationRepository notificationRepository,
            UserRepository userRepository,
            PriceMonitorService priceMonitorService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.priceMonitorService = priceMonitorService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        // Return unread first, then newest
        return ResponseEntity.ok(notificationRepository.findByUserOrderByIsReadAscCreatedAtDesc(user));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        long count = notificationRepository.countByUserAndIsReadFalse(user);

        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getUser().getId().equals(user.getId())) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });

        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        notificationRepository.markAllAsReadForUser(user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getUser().getId().equals(user.getId())) {
                notificationRepository.delete(notification);
            }
        });

        return ResponseEntity.ok().build();
    }

    // --- DEV / TEST ENDPOINT ---
    @PostMapping("/test-monitor")
    public ResponseEntity<String> triggerPriceMonitor() {
        priceMonitorService.forceRunNow();
        return ResponseEntity.ok("Price Monitor executed successfully!");
    }
}
