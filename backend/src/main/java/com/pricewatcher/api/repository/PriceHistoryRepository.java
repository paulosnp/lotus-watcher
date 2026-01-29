package com.pricewatcher.api.repository;

import com.pricewatcher.api.model.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // <--- O erro acontece se faltar esse import ou a linha abaixo

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {

    // --- ESSA É A LINHA QUE O JAVA ESTÁ RECLAMANDO QUE NÃO EXISTE ---
    List<PriceHistory> findByCardIdOrderByTimestampAsc(String cardId);

}