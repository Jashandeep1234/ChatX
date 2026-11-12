package com.chat.Backend.mapper;

import com.chat.Backend.dto.response.AttachmentResponse;
import com.chat.Backend.dto.response.MemberResponse;
import com.chat.Backend.dto.response.MessageResponse;
import com.chat.Backend.entity.ConversationMember;
import com.chat.Backend.entity.Message;
import com.chat.Backend.entity.MessageAttachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "name", source = "user.name")
    @Mapping(target = "username", source = "user.username")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "avatarUrl", source = "user.avatarUrl")
    @Mapping(target = "online", source = "user.online")
    MemberResponse toMemberResponse(ConversationMember member);

    @Mapping(target = "conversationId", source = "conversation.id")
    @Mapping(target = "senderId", source = "sender.id")
    @Mapping(target = "senderName", source = "sender.name")
    @Mapping(target = "replyToId", source = "replyTo.id")
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "deleted", source = "deleted")
    MessageResponse toMessageResponse(Message message);

    AttachmentResponse toAttachmentResponse(MessageAttachment attachment);
}
