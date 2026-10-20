package com.secured

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class StorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StorageModule"

    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "versionName" to BuildConfig.VERSION_NAME,
            "versionCode" to BuildConfig.VERSION_CODE,
            "applicationId" to BuildConfig.APPLICATION_ID
        )
    }

    @ReactMethod
    fun getAppInfo(promise: Promise) {
        val map = Arguments.createMap().apply {
            putString("versionName", BuildConfig.VERSION_NAME)
            putInt("versionCode", BuildConfig.VERSION_CODE)
            putString("applicationId", BuildConfig.APPLICATION_ID)
        }
        promise.resolve(map)
    }

    private fun getFile(filename: String): File {
        return File(reactApplicationContext.filesDir, filename)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun writeFileSync(filename: String, content: String): Boolean {
        return try {
            getFile(filename).writeText(content, Charsets.UTF_8)
            true
        } catch (e: Exception) {
            false
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun readFileSync(filename: String): String? {
        val file = getFile(filename)
        return if (file.exists()) {
            try {
                file.readText(Charsets.UTF_8)
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun fileExistsSync(filename: String): Boolean {
        return getFile(filename).exists()
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun deleteFileSync(filename: String): Boolean {
        val file = getFile(filename)
        return if (file.exists()) file.delete() else true
    }

    @ReactMethod
    fun writeFile(filename: String, content: String, promise: Promise) {
        try {
            getFile(filename).writeText(content, Charsets.UTF_8)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WRITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun readFile(filename: String, promise: Promise) {
        try {
            val file = getFile(filename)
            if (file.exists()) {
                promise.resolve(file.readText(Charsets.UTF_8))
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun fileExists(filename: String, promise: Promise) {
        promise.resolve(getFile(filename).exists())
    }

    @ReactMethod
    fun deleteFile(filename: String, promise: Promise) {
        val file = getFile(filename)
        promise.resolve(if (file.exists()) file.delete() else true)
    }
}

