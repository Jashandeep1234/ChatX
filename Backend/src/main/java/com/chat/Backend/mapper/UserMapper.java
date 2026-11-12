package com.chat.Backend.mapper;

import com.chat.Backend.dto.response.UserResponse;
import com.chat.Backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "avatarUrl", source = "avatarUrl")
    @Mapping(target = "online", source = "online")
    UserResponse toResponse(User user);
}
