"""
Email notification service for Spotters CXJ
Uses Gmail SMTP for sending notifications
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', 'spotterscxj@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')  # Gmail App Password
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'spotterscxj@gmail.com')

def send_email(subject: str, body: str, to_email: str = None) -> bool:
    """
    Send email notification via SMTP
    
    Args:
        subject: Email subject
        body: Email body (HTML supported)
        to_email: Recipient email (defaults to NOTIFICATION_EMAIL)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured - email not sent")
        return False
    
    to_email = to_email or NOTIFICATION_EMAIL
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"Spotters CXJ <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        # Create HTML body
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #0a1929; color: #ffffff; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: #102a43; border-radius: 10px; padding: 30px; }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #38bdf8; }}
                .content {{ line-height: 1.6; }}
                .footer {{ margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }}
                .alert {{ background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }}
                .info {{ background-color: #0284c7; color: white; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">✈️ SPOTTERS CXJ</div>
                </div>
                <div class="content">
                    {body}
                </div>
                <div class="footer">
                    <p>Este é um email automático do sistema Spotters CXJ.</p>
                    <p>Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML
        msg.attach(MIMEText(html_body, 'html'))
        
        # Connect and send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_backup_failure_notification(error_message: str, backup_type: str = "automático"):
    """Send notification when backup fails"""
    subject = "⚠️ [Spotters CXJ] Falha no Backup"
    
    body = f"""
    <div class="alert">
        <strong>⚠️ ALERTA: Falha no Backup {backup_type.title()}</strong>
    </div>
    
    <p>O backup {backup_type} do sistema Spotters CXJ falhou.</p>
    
    <h3>Detalhes do Erro:</h3>
    <pre style="background-color: #1a3a5c; padding: 15px; border-radius: 5px; overflow-x: auto;">
{error_message}
    </pre>
    
    <h3>Ações Recomendadas:</h3>
    <ul>
        <li>Verifique as credenciais do Google Drive</li>
        <li>Verifique se há espaço disponível no servidor</li>
        <li>Acesse o painel administrativo para fazer um backup manual</li>
    </ul>
    
    <p><strong>Nota:</strong> O backup local no servidor pode ter sido salvo mesmo com a falha do Google Drive.</p>
    """
    
    return send_email(subject, body)

def send_backup_success_notification(backup_name: str, backup_location: str, backup_type: str = "automático"):
    """Send notification when backup succeeds (optional)"""
    subject = "✅ [Spotters CXJ] Backup Realizado"
    
    body = f"""
    <div class="info">
        <strong>✅ Backup {backup_type.title()} Realizado com Sucesso</strong>
    </div>
    
    <p>O backup {backup_type} do sistema Spotters CXJ foi concluído com sucesso.</p>
    
    <h3>Detalhes:</h3>
    <ul>
        <li><strong>Arquivo:</strong> {backup_name}</li>
        <li><strong>Local:</strong> {backup_location}</li>
        <li><strong>Data:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</li>
    </ul>
    """
    
    return send_email(subject, body)

def send_test_email():
    """Send a test email to verify configuration"""
    subject = "🧪 [Spotters CXJ] Teste de Notificação"
    
    body = """
    <div class="info">
        <strong>🧪 Email de Teste</strong>
    </div>
    
    <p>Este é um email de teste do sistema de notificações do Spotters CXJ.</p>
    
    <p>Se você recebeu este email, as notificações estão configuradas corretamente!</p>
    """
    
    return send_email(subject, body)

# Test when run directly
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Testing email notification...")
    result = send_test_email()
    print(f"Result: {'Success' if result else 'Failed'}")
