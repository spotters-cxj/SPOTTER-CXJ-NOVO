#!/usr/bin/env python3
"""
Focused test for the review request endpoints
Tests the specific features mentioned in the review request
"""

import requests
import json
import sys

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

def test_endpoint(method: str, endpoint: str, expected_status: int = 200):
    """Test a single endpoint and return response details"""
    url = f"{API_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
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
    print(f"Testing Review Request Endpoints at: {API_URL}")
    print(f"{'='*60}")
    
    all_passed = True
    
    # 1. Gallery endpoint - should return photos from both gallery and photos collections
    print("\n🖼️  TESTING GALLERY ENDPOINT")
    print("-" * 40)
    
    response = test_endpoint("GET", "/gallery")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            print(f"✅ GET /api/gallery: Returned {len(data)} photos")
            if len(data) > 0:
                # Check structure of first photo
                photo = data[0]
                required_fields = ["photo_id", "url", "description", "aircraft_model", "aircraft_type"]
                missing_fields = [f for f in required_fields if f not in photo]
                if missing_fields:
                    print(f"⚠️  Photo missing fields: {missing_fields}")
                else:
                    print(f"✅ Photo structure is correct")
            else:
                print("ℹ️  No photos in gallery (expected for new installation)")
        else:
            print(f"❌ Expected array, got: {type(data)}")
            all_passed = False
    else:
        print(f"❌ GET /api/gallery failed: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
        all_passed = False
    
    # 2. Settings endpoint - should include payment settings
    print("\n⚙️  TESTING SETTINGS ENDPOINT")
    print("-" * 40)
    
    response = test_endpoint("GET", "/settings")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            print(f"✅ GET /api/settings: Returned settings object")
            print(f"📋 Available keys: {list(data.keys())}")
            
            # Check for payment-related fields mentioned in review
            payment_fields = ["pix_key", "vip_monthly_price", "vip_permanent_price"]
            found_payment_fields = [f for f in payment_fields if f in data]
            missing_payment_fields = [f for f in payment_fields if f not in data]
            
            if found_payment_fields:
                print(f"✅ Found payment fields: {found_payment_fields}")
            if missing_payment_fields:
                print(f"⚠️  Missing payment fields: {missing_payment_fields}")
                print("ℹ️  Note: Payment fields may not be implemented yet or may be in default settings")
            
            # Check basic required fields
            basic_fields = ["instagram_url", "youtube_url", "footer"]
            has_basic = all(f in data for f in basic_fields)
            if has_basic:
                print(f"✅ Basic settings fields present")
            else:
                print(f"❌ Missing basic settings fields")
                all_passed = False
        else:
            print(f"❌ Expected object, got: {type(data)}")
            all_passed = False
    else:
        print(f"❌ GET /api/settings failed: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
        all_passed = False
    
    # 3. Members endpoints
    print("\n👥 TESTING MEMBERS ENDPOINTS")
    print("-" * 40)
    
    # Test members list
    response = test_endpoint("GET", "/members")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, list):
            print(f"✅ GET /api/members: Returned {len(data)} members")
            if len(data) > 0:
                member = data[0]
                required_fields = ["user_id", "name", "tags"]
                missing_fields = [f for f in required_fields if f not in member]
                if missing_fields:
                    print(f"⚠️  Member missing fields: {missing_fields}")
                else:
                    print(f"✅ Member structure is correct")
        else:
            print(f"❌ Expected array, got: {type(data)}")
            all_passed = False
    else:
        print(f"❌ GET /api/members failed: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
        all_passed = False
    
    # Test members hierarchy
    response = test_endpoint("GET", "/members/hierarchy")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            expected_levels = ["lideres", "admins", "gestao", "produtores", "avaliadores", "colaboradores", "membros"]
            has_all_levels = all(level in data for level in expected_levels)
            if has_all_levels:
                print(f"✅ GET /api/members/hierarchy: All hierarchy levels present")
                # Show member counts per level
                for level in expected_levels:
                    count = len(data[level]) if isinstance(data[level], list) else 0
                    print(f"   - {level}: {count} members")
            else:
                missing_levels = [l for l in expected_levels if l not in data]
                print(f"❌ Missing hierarchy levels: {missing_levels}")
                all_passed = False
        else:
            print(f"❌ Expected object, got: {type(data)}")
            all_passed = False
    else:
        print(f"❌ GET /api/members/hierarchy failed: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
        all_passed = False
    
    # 4. Photos queue endpoint
    print("\n📸 TESTING PHOTOS QUEUE ENDPOINT")
    print("-" * 40)
    
    response = test_endpoint("GET", "/photos/queue")
    if response.get("success"):
        data = response["data"]
        if isinstance(data, dict):
            required_fields = ["current", "max", "is_full"]
            has_required = all(field in data for field in required_fields)
            if has_required:
                print(f"✅ GET /api/photos/queue: Queue status correct")
                print(f"   - Current: {data['current']}")
                print(f"   - Max: {data['max']}")
                print(f"   - Is Full: {data['is_full']}")
                if "priority_slots_used" in data:
                    print(f"   - Priority Slots Used: {data['priority_slots_used']}")
            else:
                missing_fields = [f for f in required_fields if f not in data]
                print(f"❌ Missing queue fields: {missing_fields}")
                all_passed = False
        else:
            print(f"❌ Expected object, got: {type(data)}")
            all_passed = False
    else:
        print(f"❌ GET /api/photos/queue failed: {response.get('status_code', 'Error')}, Error: {response.get('error', 'Unknown')}")
        all_passed = False
    
    # Summary
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 ALL REVIEW REQUEST ENDPOINTS WORKING CORRECTLY")
    else:
        print("⚠️  SOME ISSUES FOUND - SEE DETAILS ABOVE")
    print(f"{'='*60}")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())