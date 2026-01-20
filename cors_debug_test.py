#!/usr/bin/env python3
"""
CORS Debug Test - Check CORS headers in detail
"""

import requests
import json

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

def test_cors_detailed():
    print(f"Testing CORS at: {API_URL}")
    print("="*60)
    
    # Test with the exact origin from the review request
    origin = "https://spotterscxj.com.br"
    headers = {"Origin": origin}
    
    # Test OPTIONS request
    print(f"\n1. OPTIONS /api/health with Origin: {origin}")
    print("-" * 40)
    
    try:
        response = requests.options(f"{API_URL}/health", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print("Response Headers:")
        for key, value in response.headers.items():
            if "access-control" in key.lower() or "cors" in key.lower():
                print(f"  {key}: {value}")
        
        print("\nAll Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Test GET request
    print(f"\n2. GET /api/health with Origin: {origin}")
    print("-" * 40)
    
    try:
        response = requests.get(f"{API_URL}/health", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print("Response Headers:")
        for key, value in response.headers.items():
            if "access-control" in key.lower() or "cors" in key.lower():
                print(f"  {key}: {value}")
        
        print("\nAll Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
            
    except Exception as e:
        print(f"Error: {e}")
    
    # Test without Origin header
    print(f"\n3. GET /api/health without Origin header")
    print("-" * 40)
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        print(f"Status: {response.status_code}")
        print("Response Headers:")
        for key, value in response.headers.items():
            if "access-control" in key.lower() or "cors" in key.lower():
                print(f"  {key}: {value}")
        
        print("\nAll Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cors_detailed()