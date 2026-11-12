package com.chat.Backend.repository;

import com.chat.Backend.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    // Newest-first page (initial load)
    List<Message> findByConversationIdOrderByCreatedAtDescIdDesc(UUID conversationId, Pageable pageable);

    // Cursor page: messages older than cursor
    List<Message> findByConversationIdAndCreatedAtLessThanOrderByCreatedAtDescIdDesc(
            UUID conversationId, Instant cursor, Pageable pageable);

    Optional<Message> findFirstByConversationIdOrderByCreatedAtDescIdDesc(UUID conversationId);

    // Unread = messages created after member's last-read message timestamp, excluding own messages
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :convId " +
           "AND m.deleted = false AND m.createdAt > :since " +
           "AND (m.sender IS NULL OR m.sender.id <> :userId)")
    long countUnread(@Param("convId") UUID convId, @Param("since") Instant since, @Param("userId") UUID userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :convId " +
           "AND m.deleted = false AND (m.sender IS NULL OR m.sender.id <> :userId)")
    long countUnreadNoCursor(@Param("convId") UUID convId, @Param("userId") UUID userId);

    List<Message> findByConversationIdAndIdGreaterThan(UUID conversationId, UUID messageId);

    @Modifying
    @Query("UPDATE Message m SET m.status = com.chat.Backend.entity.MessageStatus.READ " +
           "WHERE m.conversation.id = :convId AND m.createdAt <= :cutoff " +
           "AND m.deleted = false AND m.status <> com.chat.Backend.entity.MessageStatus.READ " +
           "AND (m.sender IS NULL OR m.sender.id <> :userId)")
    int markReadUpTo(@Param("convId") UUID convId, @Param("cutoff") Instant cutoff, @Param("userId") UUID userId);
}
