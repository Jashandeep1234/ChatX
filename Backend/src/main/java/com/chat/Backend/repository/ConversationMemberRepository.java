package com.chat.Backend.repository;

import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.MemberRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, UUID> {

    Optional<ConversationMember> findByConversationIdAndUserId(UUID conversationId, UUID userId);

    List<ConversationMember> findByConversationId(UUID conversationId);

    List<ConversationMember> findByUserId(UUID userId);

    boolean existsByConversationIdAndUserId(UUID conversationId, UUID userId);

    long countByConversationId(UUID conversationId);

    long countByConversationIdAndRole(UUID conversationId, MemberRole role);

    Optional<ConversationMember> findFirstByConversationIdAndRoleOrderByJoinedAtAsc(UUID conversationId, MemberRole role);

    // Oldest remaining member, used for admin promotion when last admin leaves
    Optional<ConversationMember> findFirstByConversationIdOrderByJoinedAtAsc(UUID conversationId);

    void deleteByConversationIdAndUserId(UUID conversationId, UUID userId);
}
