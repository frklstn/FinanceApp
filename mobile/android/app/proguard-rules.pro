# FinanceApp ProGuard Rules
# ─────────────────────────────────────────────────────────────

# Flutter WebView - keep WebView classes
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.plugin.** { *; }

# WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String);
}

# url_launcher
-keep class androidx.browser.** { *; }

# Keep annotations
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable

# Prevent stripping of important metadata
-dontwarn kotlin.**
-dontwarn kotlinx.**
