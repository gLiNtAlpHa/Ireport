from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from fastapi import BackgroundTasks
from typing import List
from .config import settings
import logging

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_email(
    subject: str,
    recipients: List[str],
    body: str,
    html_body: str = ""
):
    """Send email using FastMail"""
    try:
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=body,
            html=html_body, # type: ignore
            subtype="html" if html_body else "plain"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        logging.info(f"Email sent successfully to {recipients}")
        
    except Exception as e:
        logging.error(f"Failed to send email: {str(e)}")
        raise

async def send_verification_email(email: str, token: str):
    """Send email verification"""
    verification_url = f"http://localhost:3000/verify-email?token={token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                <h1 style="color: #6366f1; text-align: center;">Welcome to Student iReport!</h1>
                
                <p>Thank you for registering with Student iReport. To complete your registration, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #6366f1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">{verification_url}</p>
                
                <p>This verification link will expire in 24 hours.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                
                <p style="color: #64748b; font-size: 14px;">
                    If you didn't create an account with Student iReport, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    await send_email(
        subject="Verify Your Email - Student iReport",
        recipients=[email],
        body=f"Please verify your email by visiting: {verification_url}",
        html_body=html_content
    )

async def send_password_reset_email(email: str, token: str):
    """Send password reset email"""
    reset_url = f"http://localhost:3000/reset-password?token={token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                <h1 style="color: #6366f1; text-align: center;">Password Reset Request</h1>
                
                <p>You've requested to reset your password for your Student iReport account. Click the button below to set a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #ef4444; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6366f1;">{reset_url}</p>
                
                <p>This reset link will expire in 1 hour for security reasons.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                
                <p style="color: #64748b; font-size: 14px;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
            </div>
        </body>
    </html>
    """
    
    await send_email(
        subject="Reset Your Password - Student iReport",
        recipients=[email],
        body=f"Reset your password by visiting: {reset_url}",
        html_body=html_content
    )

async def send_incident_notification(email: str, incident_title: str, action: str):
    """Send incident-related notification"""
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                <h1 style="color: #6366f1; text-align: center;">Incident Update</h1>
                
                <p>There's been an update on your incident report:</p>
                
                <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin: 0; color: #1e293b;">"{incident_title}"</h3>
                    <p style="margin: 10px 0 0 0; color: #64748b;">Action: {action}</p>
                </div>
                
                <p>Log in to Student iReport to view the full details.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3000" 
                       style="background-color: #6366f1; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Details
                    </a>
                </div>
            </div>
        </body>
    </html>
    """
    
    await send_email(
        subject=f"Incident Update: {incident_title}",
        recipients=[email],
        body=f"Your incident '{incident_title}' has been {action}",
        html_body=html_content
    )