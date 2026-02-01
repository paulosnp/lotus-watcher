package com.pricewatcher.api.repository;

import com.pricewatcher.api.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserOrderByIsReadAscCreatedAtDesc(com.pricewatcher.api.model.User user);

    long countByUserAndIsReadFalse(com.pricewatcher.api.model.User user);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    void markAllAsReadForUser(
            @org.springframework.data.repository.query.Param("user") com.pricewatcher.api.model.User user);
}
