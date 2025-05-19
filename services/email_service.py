from postmarker.core import PostmarkClient
from config import get_settings
import logging
from fastapi import HTTPException
from typing import Optional

settings = get_settings()

postmark = PostmarkClient(server_token=settings.postmark_api_key)

MISSED_CALL_EMAIL_TEMPLATE = """Hi {name},

This is Prim. I tried reaching out to you just now but wasn't able to connect. I wanted to make sure everything is okay and see if there's a better time we could chat.

Whenever you're free, just email me back and I'll call you right away.

Here to support you,
Prim
Professional Patient Advocate
"""

BETA_SIGNUP_EMAIL_TEMPLATE = """Hi {name},

I hope you're having a great day! This is Prim, and I wanted to personally thank you for your interest in my healthcare assistance service. I'm currently in the final stages of development, working hard to ensure I can provide the best possible support for your healthcare journey.

I'm reaching out because I'm putting together a select group of early users for my beta testing phase. I'd love to have you join this group if you're interested! As a beta user, you'll be among the first to experience my service and help shape its development.

Would you be interested in joining the beta cohort? Just reply to this email to let me know. No pressure either way - I'm just excited to connect with people who are interested in improving their healthcare experience!

Looking forward to hearing from you!

Warm regards,
Prim
Your Future Healthcare Assistant
"""

async def send_missed_call_email(
    to_email: str,
    name: Optional[str] = None,
    subject: str = "Missed or Failed Call from Prim"
) -> bool:
    """
    Send a follow-up email after a missed call attempt.
    
    Args:
        to_email: The recipient's email address
        name: The recipient's name (optional)
        subject: The email subject line (optional)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
        
    Raises:
        HTTPException: If there's an error sending the email
    """
    try:
        # Format the email body with the recipient's name or a generic greeting
        greeting_name = name.split()[0] if name else "there"
        body = MISSED_CALL_EMAIL_TEMPLATE.format(name=greeting_name)

        # Send email using Postmark
        postmark.emails.send(
            From=settings.email_from,
            To=to_email,
            Subject=subject,
            TextBody=body
        )
            
        logging.info(f"Successfully sent missed call email to {to_email}")
        return True

    except Exception as e:
        logging.error(f"Failed to send missed call email to {to_email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

async def send_beta_signup_email(
    to_email: str,
    name: Optional[str] = None,
    subject: str = "Prim's Beta Testing Group"
) -> bool:
    """
    Send a follow-up email to users who have signed up, inviting them to join the beta testing group.
    
    Args:
        to_email: The recipient's email address
        name: The recipient's name (optional)
        subject: The email subject line (optional)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
        
    Raises:
        HTTPException: If there's an error sending the email
    """
    try:
        # Format the email body with the recipient's name or a generic greeting
        greeting_name = name.split()[0] if name else "there"
        body = BETA_SIGNUP_EMAIL_TEMPLATE.format(name=greeting_name)

        # Send email using Postmark
        postmark.emails.send(
            From=settings.email_from,
            To=to_email,
            Subject=subject,
            TextBody=body
        )
            
        logging.info(f"Successfully sent beta signup email to {to_email}")
        return True

    except Exception as e:
        logging.error(f"Failed to send beta signup email to {to_email}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )
