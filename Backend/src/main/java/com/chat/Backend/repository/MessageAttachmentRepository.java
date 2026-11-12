package com.chat.Backend.repository;

import com.chat.Backend.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, UUID> {
    List<MessageAttachment> findByMessageId(UUID messageId);
    List<MessageAttachment> findByIdIn(List<UUID> ids);
}
