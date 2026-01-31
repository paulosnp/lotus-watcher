package com.pricewatcher.api.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public EmailService(org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String code) {
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("noreply@lotuswatcher.com");
            message.setTo(to);
            message.setSubject("Código de Verificação - Lotus Watcher");
            message.setText("Olá! \n\nSeu código de verificação é: " + code
                    + "\n\nInsira este código no site para ativar sua conta.");

            mailSender.send(message);
            System.out.println("📧 [EmailService] Email enviado com sucesso para: " + to);
        } catch (Exception e) {
            System.err.println("❌ [EmailService] Erro ao enviar email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
