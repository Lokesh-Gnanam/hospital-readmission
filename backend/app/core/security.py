import hashlib
import hmac
import secrets

# Standard iteration count for PBKDF2 with SHA-256
PBKDF2_ITERATIONS = 100000

def hash_password(password: str) -> str:
    """
    Securely hash a password using standard library hashlib PBKDF2-HMAC-SHA256
    with a cryptographically secure 16-byte random salt.
    
    Returns salt and hash formatted as 'salt_hex$hash_hex'.
    """
    if not password:
        raise ValueError("Password cannot be empty")
        
    salt = secrets.token_bytes(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt,
        PBKDF2_ITERATIONS
    )
    return f"{salt.hex()}${pw_hash.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a raw password string against stored 'salt_hex$hash_hex' string
    using constant-time comparison to prevent timing attacks.
    """
    if not password or not hashed_password or '$' not in hashed_password:
        return False
        
    try:
        salt_hex, stored_hash_hex = hashed_password.split('$', 1)
        salt = bytes.fromhex(salt_hex)
        stored_hash = bytes.fromhex(stored_hash_hex)
        
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            PBKDF2_ITERATIONS
        )
        return hmac.compare_digest(computed_hash, stored_hash)
    except (ValueError, TypeError):
        return False
