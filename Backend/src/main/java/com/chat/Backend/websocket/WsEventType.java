package com.chat.Backend.websocket;

/** Event names sent over STOMP, shared by REST broadcasters and WS handlers. */
public final class WsEventType {
    public static final String MESSAGE_NEW = "MESSAGE_NEW";
    public static final String MESSAGE_EDITED = "MESSAGE_EDITED";
    public static final String MESSAGE_DELETED = "MESSAGE_DELETED";
    public static final String MESSAGE_READ = "MESSAGE_READ";
    public static final String TYPING = "TYPING";
    public static final String USER_ONLINE = "USER_ONLINE";
    public static final String USER_OFFLINE = "USER_OFFLINE";
    public static final String GROUP_UPDATED = "GROUP_UPDATED";
    public static final String MEMBER_ADDED = "MEMBER_ADDED";
    public static final String MEMBER_REMOVED = "MEMBER_REMOVED";

    private WsEventType() {
    }
}
