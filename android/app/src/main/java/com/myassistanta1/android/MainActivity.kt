package com.myassistanta1.android

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val appUrl = "https://sangfa727-sketch.github.io/MyassistantA1/"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webViewClient = WebViewClient()
            addJavascriptInterface(A1NativeBridge(), "A1Native")
            loadUrl(appUrl)
        }

        setContentView(webView)
    }

    private inner class A1NativeBridge {
        @JavascriptInterface
        fun enableFloatingCompanion() {
            runOnUiThread {
                if (!Settings.canDrawOverlays(this@MainActivity)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                    startActivity(intent)
                    Toast.makeText(
                        this@MainActivity,
                        "Allow A1 to appear over other apps, then return to A1.",
                        Toast.LENGTH_LONG
                    ).show()
                    return@runOnUiThread
                }
                startService(Intent(this@MainActivity, A1OverlayService::class.java))
            }
        }

        @JavascriptInterface
        fun disableFloatingCompanion() {
            stopService(Intent(this@MainActivity, A1OverlayService::class.java))
        }

        @JavascriptInterface
        fun isFloatingCompanionAllowed(): Boolean =
            Settings.canDrawOverlays(this@MainActivity)
    }
}
