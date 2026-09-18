import urllib.request
import json
import subprocess
import os
import zipfile

print('=' * 60)
print('🚀 STARTING COMPREHENSIVE END-TO-END VALIDATION SUITE')
print('=' * 60)

# 1. VALIDATE APK BINARY & MANIFEST
apk_path = '/home/frklstn/Levi/FinanceApp/FinanceApp-Flutter-arm64.apk'
assert os.path.exists(apk_path), 'APK file not found on disk'
apk_size_mb = os.path.getsize(apk_path) / (1024 * 1024)
print(f'[APK] Path: {apk_path} ({apk_size_mb:.2f} MB)')

badging = subprocess.check_output(['aapt', 'dump', 'badging', apk_path]).decode('utf-8', errors='ignore')
assert "name='com.financeapp.mobile'" in badging, 'Wrong package name in APK'
assert "application-label:'FinanceApp'" in badging, 'Wrong application label in APK'
assert "launchable-activity: name='com.financeapp.mobile.MainActivity'" in badging, 'Missing launchable activity'
assert "native-code: 'arm64-v8a'" in badging, 'Missing arm64 architecture'
print('  ✅ [APK] Package Name: com.financeapp.mobile')
print('  ✅ [APK] Application Label: FinanceApp')
print('  ✅ [APK] Launchable Activity: com.financeapp.mobile.MainActivity')
print('  ✅ [APK] Architecture: arm64-v8a')

with zipfile.ZipFile(apk_path, 'r') as z:
    names = z.namelist()
    assert any('libflutter.so' in n for n in names), 'Missing libflutter.so'
    assert any('libapp.so' in n for n in names), 'Missing Flutter Dart AOT libapp.so'
    assert not any('index.android.bundle' in n for n in names), 'Found rogue React Native bundle!'
print('  ✅ [APK] Pure Flutter Dart AOT binary confirmed (Zero React Native code)')

# 2. VALIDATE RUST BACKEND (Port 3006)
base_api = 'http://127.0.0.1:3006/api/v1'

# Test Health
req = urllib.request.Request(f'{base_api}/health')
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    assert data['data']['status'] == 'healthy'
print('  ✅ [API] Health Check: HEALTHY (Axum 0.8 Rust)')

# Test Version
req = urllib.request.Request(f'{base_api}/app/version')
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    assert data['data']['latest_version'] == '1.0.1'
print(f'  ✅ [API] App Version: v{data["data"]["latest_version"]} (Build {data["data"]["build_number"]})')

# Test Email/Password Login
login_body = json.dumps({'identifier': 'ifalfahlevi4@gmail.com', 'password': '19842204'}).encode()
req = urllib.request.Request(f'{base_api}/auth/login', data=login_body, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as res:
    login_res = json.loads(res.read().decode())
    assert login_res['success'] == True
    rust_jwt = login_res['data']['token']
    user_info = login_res['data']['user']
    print(f'  ✅ [API] Password Auth: {user_info["email"]} ({user_info["full_name"]}) -> Plan: {user_info["plan"]}')

# Test Google Auth Endpoint
g_body = json.dumps({'email': 'ifalfahlevi4@gmail.com', 'name': 'FHLLVY'}).encode()
req = urllib.request.Request(f'{base_api}/auth/google', data=g_body, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as res:
    g_res = json.loads(res.read().decode())
    assert g_res['success'] == True
    print('  ✅ [API] Google Direct Endpoint: Token issued successfully')

# Test Profile with Rust JWT
req = urllib.request.Request(f'{base_api}/auth/me', headers={'Authorization': f'Bearer {rust_jwt}'})
with urllib.request.urlopen(req) as res:
    me_res = json.loads(res.read().decode())
    assert me_res['success'] == True
    assert me_res['data']['email'] == 'ifalfahlevi4@gmail.com'
print('  ✅ [API] /auth/me with Rust JWT: Verified (200 OK)')

# Test Dashboard Summary
req = urllib.request.Request(f'{base_api}/dashboard/summary', headers={'Authorization': f'Bearer {rust_jwt}'})
with urllib.request.urlopen(req) as res:
    dash_res = json.loads(res.read().decode())
    assert dash_res['success'] == True
    total_balance = dash_res['data']['total_balance']
print(f'  ✅ [API] /dashboard/summary: Total Balance = Rp {float(total_balance):,.0f}')

# 3. VALIDATE NEXT.JS TOKEN INTEROPERABILITY WITH RUST
env_path = '/home/frklstn/Levi/FinanceApp/webapp/.env.local'
secret = ''
with open(env_path) as f:
    for line in f:
        if line.startswith('SESSION_SECRET='):
            secret = line.split('=', 1)[1].strip()

import base64
import hmac
import hashlib
import time

def create_jose_compatible_jwt(user_id, secret_str):
    header = base64.urlsafe_b64encode(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode()).rstrip(b'=').decode()
    payload = base64.urlsafe_b64encode(json.dumps({
        'userId': user_id,
        'sub': user_id,
        'exp': int(time.time()) + 3600 * 24 * 30,
        'iat': int(time.time())
    }).encode()).rstrip(b'=').decode()
    signature = base64.urlsafe_b64encode(hmac.new(secret_str.encode(), f'{header}.{payload}'.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
    return f'{header}.{payload}.{signature}'

oauth_jwt = create_jose_compatible_jwt('4a80b3b1-864a-4510-92bc-43e8554550aa', secret)
req_oauth = urllib.request.Request(f'{base_api}/auth/me', headers={'Authorization': f'Bearer {oauth_jwt}'})
with urllib.request.urlopen(req_oauth) as res:
    oauth_res = json.loads(res.read().decode())
    assert oauth_res['success'] == True
    assert oauth_res['data']['full_name'] == 'FHLLVY'
print('  ✅ [INTEROP] Next.js Google OAuth JWT verified by Rust API (200 OK -> FHLLVY)')

# 4. VALIDATE WEBAPP & SERVICES STATUS
req_web = urllib.request.Request('http://127.0.0.1:3005/auth/mobile-success')
with urllib.request.urlopen(req_web) as res:
    assert res.status == 200
print('  ✅ [WEBAPP] /auth/mobile-success landing page (200 OK)')

print('=' * 60)
print('🎉 ALL 4 LAYERS (APK, RUST API, WEBAPP, INTEROP) PASSED 100%')
print('=' * 60)
