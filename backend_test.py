#!/usr/bin/env python3
"""
Spotters CXJ Backend API Test Suite
Tests all public and protected endpoints as specified in the review request.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

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

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def success(self, test_name: str, message: str = ""):
        self.passed += 1
        print(f"✅ {test_name}: {message}")
        
    def failure(self, test_name: str, message: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {message}")
        print(f"❌ {test_name}: {message}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def test_endpoint(method: str, endpoint: str, expected_status: int = 200, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None,
                 description: str = "") -> Dict[str, Any]:
    """Test a single endpoint and return response details"""
    url = f"{API_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            return {"error": f"Unsupported method: {method}"}
            
        return {
            "status_code": response.status_code,
            "success": response.status_code == expected_status,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "headers": dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response"}

def main():
    result = TestResult()
    
    print(f"Testing Spotters CXJ Backend API at: {API_URL}")
    print(f"{'='*60}")
    
    # 1. PUBLIC ENDPOINTS TESTS
    print("\n🔓 TESTING PUBLIC ENDPOINTS")
    print("-" * 40)
    
    # Test root endpoint
    response = test_endpoint("GET", "/", description="API info")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "message" in data:
            result.success("GET /api/", f"Returned: {data.get('message', 'N/A')}")
        else:
            result.failure("GET /api/", f"Unexpected response format: {data}")
    else:
        result.failure("GET /api/", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test health endpoint
    response = test_endpoint("GET", "/health", description="Health check")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and data.get("status") == "healthy":
            result.success("GET /api/health", "Service is healthy")
        else:
            result.failure("GET /api/health", f"Unexpected health status: {data}")
    else:
        result.failure("GET /api/health", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test gallery endpoint
    response = test_endpoint("GET", "/gallery", description="Gallery photos")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/gallery", f"Returned {len(data)} photos")
        else:
            result.failure("GET /api/gallery", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/gallery", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test gallery types endpoint
    response = test_endpoint("GET", "/gallery/types", description="Aircraft types")
    if response.get("success"):
        data = response["data"]
        expected_types = ["Airbus", "Boeing", "Embraer", "ATR", "Aviação Geral"]
        if isinstance(data, list) and all(t in expected_types for t in data):
            result.success("GET /api/gallery/types", f"Returned aircraft types: {data}")
        else:
            result.failure("GET /api/gallery/types", f"Unexpected types: {data}")
    else:
        result.failure("GET /api/gallery/types", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test leaders endpoint
    response = test_endpoint("GET", "/leaders", description="Leaders list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/leaders", f"Returned {len(data)} leaders")
        else:
            result.failure("GET /api/leaders", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/leaders", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test memories endpoint
    response = test_endpoint("GET", "/memories", description="Memories list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/memories", f"Returned {len(data)} memories")
        else:
            result.failure("GET /api/memories", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/memories", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test settings endpoint
    response = test_endpoint("GET", "/settings", description="Site settings")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            expected_keys = ["instagram_url", "youtube_url", "footer"]
            has_expected = any(key in data for key in expected_keys)
            if has_expected:
                result.success("GET /api/settings", f"Returned settings with keys: {list(data.keys())}")
            else:
                result.failure("GET /api/settings", f"Missing expected keys. Got: {list(data.keys())}")
        else:
            result.failure("GET /api/settings", f"Expected object, got: {type(data)}")
    else:
        result.failure("GET /api/settings", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test home page endpoint
    response = test_endpoint("GET", "/pages/home", description="Home page content")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "title" in data:
            result.success("GET /api/pages/home", f"Returned page: {data.get('title', 'N/A')}")
        else:
            result.failure("GET /api/pages/home", f"Unexpected page format: {data}")
    else:
        result.failure("GET /api/pages/home", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test news endpoint
    response = test_endpoint("GET", "/news", description="News list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/news", f"Returned {len(data)} news articles")
        else:
            result.failure("GET /api/news", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/news", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test members endpoint
    response = test_endpoint("GET", "/members", description="Members list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/members", f"Returned {len(data)} members")
        else:
            result.failure("GET /api/members", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/members", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test members hierarchy endpoint
    response = test_endpoint("GET", "/members/hierarchy", description="Members hierarchy")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            expected_keys = ["lideres", "admins", "gestao", "produtores", "avaliadores", "colaboradores", "membros"]
            has_expected = all(key in data for key in expected_keys)
            if has_expected:
                result.success("GET /api/members/hierarchy", f"Returned hierarchy with all expected levels")
            else:
                result.failure("GET /api/members/hierarchy", f"Missing expected hierarchy levels. Got: {list(data.keys())}")
        else:
            result.failure("GET /api/members/hierarchy", f"Expected object, got: {type(data)}")
    else:
        result.failure("GET /api/members/hierarchy", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test ranking endpoint
    response = test_endpoint("GET", "/ranking", description="Photo ranking")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/ranking", f"Returned {len(data)} ranked photos")
        else:
            result.failure("GET /api/ranking", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/ranking", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test user ranking endpoint
    response = test_endpoint("GET", "/ranking/users", description="User ranking")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/ranking/users", f"Returned {len(data)} ranked users")
        else:
            result.failure("GET /api/ranking/users", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/ranking/users", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test podium endpoint
    response = test_endpoint("GET", "/ranking/podium", description="Top 3 users podium")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "winners" in data:
            winners = data["winners"]
            if isinstance(winners, list):
                result.success("GET /api/ranking/podium", f"Returned podium with {len(winners)} winners")
            else:
                result.failure("GET /api/ranking/podium", f"Winners should be array, got: {type(winners)}")
        else:
            result.failure("GET /api/ranking/podium", f"Expected object with 'winners' key, got: {data}")
    else:
        result.failure("GET /api/ranking/podium", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test photos queue endpoint
    response = test_endpoint("GET", "/photos/queue", description="Photos queue status")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            expected_keys = ["current", "max", "is_full"]
            has_expected = all(key in data for key in expected_keys)
            if has_expected:
                result.success("GET /api/photos/queue", f"Queue status: {data.get('current', 0)}/{data.get('max', 0)}")
            else:
                result.failure("GET /api/photos/queue", f"Missing expected keys. Got: {list(data.keys())}")
        else:
            result.failure("GET /api/photos/queue", f"Expected object, got: {type(data)}")
    else:
        result.failure("GET /api/photos/queue", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # 2. AUTH FLOW TESTS
    print("\n🔐 TESTING AUTH FLOW")
    print("-" * 40)
    
    # Test /auth/me without authentication (should return 401)
    response = test_endpoint("GET", "/auth/me", expected_status=401, description="Auth check without token")
    if response.get("success"):
        result.success("GET /api/auth/me (no auth)", "Correctly returned 401 Unauthorized")
    else:
        result.failure("GET /api/auth/me (no auth)", f"Expected 401, got: {response.get('status_code', 'Error')}")
    
    # Test /auth/session with invalid session_id (should return 401)
    response = test_endpoint("POST", "/auth/session", expected_status=401, 
                           data={"session_id": "invalid_session_123"}, 
                           description="Session creation with invalid ID")
    if response.get("success"):
        result.success("POST /api/auth/session (invalid)", "Correctly returned 401 for invalid session")
    else:
        result.failure("POST /api/auth/session (invalid)", f"Expected 401, got: {response.get('status_code', 'Error')}")
    
    # Test logout endpoint (should work even without auth)
    response = test_endpoint("POST", "/auth/logout", description="Logout")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "message" in data:
            result.success("POST /api/auth/logout", f"Logout successful: {data.get('message')}")
        else:
            result.failure("POST /api/auth/logout", f"Unexpected response: {data}")
    else:
        result.failure("POST /api/auth/logout", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # 3. PROTECTED ENDPOINTS TESTS (should all return 401)
    print("\n🔒 TESTING PROTECTED ENDPOINTS (Should return 401)")
    print("-" * 40)
    
    protected_endpoints = [
        ("GET", "/admin/users", "Admin users list"),
        ("PUT", "/admin/users/test123/role", "Update user role", {"role": "contributor"}),
        ("POST", "/leaders", "Create leader", {"name": "Test Leader", "role": "Test Role"}),
        ("PUT", "/settings", "Update settings", {"instagram_url": "https://test.com"}),
        # Note: POST /gallery requires multipart form data with file upload, so we'll test it separately
    ]
    
    for method, endpoint, description, *data in protected_endpoints:
        payload = data[0] if data else None
        response = test_endpoint(method, endpoint, expected_status=401, data=payload, description=description)
        if response.get("success"):
            result.success(f"{method} {endpoint}", "Correctly returned 401 Unauthorized")
        else:
            result.failure(f"{method} {endpoint}", f"Expected 401, got: {response.get('status_code', 'Error')}")
    
    # 4. ADDITIONAL ENDPOINT TESTS
    print("\n📋 TESTING ADDITIONAL ENDPOINTS")
    print("-" * 40)
    
    # Test pages list endpoint
    response = test_endpoint("GET", "/pages", description="Pages list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/pages", f"Returned {len(data)} pages")
        else:
            result.failure("GET /api/pages", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/pages", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test non-existent photo endpoint (should return 404)
    response = test_endpoint("GET", "/gallery/nonexistent123", expected_status=404, description="Non-existent photo")
    if response.get("success"):
        result.success("GET /api/gallery/nonexistent123", "Correctly returned 404 for non-existent photo")
    else:
        result.failure("GET /api/gallery/nonexistent123", f"Expected 404, got: {response.get('status_code', 'Error')}")
    
    # Test non-existent page endpoint (should return 404)
    response = test_endpoint("GET", "/pages/nonexistent", expected_status=404, description="Non-existent page")
    if response.get("success"):
        result.success("GET /api/pages/nonexistent", "Correctly returned 404 for non-existent page")
    else:
        result.failure("GET /api/pages/nonexistent", f"Expected 404, got: {response.get('status_code', 'Error')}")
    
    # Test gallery upload endpoint separately (requires multipart form data)
    print("\n📤 TESTING GALLERY UPLOAD (Multipart Form)")
    print("-" * 40)
    
    try:
        # Create a test file
        test_file_content = b"fake image content"
        files = {'file': ('test.jpg', test_file_content, 'image/jpeg')}
        form_data = {
            'description': 'Test photo',
            'aircraft_model': 'Boeing 737',
            'aircraft_type': 'Boeing',
            'date': '2024-01-01'
        }
        
        response = requests.post(f"{API_URL}/gallery", data=form_data, files=files, timeout=10)
        
        if response.status_code == 401:
            result.success("POST /api/gallery (multipart)", "Correctly returned 401 Unauthorized")
        elif response.status_code == 403:
            result.success("POST /api/gallery (multipart)", "Correctly returned 403 Forbidden (user not approved)")
        else:
            result.failure("POST /api/gallery (multipart)", f"Expected 401/403, got: {response.status_code}")
            
    except Exception as e:
        result.failure("POST /api/gallery (multipart)", f"Error testing multipart upload: {str(e)}")
    
    # Final summary
    success = result.summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())