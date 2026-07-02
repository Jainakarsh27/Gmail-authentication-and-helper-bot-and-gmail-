package com.mailsense.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailMessageDTO {
    private String id;
    private String from;
    private String subject;
    private String bodySnippet;
    private Long internalDate;
}
