package com.chat.Backend.service;

import com.chat.Backend.dto.request.EditMessageRequest;
import com.chat.Backend.dto.request.MarkReadRequest;
import com.chat.Backend.dto.request.SendMessageRequest;
import com.chat.Backend.dto.response.MessagePageResponse;
import com.chat.Backend.dto.response.MessageResponse;
import com.chat.Backend.entity.Conversation;
import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.ConversationType;
import com.chat.Backend.entity.MemberRole;
import com.chat.Backend.entity.Message;
import com.chat.Backend.entity.MessageStatus;
import com.chat.Backend.entity.MessageType;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.BadRequestException;
import com.chat.Backend.exception.ForbiddenException;
import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.repository.ConversationRepository;
import com.chat.Backend.repository.MessageAttachmentRepository;
import com.chat.Backend.repository.MessageRepository;
import com.chat.Backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    MessageRepository messages;
    @Mock
    ConversationRepository conversations;
    @Mock
    ConversationMemberRepository members;
    @Mock
    UserRepository users;
    @Mock
    MessageAttachmentRepository attachments;
    @Mock
    ConversationService conversationsSvc;
    @Mock
    PresenceService presence;
    @Spy
    RateLimitService rateLimits = new RateLimitService();

    @InjectMocks
    MessageService service;

    private User user(String name) {
        return User.builder().id(UUID.randomUUID()).googleId("g-" + name + "-" + UUID.randomUUID())
                .email(name + UUID.randomUUID() + "@x.y").name(name).build();
    }

    private Conversation conv() {
        return Conversation.builder().id(UUID.randomUUID()).type(ConversationType.ONE_TO_ONE).build();
    }

    private Message msg(Conversation c, User sender, String content, Instant at) {
        Message m = Message.builder().id(UUID.randomUUID()).conversation(c).sender(sender)
                .content(content).messageType(MessageType.TEXT).status(MessageStatus.SENT).build();
        m.setCreatedAt(at);
        return m;
    }

    private MessageResponse dto(Message m) {
        return new MessageResponse(m.getId(), m.getConversation().getId(),
                m.getSender() == null ? null : m.getSender().getId(),
                m.getSender() == null ? null : m.getSender().getName(),
                m.getContent(), m.getMessageType(), m.getStatus(), null,
                List.of(), false, null, m.getCreatedAt());
    }

    @Test
    void historyIsNewestFirstWithCursor() {
        User me = user("me");
        Conversation c = conv();
        ConversationMember self = ConversationMember.builder()
                .conversation(c).user(me).role(MemberRole.MEMBER).build();
        Message newer = msg(c, me, "new", Instant.parse("2026-01-02T00:00:00Z"));
        Message older = msg(c, me, "old", Instant.parse("2026-01-01T00:00:00Z"));

        when(members.findByConversationIdAndUserId(c.getId(), me.getId()))
                .thenReturn(Optional.of(self));
        when(messages.findByConversationIdOrderByCreatedAtDescIdDesc(eq(c.getId()), any(Pageable.class)))
                .thenReturn(List.of(newer, older));
        when(conversationsSvc.toMessageDto(newer)).thenReturn(dto(newer));
        when(conversationsSvc.toMessageDto(older)).thenReturn(dto(older));

        MessagePageResponse page = service.history(me.getId(), c.getId(), null, 30);
        assertThat(page.messages()).extracting(MessageResponse::content).containsExactly("new", "old");
        assertThat(page.hasMore()).isFalse();
        assertThat(page.nextCursor()).isEqualTo("2026-01-01T00:00:00Z");
    }

    @Test
    void historyRejectsNonMember() {
        UUID conv = UUID.randomUUID();
        UUID me = UUID.randomUUID();
        when(members.findByConversationIdAndUserId(conv, me)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.history(me, conv, null, 30))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void systemMessagesCannotBeSent() {
        User me = user("me");
        Conversation c = conv();
        when(conversations.findById(c.getId())).thenReturn(Optional.of(c));
        when(members.findByConversationIdAndUserId(c.getId(), me.getId()))
                .thenReturn(Optional.of(ConversationMember.builder()
                        .conversation(c).user(me).role(MemberRole.MEMBER).build()));
        when(users.findById(me.getId())).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> service.send(me.getId(), c.getId(),
                new SendMessageRequest("x", MessageType.SYSTEM, null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void emptyTextIsRejected() {
        User me = user("me");
        Conversation c = conv();
        when(conversations.findById(c.getId())).thenReturn(Optional.of(c));
        when(members.findByConversationIdAndUserId(c.getId(), me.getId()))
                .thenReturn(Optional.of(ConversationMember.builder()
                        .conversation(c).user(me).role(MemberRole.MEMBER).build()));
        when(users.findById(me.getId())).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> service.send(me.getId(), c.getId(),
                new SendMessageRequest("  ", MessageType.TEXT, null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void cannotEditOthersMessage() {
        User me = user("me");
        User other = user("other");
        Conversation c = conv();
        Message m = msg(c, other, "hi", Instant.now());
        when(messages.findById(m.getId())).thenReturn(Optional.of(m));
        when(members.findByConversationIdAndUserId(c.getId(), me.getId()))
                .thenReturn(Optional.of(ConversationMember.builder()
                        .conversation(c).user(me).role(MemberRole.MEMBER).build()));

        assertThatThrownBy(() -> service.edit(me.getId(), m.getId(), new EditMessageRequest("hacked")))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void markReadUpdatesReceiptAndBroadcasts() {
        User me = user("me");
        User other = user("other");
        Conversation c = conv();
        ConversationMember self = ConversationMember.builder()
                .conversation(c).user(me).role(MemberRole.MEMBER).build();
        Message target = msg(c, other, "hello", Instant.parse("2026-01-01T00:00:00Z"));

        when(members.findByConversationIdAndUserId(c.getId(), me.getId())).thenReturn(Optional.of(self));
        when(messages.findById(target.getId())).thenReturn(Optional.of(target));

        service.markRead(me.getId(), c.getId(), new MarkReadRequest(target.getId()));

        assertThat(self.getLastReadMessageId()).isEqualTo(target.getId());
        verify(messages).markReadUpTo(eq(c.getId()), eq(target.getCreatedAt()), eq(me.getId()));
        verify(members).save(self);
        verify(presence).sendToConversation(eq(c.getId()), any());
    }
}
