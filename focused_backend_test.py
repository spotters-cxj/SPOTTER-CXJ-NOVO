#!/usr/bin/env python3
"""
Focused Backend Test for Spotters CXJ API
Tests the specific endpoints mentioned in the review request.
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
        elif method.upper() == "OPTIONS":
            response = requests.options(url, headers=headers, timeout=10)
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
    
    # 1. CRITICAL - Basic endpoints that were broken
    print("\n🔥 TESTING CRITICAL ENDPOINTS (Previously Broken)")
    print("-" * 50)
    
    # Test GET /api/ - should return API info with message "Spotters CXJ API"
    response = test_endpoint("GET", "/", description="API root")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and data.get("message") == "Spotters CXJ API":
            result.success("GET /api/", f"✓ Correct message: '{data.get('message')}'")
        else:
            result.failure("GET /api/", f"Expected message 'Spotters CXJ API', got: {data.get('message', 'N/A')}")
    else:
        result.failure("GET /api/", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/health - should return healthy status
    response = test_endpoint("GET", "/health", description="Health check")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and data.get("status") == "healthy":
            result.success("GET /api/health", f"✓ Status: {data.get('status')}")
        else:
            result.failure("GET /api/health", f"Expected status 'healthy', got: {data.get('status', 'N/A')}")
    else:
        result.failure("GET /api/health", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/gallery - should return photos array (may be empty)
    response = test_endpoint("GET", "/gallery", description="Gallery photos")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/gallery", f"✓ Returned array with {len(data)} photos")
        else:
            result.failure("GET /api/gallery", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/gallery", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/ranking/podium - should return {winners: []} structure
    response = test_endpoint("GET", "/ranking/podium", description="Ranking podium")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "winners" in data and isinstance(data["winners"], list):
            result.success("GET /api/ranking/podium", f"✓ Correct structure with {len(data['winners'])} winners")
        else:
            result.failure("GET /api/ranking/podium", f"Expected {{winners: []}} structure, got: {data}")
    else:
        result.failure("GET /api/ranking/podium", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/events - should return empty array
    response = test_endpoint("GET", "/events", description="Events list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/events", f"✓ Returned array with {len(data)} events")
        else:
            result.failure("GET /api/events", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/events", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/settings - should return settings object with instagram_url etc
    response = test_endpoint("GET", "/settings", description="Site settings")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "instagram_url" in data:
            result.success("GET /api/settings", f"✓ Contains instagram_url and {len(data)} other settings")
        else:
            result.failure("GET /api/settings", f"Expected object with instagram_url, got: {list(data.keys()) if isinstance(data, dict) else type(data)}")
    else:
        result.failure("GET /api/settings", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/stats - should return stats object with members, photos, events, years
    response = test_endpoint("GET", "/stats", description="Site stats")
    if response.get("success"):
        data = response["data"]
        expected_keys = ["members", "photos", "events", "years"]
        if isinstance(data, dict) and all(key in data for key in expected_keys):
            result.success("GET /api/stats", f"✓ Contains all expected keys: {expected_keys}")
        else:
            result.failure("GET /api/stats", f"Expected object with {expected_keys}, got: {list(data.keys()) if isinstance(data, dict) else type(data)}")
    else:
        result.failure("GET /api/stats", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/pages/home - should return home page content
    response = test_endpoint("GET", "/pages/home", description="Home page")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict) and "title" in data:
            result.success("GET /api/pages/home", f"✓ Home page: '{data.get('title', 'N/A')}'")
        else:
            result.failure("GET /api/pages/home", f"Expected page object with title, got: {data}")
    else:
        result.failure("GET /api/pages/home", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # 2. CORS HEADERS TEST
    print("\n🌐 TESTING CORS HEADERS")
    print("-" * 50)
    
    # Test OPTIONS request with Origin: https://spotterscxj.com.br
    cors_headers = {
        "Origin": "https://spotterscxj.com.br",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    response = test_endpoint("OPTIONS", "/", headers=cors_headers, description="CORS preflight")
    if response.get("success") or response.get("status_code") == 200:
        headers = response.get("headers", {})
        
        # Check Access-Control-Allow-Origin
        allow_origin = headers.get("access-control-allow-origin", "")
        if "spotterscxj.com.br" in allow_origin or allow_origin == "*":
            result.success("CORS Allow-Origin", f"✓ {allow_origin}")
        else:
            result.failure("CORS Allow-Origin", f"Expected spotterscxj.com.br or *, got: {allow_origin}")
        
        # Check Access-Control-Allow-Credentials
        allow_credentials = headers.get("access-control-allow-credentials", "")
        if allow_credentials.lower() == "true":
            result.success("CORS Allow-Credentials", f"✓ {allow_credentials}")
        else:
            result.failure("CORS Allow-Credentials", f"Expected 'true', got: {allow_credentials}")
        
        # Check Access-Control-Allow-Methods
        allow_methods = headers.get("access-control-allow-methods", "")
        required_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        if all(method in allow_methods.upper() for method in required_methods):
            result.success("CORS Allow-Methods", f"✓ Contains all required methods")
        else:
            result.failure("CORS Allow-Methods", f"Missing methods. Got: {allow_methods}")
    else:
        result.failure("CORS OPTIONS", f"OPTIONS request failed: {response.get('status_code', 'Error')}")
    
    # 3. OTHER PUBLIC ENDPOINTS
    print("\n📋 TESTING OTHER PUBLIC ENDPOINTS")
    print("-" * 50)
    
    # Test GET /api/news - should return array
    response = test_endpoint("GET", "/news", description="News list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/news", f"✓ Returned array with {len(data)} news articles")
        else:
            result.failure("GET /api/news", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/news", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/members - should return array
    response = test_endpoint("GET", "/members", description="Members list")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/members", f"✓ Returned array with {len(data)} members")
        else:
            result.failure("GET /api/members", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/members", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/ranking/users - should return array
    response = test_endpoint("GET", "/ranking/users", description="User ranking")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/ranking/users", f"✓ Returned array with {len(data)} ranked users")
        else:
            result.failure("GET /api/ranking/users", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/ranking/users", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # Test GET /api/ranking/top3 - should return array
    response = test_endpoint("GET", "/ranking/top3", description="Top 3 ranking")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            result.success("GET /api/ranking/top3", f"✓ Returned array with {len(data)} top users")
        else:
            result.failure("GET /api/ranking/top3", f"Expected array, got: {type(data)}")
    else:
        result.failure("GET /api/ranking/top3", f"Status: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
    
    # 4. PROTECTED ENDPOINTS (Should require auth)
    print("\n🔒 TESTING PROTECTED ENDPOINTS (Should return 401)")
    print("-" * 50)
    
    # Test GET /api/notifications - should return 401
    response = test_endpoint("GET", "/notifications", expected_status=401, description="Notifications without auth")
    if response.get("success"):
        result.success("GET /api/notifications (no auth)", "✓ Correctly returned 401 Unauthorized")
    else:
        result.failure("GET /api/notifications (no auth)", f"Expected 401, got: {response.get('status_code', 'Error')}")
    
    # Test POST /api/photos - should return 401 or 403
    try:
        test_file_content = b"fake image content"
        files = {'file': ('test.jpg', test_file_content, 'image/jpeg')}
        form_data = {
            'title': 'Test Photo',
            'description': 'Test description',
            'aircraft_model': 'Boeing 737',
            'aircraft_type': 'Boeing',
            'photo_date': '2024-01-01'
        }
        
        response = requests.post(f"{API_URL}/photos", data=form_data, files=files, timeout=10)
        
        if response.status_code in [401, 403]:
            result.success("POST /api/photos (no auth)", f"✓ Correctly returned {response.status_code}")
        else:
            result.failure("POST /api/photos (no auth)", f"Expected 401/403, got: {response.status_code}")
            
    except Exception as e:
        result.failure("POST /api/photos (no auth)", f"Error testing photo upload: {str(e)}")
    
    # Final summary
    success = result.summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())