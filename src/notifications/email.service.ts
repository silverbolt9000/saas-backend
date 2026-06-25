import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Enviar email de alerta de vencimento de documento
   */
  async sendDocumentExpiringAlert(
    email: string,
    documentTitle: string,
    daysToExpire: number,
    expiresAt: Date,
  ): Promise<void> {
    const payload: EmailPayload = {
      to: email,
      subject: `Alerta: Documento "${documentTitle}" vencendo em ${daysToExpire} dias`,
      template: 'document-expiring',
      data: {
        documentTitle,
        daysToExpire,
        expiresAt: expiresAt.toLocaleDateString('pt-BR'),
        actionUrl: `${this.configService.get('FRONTEND_URL')}/documents-list`,
      },
    };

    await this.send(payload);
  }

  /**
   * Enviar email genérico
   * TODO: Integrar com SendGrid ou AWS SES
   */
  private async send(payload: EmailPayload): Promise<void> {
    try {
      this.logger.log(`Enviando email para ${payload.to}: ${payload.subject}`);

      // TODO: Implementar envio real via SendGrid/SES
      // const response = await this.sendgridClient.send({
      //   to: payload.to,
      //   from: this.configService.get('SENDGRID_FROM_EMAIL'),
      //   subject: payload.subject,
      //   html: this.renderTemplate(payload.template, payload.data),
      // });

      // Por enquanto, apenas logar
      this.logger.log(`Email enviado com sucesso para ${payload.to}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${payload.to}:`, error);
      throw error;
    }
  }

  /**
   * Renderizar template de email
   * TODO: Implementar com Handlebars ou similar
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    // Placeholder: retornar HTML simples
    return `
      <h2>${data.documentTitle}</h2>
      <p>Este documento vence em ${data.daysToExpire} dias (${data.expiresAt}).</p>
      <p><a href="${data.actionUrl}">Visualizar Documentos</a></p>
    `;
  }
}
