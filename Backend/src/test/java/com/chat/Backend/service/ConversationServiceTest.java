package com.chat.Backend.service;

import com.chat.Backend.dto.response.ConversationResponse;
import com.chat.Backend.dto.response.MemberResponse;
import com.chat.Backend.entity.Conversation;
import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.ConversationType;
import com.chat.Backend.entity.MemberRole;
import com.chat.Backend.entity.User;
import com.chat.Backend.exception.ForbiddenException;
import com.chat.Backend.mapper.ChatMapper;
import com.chat.Backend.repository.ConversationMemberRepository;
import com.chat.Backend.repository.ConversationRepository;
import com.chat.Backend.repository.MessageAttachmentRepository;
import com.chat.Backend.repository.MessageRepository;
import com.chat.Backend.repository.UserRepository;
import com.chat.Backend.dto.request.CreateDirectRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    ConversationRepository conversations;
    @Mock
    ConversationMemberRepository members;
    @Mock
    UserRepository users;
    @Mock
    MessageRepository messages;
    @Mock
    MessageAttachmentRepository attachments;
    @Mock
    ChatMapper chatMapper;

    @InjectMocks
    ConversationService service;

    private User user(String name) {
        return User.builder().id(UUID.randomUUID()).googleId("g-" + name)
                .email(name + "@x.y").name(name).build();
    }

    @Test
    void nonMemberIsForbidden() {
        UUID conv = UUID.randomUUID();
        UUID user = UUID.randomUUID();
        when(members.findByConversationIdAndUserId(conv, user)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.requireMember(conv, user)).isInstanceOf(ForbiddenException.class);
    }

    @Test
    void directKeyIsOrderIndependent() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        assertThat(Conversation.directKeyFor(a, b)).isEqualTo(Conversation.directKeyFor(b, a));
    }

    @Test
    void directChatIsReusedNeverDuplicated() {
        User caller = user("caller");
        User other = user("other");
        Conversation existing = Conversation.builder()
                .id(UUID.randomUUID()).type(ConversationType.ONE_TO_ONE)
                .directKey(Conversation.directKeyFor(caller.getId(), other.getId()))
                .createdBy(caller).build();

        when(users.findById(caller.getId())).thenReturn(Optional.of(caller));
        when(users.findById(other.getId())).thenReturn(Optional.of(other));
        when(conversations.findByDirectKey(any())).thenReturn(Optional.of(existing));
        when(conversations.findById(existing.getId())).thenReturn(Optional.of(existing));

        ConversationMember m1 = ConversationMember.builder()
                .conversation(existing).user(caller).role(MemberRole.MEMBER).build();
        ConversationMember m2 = ConversationMember.builder()
                .conversation(existing).user(other).role(MemberRole.MEMBER).build();
        when(members.findByConversationId(existing.getId())).thenReturn(List.of(m1, m2));
        when(members.findByConversationIdAndUserId(existing.getId(), caller.getId()))
                .thenReturn(Optional.of(m1));
        when(messages.findFirstByConversationIdOrderByCreatedAtDescIdDesc(existing.getId()))
                .thenReturn(Optional.empty());
        when(messages.countUnreadNoCursor(existing.getId(), caller.getId())).thenReturn(0L);
        when(chatMapper.toMemberResponse(any())).thenAnswer(inv -> {
            ConversationMember m = inv.getArgument(0);
            return new MemberResponse(m.getUser().getId(), m.getUser().getName(),
                    m.getUser().getEmail(), m.getUser().getEmail(), null, m.getRole(), false);
        });

        ConversationResponse r = service.createDirect(caller.getId(), new CreateDirectRequest(other.getId()));
        assertThat(r.id()).isEqualTo(existing.getId());
        verify(conversations, never()).save(any());
    }
}
