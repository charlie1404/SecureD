package com.secured

import com.facebook.react.bridge.*
import java.nio.ByteBuffer
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import kotlin.math.pow

class TotpModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TotpModule"

    companion object {
        private const val BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

        fun base32Decode(base32: String): ByteArray {
            val clean = base32.trim().replace("-", "").replace(" ", "").uppercase()
            var bits = 0
            var value = 0
            var index = 0
            val output = ByteArray((clean.length * 5) / 8 + 1)

            for (ch in clean) {
                if (ch == '=') break
                val charVal = BASE32_CHARS.indexOf(ch)
                if (charVal == -1) continue

                value = (value shl 5) or charVal
                bits += 5
                if (bits >= 8) {
                    output[index++] = ((value ushr (bits - 8)) and 0xFF).toByte()
                    bits -= 8
                }
            }
            return output.copyOf(index)
        }

        fun computeTOTP(secret: String, timestampMs: Long, period: Int = 30, digits: Int = 6): String {
            return try {
                val keyBytes = base32Decode(secret)
                if (keyBytes.isEmpty()) return "Invalid"

                val timeStep = (timestampMs / 1000L) / period.toLong()
                val timeBytes = ByteBuffer.allocate(8).putLong(timeStep).array()

                val mac = Mac.getInstance("HmacSHA1")
                val keySpec = SecretKeySpec(keyBytes, "HmacSHA1")
                mac.init(keySpec)
                val hash = mac.doFinal(timeBytes)

                val offset = hash[hash.size - 1].toInt() and 0x0F
                val truncatedHash = ((hash[offset].toInt() and 0x7F) shl 24) or
                        ((hash[offset + 1].toInt() and 0xFF) shl 16) or
                        ((hash[offset + 2].toInt() and 0xFF) shl 8) or
                        (hash[offset + 3].toInt() and 0xFF)

                val modulo = 10.0.pow(digits.toDouble()).toInt()
                val otp = truncatedHash % modulo
                String.format("%0${digits}d", otp)
            } catch (e: Exception) {
                "Invalid"
            }
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun generateTOTPSync(secret: String, timestampMs: Double, period: Int, digits: Int): String {
        return computeTOTP(secret, timestampMs.toLong(), period, digits)
    }

    @ReactMethod
    fun generateTOTP(secret: String, timestampMs: Double, period: Int, digits: Int, promise: Promise) {
        try {
            val code = computeTOTP(secret, timestampMs.toLong(), period, digits)
            promise.resolve(code)
        } catch (e: Exception) {
            promise.reject("TOTP_ERROR", e.message, e)
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun generateBatchTOTPSync(accounts: ReadableArray, timestampMs: Double, period: Int, digits: Int): WritableMap {
        val result = Arguments.createMap()
        val timeMs = timestampMs.toLong()
        for (i in 0 until accounts.size()) {
            val item = accounts.getMap(i) ?: continue
            val id = item.getString("id") ?: continue
            val seed = item.getString("seed") ?: continue
            val code = computeTOTP(seed, timeMs, period, digits)
            result.putString(id, code)
        }
        return result
    }

    @ReactMethod
    fun generateBatchTOTP(accounts: ReadableArray, timestampMs: Double, period: Int, digits: Int, promise: Promise) {
        try {
            val result = generateBatchTOTPSync(accounts, timestampMs, period, digits)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("TOTP_BATCH_ERROR", e.message, e)
        }
    }
}

