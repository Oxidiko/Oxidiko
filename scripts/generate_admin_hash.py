import sys
import getpass

try:
    from argon2 import PasswordHasher
except ImportError:
    print("Error: argon2-cffi not found.")
    print("Please install it using: pip install argon2-cffi")
    sys.exit(1)

def generate_hash():
    print("--- Oxidiko Admin Hash Generator ---")
    username = input("Enter admin username: ")
    password = getpass.getpass("Enter admin password: ")
    
    ph = PasswordHasher()
    # The TypeScript code combines username and password: const combinedString = username + password
    combined_string = username + password
    
    hashed = ph.hash(combined_string)
    
    print("\nGenerated Hash for NEXT_PUBLIC_ADMIN_HASH:")
    print("-" * 40)
    print(hashed)
    print("-" * 40)
    print("\nCopy the value above into your .env file.")

if __name__ == "__main__":
    generate_hash()
