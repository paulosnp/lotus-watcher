package com.pricewatcher.api.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {

    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public EmailService(org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @org.springframework.scheduling.annotation.Async
    public void sendVerificationEmail(String to, String code) {
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("noreply@lotuswatcher.com");
            message.setTo(to);
            message.setSubject("Código de Verificação - Lotus Watcher");
            message.setText("Olá! \n\nSeu código de verificação é: " + code
                    + "\n\nInsira este código no site para ativar sua conta.");

            mailSender.send(message);
            log.info("📧 [EmailService] Verificação enviada para: {}", to);
        } catch (Exception e) {
            log.error("❌ [EmailService] Erro ao enviar email: {}", e.getMessage());
            e.printStackTrace();
        }
    }

    @org.springframework.scheduling.annotation.Async
    public void sendPriceAlert(String to, String cardName, Double currentPrice, Double targetPrice) {
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("alertas@lotuswatcher.com");
            message.setTo(to);
            message.setSubject("📉 Alerta de Preço: " + cardName + " caiu!");
            message.setText("Boas notícias! \n\n"
                    + "A carta '" + cardName + "' atingiu seu preço alvo.\n"
                    + "Preço Atual: $" + String.format("%.2f", currentPrice) + "\n"
                    + "Seu Alvo: $" + String.format("%.2f", targetPrice) + "\n\n"
                    + "Acesse o Lotus Watcher agora para conferir!");

            mailSender.send(message);
            log.info("📧 [EmailService] Alerta de preço enviado para: {}", to);
        } catch (Exception e) {
            log.error("❌ [EmailService] Erro ao enviar alerta: {}", e.getMessage());
        }
    }
}
