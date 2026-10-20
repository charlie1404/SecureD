package com.secured

import com.facebook.react.bridge.*
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

class CryptoModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val secureRandom = SecureRandom()

    override fun getName(): String = "CryptoModule"

    private fun bytesToHex(bytes: ByteArray): String {
        val hexChars = CharArray(bytes.size * 2)
        for (i in bytes.indices) {
            val v = bytes[i].toInt() and 0xFF
            hexChars[i * 2] = "0123456789abcdef"[v ushr 4]
            hexChars[i * 2 + 1] = "0123456789abcdef"[v and 0x0F]
        }
        return String(hexChars)
    }

    private fun hexToBytes(hex: String): ByteArray {
        val len = hex.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(hex[i], 16) shl 4) +
                    Character.digit(hex[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }

    @ReactMethod
    fun getRandomBytes(count: Int, promise: Promise) {
        try {
            val bytes = ByteArray(count)
            secureRandom.nextBytes(bytes)
            promise.resolve(bytesToHex(bytes))
        } catch (e: Exception) {
            promise.reject("RANDOM_BYTES_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun pbkdf2(
        password: String,
        saltHex: String,
        iterations: Int,
        keyLengthBytes: Int,
        promise: Promise
    ) {
        try {
            val salt = hexToBytes(saltHex)
            val spec = PBEKeySpec(password.toCharArray(), salt, iterations, keyLengthBytes * 8)
            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            val keyBytes = factory.generateSecret(spec).encoded
            promise.resolve(bytesToHex(keyBytes))
        } catch (e: Exception) {
            promise.reject("PBKDF2_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun encryptGcm(plaintext: String, keyHex: String, customIvHex: String?, promise: Promise) {
        try {
            val keyBytes = hexToBytes(keyHex)
            val iv = if (!customIvHex.isNullOrEmpty()) {
                hexToBytes(customIvHex)
            } else {
                val randIv = ByteArray(12)
                secureRandom.nextBytes(randIv)
                randIv
            }

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val keySpec = SecretKeySpec(keyBytes, "AES")
            val gcmSpec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)

            val ciphertextBytes = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

            val result = Arguments.createMap()
            result.putString("iv", bytesToHex(iv))
            result.putString("ciphertext", bytesToHex(ciphertextBytes))
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GCM_ENCRYPT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun decryptGcm(ciphertextHex: String, keyHex: String, ivHex: String, promise: Promise) {
        try {
            val keyBytes = hexToBytes(keyHex)
            val iv = hexToBytes(ivHex)
            val cipherBytes = hexToBytes(ciphertextHex)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val keySpec = SecretKeySpec(keyBytes, "AES")
            val gcmSpec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

            val plainBytes = cipher.doFinal(cipherBytes)
            promise.resolve(String(plainBytes, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("GCM_DECRYPT_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun encrypt(plaintext: String, keyHex: String, promise: Promise) {
        encryptGcm(plaintext, keyHex, null, promise)
    }

    @ReactMethod
    fun decrypt(ivHex: String, ciphertextHex: String, tagHex: String?, keyHex: String, promise: Promise) {
        decryptGcm(ciphertextHex, keyHex, ivHex, promise)
    }
}
