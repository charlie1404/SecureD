package com.secured

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewAnimationUtils
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import android.window.SplashScreenView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import kotlin.math.hypot

class SplashModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        var splashScreenView: SplashScreenView? = null
        private var isAnimationComplete = false
        private var isAppReady = false
        private var hidePromise: Promise? = null

        private fun resolvePromise() {
            val promise = hidePromise ?: return
            hidePromise = null
            try {
                promise.resolve(true)
            } catch (_: Exception) {}
        }

        fun onSplashScreenAttached(view: SplashScreenView) {
            splashScreenView = view

            // Check if app is ALREADY ready before starting the animation
            if (isAppReady) {
                // Skip the animation and dismiss immediately to go directly to app
                dismissImmediately(view)
                return
            }

            isAnimationComplete = false

            UiThreadUtil.runOnUiThread {
                startRedWaveExpansion(view)
            }
        }

        private fun startRedWaveExpansion(splashView: SplashScreenView) {
            // Check again in case app became ready before UI thread execution
            if (isAppReady) {
                dismissImmediately(splashView)
                return
            }

            val iconView = splashView.iconView

            // Red overlay directly behind icon
            val redOverlay = View(splashView.context).apply {
                setBackgroundColor(Color.parseColor("#D13347"))
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            }

            // Add behind icon so native icon remains prominent on top
            splashView.addView(redOverlay, 0)

            fun runReveal() {
                if (isAppReady) {
                    dismissImmediately(splashView)
                    return
                }

                val w = splashView.width.toFloat().coerceAtLeast(1f)
                val h = splashView.height.toFloat().coerceAtLeast(1f)

                val centerX = if (iconView != null && iconView.width > 0) {
                    ((iconView.left + iconView.right) / 2)
                } else {
                    (w / 2).toInt()
                }

                val centerY = if (iconView != null && iconView.height > 0) {
                    ((iconView.top + iconView.bottom) / 2)
                } else {
                    (h / 2).toInt()
                }

                val startRadius = if (iconView != null && iconView.width > 0) {
                    (iconView.width / 2).toFloat()
                } else {
                    60f
                }

                val finalRadius = hypot(w.toDouble(), h.toDouble()).toFloat()

                try {
                    val anim = ViewAnimationUtils.createCircularReveal(
                        redOverlay,
                        centerX,
                        centerY,
                        startRadius,
                        finalRadius
                    ).apply {
                        duration = 400
                        interpolator = AccelerateDecelerateInterpolator()
                    }

                    anim.addListener(object : AnimatorListenerAdapter() {
                        override fun onAnimationEnd(animation: Animator) {
                            isAnimationComplete = true
                            checkAndDismissIfReady()
                        }
                    })

                    anim.start()
                } catch (e: Exception) {
                    isAnimationComplete = true
                    checkAndDismissIfReady()
                }
            }

            if (splashView.isLaidOut) {
                runReveal()
            } else {
                splashView.post { runReveal() }
            }
        }

        private fun checkAndDismissIfReady() {
            // Only dismiss when BOTH animation is complete AND app is ready
            if (isAnimationComplete && isAppReady) {
                val view = splashScreenView
                if (view == null) {
                    resolvePromise()
                    return
                }

                view.animate()
                    .alpha(0f)
                    .setDuration(160)
                    .withEndAction {
                        try {
                            view.remove()
                        } catch (_: Exception) {}
                        splashScreenView = null
                        resolvePromise()
                    }
                    .start()
            }
        }

        fun dismissImmediately(view: SplashScreenView? = splashScreenView) {
            UiThreadUtil.runOnUiThread {
                val targetView = view ?: splashScreenView
                if (targetView != null) {
                    targetView.animate()
                        .alpha(0f)
                        .setDuration(100)
                        .withEndAction {
                            try {
                                targetView.remove()
                            } catch (_: Exception) {}
                            if (splashScreenView == targetView) {
                                splashScreenView = null
                            }
                            resolvePromise()
                        }
                        .start()
                } else {
                    resolvePromise()
                }
            }
        }
    }

    override fun getName(): String = "SplashModule"

    @ReactMethod
    fun hide(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            isAppReady = true
            hidePromise = promise

            // Fallback timeout in case splashScreenView is never attached
            Handler(Looper.getMainLooper()).postDelayed({
                if (splashScreenView == null) {
                    resolvePromise()
                }
            }, 1000)

            checkAndDismissIfReady()
        }
    }
}
