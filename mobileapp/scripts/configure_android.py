import os, re

# 1. Manifest
manifest_path = 'android/app/src/main/AndroidManifest.xml'
if os.path.exists(manifest_path):
    content = open(manifest_path).read()
    # Set proper App Label
    content = re.sub(r'android:label="[^"]*"', 'android:label="FinanceApp"', content)

    # Inject permissions and queries
    perms = '''    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="http" />
        </intent>
    </queries>'''
    if 'REQUEST_INSTALL_PACKAGES' not in content:
        content = content.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android">', '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n' + perms)

    # Inject Deep Link
    intent_filter = '''                <intent-filter>
                    <action android:name="android.intent.action.VIEW" />
                    <category android:name="android.intent.category.DEFAULT" />
                    <category android:name="android.intent.category.BROWSABLE" />
                    <data android:scheme="finapp" android:host="auth" />
                </intent-filter>
                <intent-filter>
                    <action android:name="android.intent.action.VIEW" />
                    <category android:name="android.intent.category.DEFAULT" />
                    <category android:name="android.intent.category.BROWSABLE" />
                    <data android:scheme="financeapp" android:host="auth" />
                </intent-filter>'''
    if 'finapp' not in content:
        content = content.replace('</activity>', intent_filter + '\n            </activity>')

    open(manifest_path, 'w').write(content)
    print('Manifest updated.')

# 2. Signing & Package Name in build.gradle
gradle_path = 'android/app/build.gradle'
if os.path.exists(gradle_path):
    content = open(gradle_path).read()
    
    # Set explicit Clean Package Name: com.financeapp.mobile
    content = re.sub(r'applicationId\s+(=?\s*)"[^"]*"', r'applicationId \1"com.financeapp.mobile"', content)
    content = re.sub(r'namespace\s+(=?\s*)"[^"]*"', r'namespace \1"com.financeapp.mobile"', content)

    signing_header = '''def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
'''
    if 'keystoreProperties' not in content:
        content = signing_header + '\n' + content
        content = content.replace('signingConfigs {', "signingConfigs {\n        release {\n            keyAlias keystoreProperties['keyAlias']\n            keyPassword keystoreProperties['keyPassword']\n            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null\n            storePassword keystoreProperties['storePassword']\n        }")
        content = content.replace('signingConfig = signingConfigs.debug', 'signingConfig = signingConfigs.release')
        open(gradle_path, 'w').write(content)
        print('build.gradle signing & package name updated.')
