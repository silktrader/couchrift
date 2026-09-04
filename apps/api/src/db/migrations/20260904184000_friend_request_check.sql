ALTER TABLE friend_requests
    ADD "CONSTRAINT" chk_friend_requests_not_self CHECK (requesterId <> recipientId);