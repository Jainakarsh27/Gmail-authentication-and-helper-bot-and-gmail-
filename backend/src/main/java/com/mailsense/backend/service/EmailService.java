package com.mailsense.backend.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.mailsense.backend.dto.EmailMessageDTO;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.List;

@Service
public class EmailService {

    private static final String APPLICATION_NAME = "MailSense AI";

    public List<EmailMessageDTO> fetchRecentEmails(OAuth2AuthorizedClient authorizedClient) throws GeneralSecurityException, IOException {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();

        Gmail service = new Gmail.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                null)
                .setApplicationName(APPLICATION_NAME)
                .setHttpRequestInitializer(request -> request.getHeaders().setAuthorization("Bearer " + accessToken))
                .build();

        ListMessagesResponse response = service.users().messages().list("me").setMaxResults(10L).execute();
        List<Message> messages = response.getMessages();
        List<EmailMessageDTO> emailMessages = new ArrayList<>();

        if (messages != null) {
            for (Message message : messages) {
                Message fullMessage = service.users().messages().get("me", message.getId()).execute();
                emailMessages.add(mapToDTO(fullMessage));
            }
        }

        return emailMessages;
    }

    private EmailMessageDTO mapToDTO(Message message) {
        String from = "";
        String subject = "";
        List<MessagePartHeader> headers = message.getPayload().getHeaders();
        for (MessagePartHeader header : headers) {
            if ("From".equalsIgnoreCase(header.getName())) {
                from = header.getValue();
            } else if ("Subject".equalsIgnoreCase(header.getName())) {
                subject = header.getValue();
            }
        }

        return EmailMessageDTO.builder()
                .id(message.getId())
                .from(from)
                .subject(subject)
                .bodySnippet(message.getSnippet())
                .internalDate(message.getInternalDate())
                .build();
    }

    public void sendEmailViaGmail(OAuth2AuthorizedClient authorizedClient, String to, String subject, String body) throws Exception {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();

        Gmail service = new Gmail.Builder(
                com.google.api.client.googleapis.javanet.GoogleNetHttpTransport.newTrustedTransport(),
                com.google.api.client.json.gson.GsonFactory.getDefaultInstance(),
                null)
                .setApplicationName(APPLICATION_NAME)
                .setHttpRequestInitializer(request -> request.getHeaders().setAuthorization("Bearer " + accessToken))
                .build();

        jakarta.mail.Session session = jakarta.mail.Session.getDefaultInstance(new java.util.Properties(), null);
        jakarta.mail.internet.MimeMessage email = new jakarta.mail.internet.MimeMessage(session);

        email.setFrom(new jakarta.mail.internet.InternetAddress("me"));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new jakarta.mail.internet.InternetAddress(to));
        email.setSubject(subject);
        email.setText(body);

        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        email.writeTo(buffer);
        byte[] rawMessageBytes = buffer.toByteArray();
        String encodedEmail = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawMessageBytes);

        Message message = new Message();
        message.setRaw(encodedEmail);

        service.users().messages().send("me", message).execute();
    }
}
