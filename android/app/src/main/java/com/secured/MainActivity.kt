package com.secured

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "SecureD"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)

    // Production security: Prevent screenshots, screen recording, and task-switcher caching
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )

    // Start expanding red wave immediately while app loads data in parallel
    splashScreen.setOnExitAnimationListener { splashScreenView ->
      SplashModule.onSplashScreenAttached(splashScreenView)

      // Safety fallback: if JS fails to signal within 4.5 seconds, dismiss gracefully
      Handler(Looper.getMainLooper()).postDelayed({
        if (SplashModule.splashScreenView != null) {
          SplashModule.dismissImmediately()
        }
      }, 4500)
    }
  }
}

