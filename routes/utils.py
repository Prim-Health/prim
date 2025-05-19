import re

def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_phone(phone: str) -> bool:
    # Remove any non-digit characters and +1 prefix if present
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('1'):
        digits = digits[1:]  # Remove the 1 prefix
    # Check if it's a valid length (10 digits for US numbers)
    return len(digits) == 10