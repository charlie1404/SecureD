package com.secured

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.hardware.biometrics.BiometricManager
import android.hardware.biometrics.BiometricManager.Authenticators
import android.hardware.biometrics.BiometricPrompt
import android.os.CancellationSignal
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.bridge.*
import java.security.KeyStore
import java.util.concurrent.Executor
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class BiometricModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val PREFS_NAME = "secured_keystore_prefs"
    private val KEY_ALIAS = "SecuredVaultHardwareKey"
    private val ANDROID_KEYSTORE = "AndroidKeyStore"
    private var cancellationSignal: CancellationSignal? = null

    override fun getName(): String = "BiometricModule"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val keyguardManager =
                reactContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            val isDeviceSecure = keyguardManager?.isDeviceSecure ?: false

            val biometricManager =
                reactContext.getSystemService(Context.BIOMETRIC_SERVICE) as? BiometricManager
            val canBiometric = biometricManager?.canAuthenticate(Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS

            val result = Arguments.createMap()
            result.putBoolean("available", canBiometric || isDeviceSecure)
            result.putBoolean("hasBiometrics", canBiometric)
            result.putBoolean("isDeviceSecure", isDeviceSecure)
            result.putString(
                "biometryType",
                when {
                    canBiometric -> "Biometrics"
                    isDeviceSecure -> "DeviceCredential"
                    else -> "None"
                }
            )
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("BIOMETRIC_CHECK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun authenticate(options: ReadableMap, promise: Promise) {
        val title = if (options.hasKey("title")) options.getString("title") ?: "Unlock SecureD" else "Unlock SecureD"
        val subtitle = if (options.hasKey("subtitle")) options.getString("subtitle") ?: "" else ""
        val description = if (options.hasKey("description")) options.getString("description") ?: "" else ""

        UiThreadUtil.runOnUiThread {
            val activity: Activity? = reactContext.currentActivity
            if (activity == null) {
                promise.reject("ACTIVITY_NOT_FOUND", "Current activity is null")
                return@runOnUiThread
            }

            try {
                cancellationSignal?.cancel()
                val signal = CancellationSignal()
                cancellationSignal = signal

                val context: Context = activity
                val builder = BiometricPrompt.Builder(context)
                    .setTitle(title)

                if (subtitle.isNotEmpty()) {
                    builder.setSubtitle(subtitle)
                }
                if (description.isNotEmpty()) {
                    builder.setDescription(description)
                }

                val mainExecutor = Executor { command -> activity.runOnUiThread(command) }

                builder.setAllowedAuthenticators(
                    Authenticators.BIOMETRIC_STRONG or Authenticators.DEVICE_CREDENTIAL
                )

                val prompt = builder.build()

                prompt.authenticate(
                    signal,
                    mainExecutor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult?) {
                            super.onAuthenticationSucceeded(result)
                            val res = Arguments.createMap()
                            res.putBoolean("success", true)
                            promise.resolve(res)
                        }

                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence?) {
                            super.onAuthenticationError(errorCode, errString)
                            val res = Arguments.createMap()
                            res.putBoolean("success", false)
                            res.putString("error", errString?.toString() ?: "Authentication error: $errorCode")
                            res.putInt("errorCode", errorCode)
                            promise.resolve(res)
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                        }
                    }
                )
            } catch (e: Exception) {
                val res = Arguments.createMap()
                res.putBoolean("success", false)
                res.putString("error", e.message ?: "Authentication exception")
                promise.resolve(res)
            }
        }
    }

    @ReactMethod
    fun cancelAuthentication(promise: Promise) {
        try {
            cancellationSignal?.cancel()
            cancellationSignal = null
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }

    // --- Android KeyStore Secure Secret Management ---

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)

            var generatedKey: SecretKey? = null
            try {
                val strongBoxBuilder = KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .setIsStrongBoxBacked(true)
                keyGenerator.init(strongBoxBuilder.build())
                generatedKey = keyGenerator.generateKey()
            } catch (e: Exception) {
                // Dedicated StrongBox chip not present on this hardware SoC, fallback to hardware TEE
            }

            if (generatedKey == null) {
                val teeBuilder = KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                keyGenerator.init(teeBuilder.build())
                generatedKey = keyGenerator.generateKey()
            }

            return generatedKey
        }

        return keyStore.getKey(KEY_ALIAS, null) as SecretKey
    }

    @ReactMethod
    fun storeSecret(key: String, secret: String, promise: Promise) {
        try {
            val secretKey = getOrCreateSecretKey()
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            val iv = cipher.iv
            val encryptedBytes = cipher.doFinal(secret.toByteArray(Charsets.UTF_8))

            val ivB64 = Base64.encodeToString(iv, Base64.NO_WRAP)
            val cipherB64 = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
            val payload = "$ivB64:$cipherB64"

            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(key, payload).apply()

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STORE_SECRET_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun getSecret(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val payload = prefs.getString(key, null)
            if (payload == null) {
                promise.resolve(null)
                return
            }

            val parts = payload.split(":")
            if (parts.size != 2) {
                promise.resolve(null)
                return
            }

            val iv = Base64.decode(parts[0], Base64.NO_WRAP)
            val cipherBytes = Base64.decode(parts[1], Base64.NO_WRAP)

            val secretKey = getOrCreateSecretKey()
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val spec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)

            val plainBytes = cipher.doFinal(cipherBytes)
            val secret = String(plainBytes, Charsets.UTF_8)
            promise.resolve(secret)
        } catch (e: Exception) {
            promise.reject("GET_SECRET_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun deleteSecret(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().remove(key).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DELETE_SECRET_FAILED", e.message, e)
        }
    }
}
