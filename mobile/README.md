# 📱 FinanceApp Mobile — Flutter WebView Wrapper

Aplikasi mobile wrapper untuk **FinanceApp** yang membungkus web app Next.js (di-deploy di Vercel) menggunakan Flutter WebView. Siap untuk release di GitHub dan Google Play Store.

---

## ✨ Fitur Aplikasi Mobile

| Fitur | Deskripsi |
|---|---|
| 🌐 **WebView Full-Screen** | Memuat seluruh web app FinanceApp di dalam native container |
| 🎨 **Splash Screen Premium** | Animasi fade-out dengan ikon gradient dan loading indicator |
| 📊 **Progress Bar** | Indikator loading linear di bagian atas layar |
| 🔄 **Pull-to-Refresh** | Tarik layar ke bawah untuk memuat ulang halaman |
| ◀️ **Back Navigation** | Tombol back Android menavigasi riwayat WebView |
| 📡 **Offline Fallback** | Halaman error koneksi dengan pesan kontekstual & tombol retry |
| ⏱️ **Timeout Handling** | Timeout 30 detik dengan pesan ramah pengguna |
| 🔁 **Retry Strategy** | 3x retry → fresh reload otomatis |
| 🔒 **Domain Lock** | Whitelist domain: hanya FinanceApp, Supabase, Vercel |
| 🔗 **External URL Safety** | Link eksternal dibuka di browser sistem (bukan WebView) |
| 🛡️ **Security** | Blokir javascript: scheme, redirect berbahaya, dan intent asing |

---

## 🛠️ Prasyarat

- **Flutter SDK** versi 3.11+ ([install](https://docs.flutter.dev/get-started/install))
- **Android SDK** (via Android Studio atau CLI)
- **Java JDK 17** (direkomendasikan Adoptium Temurin)
- Perangkat Android / Emulator dengan API 23+ (Android 6.0+)

---

## 🚀 Quick Start

```bash
# 1. Masuk ke folder mobile
cd mobile

# 2. Install dependensi
flutter pub get

# 3. Jalankan di emulator / perangkat
flutter run

# 4. Cek kualitas kode
flutter analyze
```

---

## 📦 Build Release

### Build APK (Instalasi Langsung)

```bash
flutter build apk --release
```

📍 Lokasi output: `build/app/outputs/flutter-apk/app-release.apk`

### Build AAB (Google Play Store)

```bash
flutter build appbundle --release
```

📍 Lokasi output: `build/app/outputs/bundle/release/app-release.aab`

---

## 🔐 Panduan Signing untuk Release

> ⚠️ **PENTING**: Jangan pernah commit file keystore (`.jks`, `.keystore`) atau `key.properties` ke Git!

### Langkah 1: Generate Keystore

```bash
keytool -genkey -v \
  -keystore ~/financeapp-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias financeapp
```

Simpan password yang Anda masukkan — Anda akan membutuhkannya.

### Langkah 2: Buat `key.properties`

Buat file `android/key.properties` (file ini sudah ada di `.gitignore`):

```properties
storePassword=PASSWORD_ANDA
keyPassword=PASSWORD_ANDA
keyAlias=financeapp
storeFile=/path/to/financeapp-release.jks
```

### Langkah 3: Konfigurasi `build.gradle.kts`

Edit `android/app/build.gradle.kts`, uncomment signing config:

```kotlin
// Di dalam android { } block, tambahkan:
signingConfigs {
    create("release") {
        val keystoreProperties = java.util.Properties()
        keystoreProperties.load(
            java.io.FileInputStream(rootProject.file("key.properties"))
        )
        keyAlias = keystoreProperties["keyAlias"] as String
        keyPassword = keystoreProperties["keyPassword"] as String
        storeFile = file(keystoreProperties["storeFile"] as String)
        storePassword = keystoreProperties["storePassword"] as String
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release") // ← ganti ini
        isMinifyEnabled = true
        isShrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### Langkah 4: Build Signed APK

```bash
flutter build apk --release
flutter build appbundle --release
```

---

## 🔄 GitHub Actions (CI/CD)

Workflow otomatis tersedia di `.github/workflows/android-release.yml`:

| Trigger | Aksi |
|---|---|
| Push ke `main` | Build APK + AAB, upload artifacts |
| Push tag `v*` | Build + Buat GitHub Release otomatis dengan APK/AAB |
| Pull Request | Build + Analyze (validasi) |

### Cara Trigger Release Otomatis:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions akan otomatis membuat Release dengan APK dan AAB yang bisa didownload.

---

## 📤 Deploy ke GitHub

### Inisialisasi & Push Pertama Kali

```bash
# Dari root project FinanceApp
git init
git add .
git commit -m "🚀 FinanceApp mobile release v1.0.0"
git branch -M main
git remote add origin https://github.com/frklstn/FinanceApp.git
git push -u origin main
```

### Tag & Release

```bash
# Buat version tag
git tag v1.0.0
git push origin v1.0.0
```

### Update Berikutnya

```bash
git add .
git commit -m "pesan commit"
git push
```

---

## 📋 Membuat GitHub Release Manual

1. Buka **https://github.com/frklstn/FinanceApp/releases/new**
2. Pilih tag: `v1.0.0`
3. Release title: `FinanceApp v1.0.0`
4. Deskripsi: tulis changelog
5. Upload file:
   - `app-release.apk` (instalasi langsung)
   - `app-release.aab` (Google Play Store)
6. Klik **Publish release**

---

## ⚙️ Konfigurasi URL

Untuk mengubah URL target, edit di `lib/main.dart`:

```dart
const String kAppUrl = 'https://frklstn.vercel.app';
const String kAppDomain = 'frklstn.vercel.app';
```

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---|---|
| **White screen / loading lama** | Timeout otomatis 30 detik → tampil error page dengan retry |
| **APK terlalu besar** | R8/ProGuard sudah aktif. Cek `isMinifyEnabled = true` di build.gradle |
| **External link tidak bisa dibuka** | Pastikan `url_launcher` terinstall dan AndroidManifest memiliki query intent |
| **Error sertifikat SSL** | Domain harus HTTPS. Periksa sertifikat Vercel |
| **Build gagal: minSdk** | Pastikan `minSdk = 23` di `build.gradle.kts` |
| **flutter analyze error** | Jalankan `flutter pub get` terlebih dahulu |
| **Gradle download lambat** | Normal untuk build pertama. Build berikutnya lebih cepat (cache) |

---

## 📁 Struktur File

```
mobile/
├── lib/
│   └── main.dart                    # Entry point + WebView wrapper
├── android/
│   └── app/
│       ├── src/main/
│       │   └── AndroidManifest.xml  # Izin Internet & konfigurasi
│       ├── build.gradle.kts         # Build config + R8 optimization
│       └── proguard-rules.pro       # ProGuard rules
├── test/
│   └── widget_test.dart             # Widget tests
├── pubspec.yaml                     # Dependensi Flutter
├── .gitignore                       # Git ignore (aman untuk publish)
└── README.md                        # Dokumentasi ini
```

---

## 📄 Lisensi

FinanceApp © 2026 frklstn. All rights reserved.
