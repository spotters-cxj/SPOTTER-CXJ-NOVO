#!/usr/bin/env python3
"""
Spotters CXJ Final Validation Test Suite
Tests all critical endpoints as specified in the review request for final validation.
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
        print(f"\n{'='*80}")
        print(f"FINAL VALIDATION SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*80}")
        return self.failed == 0

def test_endpoint_with_cors(endpoint: str, origin: str = "https://spotterscxj.com.br") -> Dict[str, Any]:
    """Test endpoint with CORS headers"""
    url = f"{API_URL}{endpoint}"
    headers = {"Origin": origin}
    
    try:
        # Test OPTIONS request (preflight)
        options_response = requests.options(url, headers=headers, timeout=10)
        
        # Test GET request
        get_response = requests.get(url, headers=headers, timeout=10)
        
        return {
            "options_status": options_response.status_code,
            "options_headers": dict(options_response.headers),
            "get_status": get_response.status_code,
            "get_headers": dict(get_response.headers),
            "get_data": get_response.json() if get_response.headers.get('content-type', '').startswith('application/json') else get_response.text
        }
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response"}

def test_protected_endpoint(endpoint: str) -> Dict[str, Any]:
    """Test protected endpoint (should return 401)"""
    url = f"{API_URL}{endpoint}"
    
    try:
        response = requests.get(url, timeout=10)
        return {
            "status_code": response.status_code,
            "success": response.status_code == 401,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
            "headers": dict(response.headers)
        }
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON response"}

def main():
    result = TestResult()
    
    print(f"🔍 SPOTTERS CXJ FINAL VALIDATION TEST")
    print(f"Testing API at: {API_URL}")
    print(f"{'='*80}")
    
    # 1. CRITICAL ENDPOINTS - All should return 200
    print("\n🎯 1. TESTING CRITICAL ENDPOINTS (All should return 200)")
    print("-" * 60)
    
    critical_endpoints = [
        "/health",
        "/gallery", 
        "/events",
        "/ranking/podium",
        "/ranking/photos",
        "/ranking/users",
        "/ranking/top3",
        "/stats",
        "/settings",
        "/pages/home",
        "/news",
        "/members"
    ]
    
    for endpoint in critical_endpoints:
        try:
            url = f"{API_URL}{endpoint}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                result.success(f"GET {endpoint}", f"Status: 200 ✓")
            else:
                result.failure(f"GET {endpoint}", f"Expected 200, got {response.status_code}")
                
        except Exception as e:
            result.failure(f"GET {endpoint}", f"Request failed: {str(e)}")
    
    # 2. CORS TESTING with Origin: https://spotterscxj.com.br
    print("\n🌐 2. TESTING CORS WITH ORIGIN: https://spotterscxj.com.br")
    print("-" * 60)
    
    # Test a few key endpoints for CORS
    cors_test_endpoints = ["/health", "/gallery", "/events", "/settings"]
    
    for endpoint in cors_test_endpoints:
        cors_result = test_endpoint_with_cors(endpoint)
        
        if "error" in cors_result:
            result.failure(f"CORS {endpoint}", f"Request failed: {cors_result['error']}")
            continue
            
        # Check OPTIONS request
        if cors_result["options_status"] == 200:
            options_headers = cors_result["options_headers"]
            if "Access-Control-Allow-Origin" in options_headers:
                result.success(f"OPTIONS {endpoint}", f"CORS headers present: {options_headers.get('Access-Control-Allow-Origin')}")
            else:
                result.failure(f"OPTIONS {endpoint}", "Missing Access-Control-Allow-Origin header")
        else:
            result.failure(f"OPTIONS {endpoint}", f"Expected 200, got {cors_result['options_status']}")
        
        # Check GET request CORS headers
        if cors_result["get_status"] == 200:
            get_headers = cors_result["get_headers"]
            if "Access-Control-Allow-Origin" in get_headers:
                result.success(f"GET {endpoint} CORS", f"CORS headers present: {get_headers.get('Access-Control-Allow-Origin')}")
            else:
                result.failure(f"GET {endpoint} CORS", "Missing Access-Control-Allow-Origin header")
        else:
            result.failure(f"GET {endpoint} CORS", f"Expected 200, got {cors_result['get_status']}")
    
    # 3. CACHE HEADERS VERIFICATION
    print("\n🗄️ 3. TESTING CACHE HEADERS")
    print("-" * 60)
    
    # Test cache headers on a few endpoints
    cache_test_endpoints = ["/health", "/gallery", "/settings"]
    
    for endpoint in cache_test_endpoints:
        try:
            url = f"{API_URL}{endpoint}"
            response = requests.get(url, timeout=10)
            headers = response.headers
            
            # Check for no-cache headers
            cache_control = headers.get("Cache-Control", "")
            pragma = headers.get("Pragma", "")
            
            if "no-cache" in cache_control and "no-store" in cache_control and "must-revalidate" in cache_control:
                result.success(f"Cache-Control {endpoint}", f"Correct cache headers: {cache_control}")
            else:
                result.failure(f"Cache-Control {endpoint}", f"Incorrect cache headers: {cache_control}")
            
            if pragma == "no-cache":
                result.success(f"Pragma {endpoint}", f"Correct pragma header: {pragma}")
            else:
                result.failure(f"Pragma {endpoint}", f"Incorrect pragma header: {pragma}")
                
        except Exception as e:
            result.failure(f"Cache headers {endpoint}", f"Request failed: {str(e)}")
    
    # 4. PROTECTED ENDPOINTS - Should return 401
    print("\n🔒 4. TESTING PROTECTED ENDPOINTS (Should return 401)")
    print("-" * 60)
    
    protected_endpoints = [
        "/notifications",
        "/admin/users"
    ]
    
    for endpoint in protected_endpoints:
        protected_result = test_protected_endpoint(endpoint)
        
        if "error" in protected_result:
            result.failure(f"Protected {endpoint}", f"Request failed: {protected_result['error']}")
            continue
            
        if protected_result["success"]:
            result.success(f"GET {endpoint}", "Correctly returned 401 Unauthorized ✓")
        else:
            result.failure(f"GET {endpoint}", f"Expected 401, got {protected_result['status_code']}")
    
    # 5. ADDITIONAL VALIDATION TESTS
    print("\n🔍 5. ADDITIONAL VALIDATION TESTS")
    print("-" * 60)
    
    # Test API root endpoint
    try:
        response = requests.get(f"{API_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "message" in data and "Spotters CXJ API" in data["message"]:
                result.success("GET /api/", f"API root working: {data['message']}")
            else:
                result.failure("GET /api/", f"Unexpected API root response: {data}")
        else:
            result.failure("GET /api/", f"Expected 200, got {response.status_code}")
    except Exception as e:
        result.failure("GET /api/", f"Request failed: {str(e)}")
    
    # Test ranking endpoints specifically mentioned
    ranking_endpoints = [
        ("/ranking/podium", "podium with winners"),
        ("/ranking/photos", "photo rankings"),
        ("/ranking/users", "user rankings"),
        ("/ranking/top3", "top 3 users")
    ]
    
    for endpoint, description in ranking_endpoints:
        try:
            response = requests.get(f"{API_URL}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                result.success(f"GET {endpoint}", f"Ranking endpoint working: {description}")
            else:
                result.failure(f"GET {endpoint}", f"Expected 200, got {response.status_code}")
        except Exception as e:
            result.failure(f"GET {endpoint}", f"Request failed: {str(e)}")
    
    # Test stats endpoint
    try:
        response = requests.get(f"{API_URL}/stats", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                result.success("GET /stats", f"Stats endpoint working with keys: {list(data.keys())}")
            else:
                result.failure("GET /stats", f"Unexpected stats response format: {type(data)}")
        else:
            result.failure("GET /stats", f"Expected 200, got {response.status_code}")
    except Exception as e:
        result.failure("GET /stats", f"Request failed: {str(e)}")
    
    # 6. COMPREHENSIVE CORS TEST
    print("\n🌍 6. COMPREHENSIVE CORS VALIDATION")
    print("-" * 60)
    
    # Test CORS with the exact origin from the request
    test_origin = "https://spotterscxj.com.br"
    
    try:
        # Test with specific origin
        headers = {"Origin": test_origin}
        response = requests.get(f"{API_URL}/health", headers=headers, timeout=10)
        
        cors_headers = response.headers
        allow_origin = cors_headers.get("Access-Control-Allow-Origin", "")
        allow_credentials = cors_headers.get("Access-Control-Allow-Credentials", "")
        allow_methods = cors_headers.get("Access-Control-Allow-Methods", "")
        
        if allow_origin == test_origin or allow_origin == "*":
            result.success("CORS Origin Check", f"Correct origin header: {allow_origin}")
        else:
            result.failure("CORS Origin Check", f"Incorrect origin header: {allow_origin}")
        
        if allow_credentials.lower() == "true":
            result.success("CORS Credentials", f"Credentials allowed: {allow_credentials}")
        else:
            result.failure("CORS Credentials", f"Credentials not properly set: {allow_credentials}")
        
        if "GET" in allow_methods and "POST" in allow_methods:
            result.success("CORS Methods", f"Required methods allowed: {allow_methods}")
        else:
            result.failure("CORS Methods", f"Missing required methods: {allow_methods}")
            
    except Exception as e:
        result.failure("CORS Comprehensive Test", f"Request failed: {str(e)}")
    
    # Final summary
    success = result.summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Spotters CXJ API is ready for production.")
    else:
        print("\n⚠️  SOME TESTS FAILED! Please review the issues above.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())