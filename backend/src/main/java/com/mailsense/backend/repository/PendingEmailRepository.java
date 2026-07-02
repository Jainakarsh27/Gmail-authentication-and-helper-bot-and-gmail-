package com.mailsense.backend.repository;

import com.mailsense.backend.model.PendingEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PendingEmailRepository extends JpaRepository<PendingEmail, Long> {
    List<PendingEmail> findBySenderEmailAndStatusOrderByCreatedAtDesc(String senderEmail, String status);
    List<PendingEmail> findByStatusAndSendAtBefore(String status, LocalDateTime time);
}
