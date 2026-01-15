"""
Email notification service for Spotters CXJ
Uses Gmail SMTP for sending notifications and weekly reports
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', 'spotterscxj@gmail.com')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'spotterscxj@gmail.com')

def send_email(subject: str, body: str, to_email: str = None) -> bool:
    """Send email notification via SMTP"""
    if not SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured - email not sent")
        return False
    
    to_email = to_email or NOTIFICATION_EMAIL
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"Spotters CXJ <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
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
                .success {{ background-color: #059669; color: white; padding: 10px 20px; border-radius: 5px; margin: 20px 0; }}
                .stat-box {{ background-color: #1a3a5c; padding: 15px; border-radius: 8px; margin: 10px 0; text-align: center; }}
                .stat-value {{ font-size: 32px; font-weight: bold; color: #38bdf8; }}
                .stat-label {{ font-size: 12px; color: #9ca3af; text-transform: uppercase; }}
                .stats-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #1a3a5c; }}
                th {{ color: #9ca3af; font-size: 12px; text-transform: uppercase; }}
                td {{ color: #ffffff; }}
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
        
        msg.attach(MIMEText(html_body, 'html'))
        
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
    <pre style="background-color: #1a3a5c; padding: 15px; border-radius: 5px; overflow-x: auto; color: #f87171;">
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
    """Send notification when backup succeeds"""
    subject = "✅ [Spotters CXJ] Backup Realizado"
    
    body = f"""
    <div class="success">
        <strong>✅ Backup {backup_type.title()} Realizado com Sucesso</strong>
    </div>
    
    <p>O backup {backup_type} do sistema Spotters CXJ foi concluído.</p>
    
    <h3>Detalhes:</h3>
    <ul>
        <li><strong>Arquivo:</strong> {backup_name}</li>
        <li><strong>Local:</strong> {backup_location}</li>
        <li><strong>Data:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</li>
    </ul>
    """
    
    return send_email(subject, body)

def send_weekly_report(stats: dict):
    """Send weekly statistics report"""
    subject = "📊 [Spotters CXJ] Relatório Semanal"
    
    # Format date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    date_range = f"{start_date.strftime('%d/%m')} - {end_date.strftime('%d/%m/%Y')}"
    
    # Build stats HTML
    body = f"""
    <div class="info">
        <strong>📊 Relatório Semanal de Estatísticas</strong>
        <div style="font-size: 14px; margin-top: 5px;">{date_range}</div>
    </div>
    
    <h3>Resumo da Semana</h3>
    
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-value">{stats.get('new_users', 0)}</div>
            <div class="stat-label">Novos Usuários</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{stats.get('new_photos', 0)}</div>
            <div class="stat-label">Novas Fotos</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{stats.get('photos_approved', 0)}</div>
            <div class="stat-label">Fotos Aprovadas</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">{stats.get('photos_rejected', 0)}</div>
            <div class="stat-label">Fotos Recusadas</div>
        </div>
    </div>
    
    <h3>Totais Atuais</h3>
    <table>
        <tr>
            <td>👥 Total de Membros</td>
            <td style="text-align: right; font-weight: bold;">{stats.get('total_users', 0)}</td>
        </tr>
        <tr>
            <td>📷 Total de Fotos</td>
            <td style="text-align: right; font-weight: bold;">{stats.get('total_photos', 0)}</td>
        </tr>
        <tr>
            <td>⏳ Fotos Pendentes</td>
            <td style="text-align: right; font-weight: bold; color: #fbbf24;">{stats.get('pending_photos', 0)}</td>
        </tr>
        <tr>
            <td>👤 Usuários Pendentes</td>
            <td style="text-align: right; font-weight: bold; color: #fbbf24;">{stats.get('pending_users', 0)}</td>
        </tr>
        <tr>
            <td>📰 Notícias Publicadas</td>
            <td style="text-align: right; font-weight: bold;">{stats.get('total_news', 0)}</td>
        </tr>
    </table>
    
    <h3>Top Colaboradores da Semana</h3>
    """
    
    # Add top contributors
    top_contributors = stats.get('top_contributors', [])
    if top_contributors:
        body += "<table>"
        body += "<tr><th>Posição</th><th>Nome</th><th>Fotos</th></tr>"
        for i, contrib in enumerate(top_contributors[:5], 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
            body += f"<tr><td>{medal}</td><td>{contrib.get('name', 'N/A')}</td><td>{contrib.get('count', 0)}</td></tr>"
        body += "</table>"
    else:
        body += "<p style='color: #9ca3af;'>Nenhum upload esta semana</p>"
    
    # Backup status
    body += f"""
    <h3>Status dos Backups</h3>
    <table>
        <tr>
            <td>💾 Backups Locais</td>
            <td style="text-align: right;">{stats.get('local_backups', 0)} arquivos</td>
        </tr>
        <tr>
            <td>📅 Último Backup</td>
            <td style="text-align: right;">{stats.get('last_backup', 'N/A')}</td>
        </tr>
    </table>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #1a3a5c; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #38bdf8;">Acesse o painel administrativo para mais detalhes</p>
    </div>
    """
    
    return send_email(subject, body)

def send_test_email():
    """Send a test email to verify configuration"""
    subject = "🧪 [Spotters CXJ] Teste de Notificação"
    
    body = """
    <div class="success">
        <strong>🧪 Email de Teste</strong>
    </div>
    
    <p>Este é um email de teste do sistema de notificações do Spotters CXJ.</p>
    
    <p>Se você recebeu este email, as notificações estão configuradas corretamente!</p>
    
    <h3>Funcionalidades de Email Ativas:</h3>
    <ul>
        <li>✅ Alertas de falha de backup</li>
        <li>✅ Relatório semanal de estatísticas</li>
        <li>✅ Notificações do sistema</li>
    </ul>
    """
    
    return send_email(subject, body)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Testing email notification...")
    result = send_test_email()
    print(f"Result: {'Success' if result else 'Failed'}")
