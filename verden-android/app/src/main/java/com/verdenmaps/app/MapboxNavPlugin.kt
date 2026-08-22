package com.verdenmaps.app

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MapboxNav")
class MapboxNavPlugin : Plugin() {

    @PluginMethod
    fun startNavigation(call: PluginCall) {
        val origin = call.getObject("origin")
        val destination = call.getObject("destination")
        val profile = call.getString("profile", "driving")

        if (origin == null || destination == null) {
            call.reject("Origin and Destination objects are required.")
            return
        }

        val originLat = origin.getDouble("latitude")
        val originLng = origin.getDouble("longitude")
        val destLat = destination.getDouble("latitude")
        val destLng = destination.getDouble("longitude")

        if (originLat == null || originLng == null || destLat == null || destLng == null) {
            call.reject("Coordinates (latitude, longitude) must be valid numbers.")
            return
        }

        val intent = Intent(context, NavigationActivity::class.java).apply {
            putExtra("origin_lat", originLat)
            putExtra("origin_lng", originLng)
            putExtra("dest_lat", destLat)
            putExtra("dest_lng", destLng)
            putExtra("profile", profile)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)

        val result = JSObject()
        result.put("success", true)
        call.resolve(result)
    }

    @PluginMethod
    fun stopNavigation(call: PluginCall) {
        val intent = Intent("com.verdenmaps.app.ACTION_STOP_NAVIGATION")
        context.sendBroadcast(intent)

        val result = JSObject()
        result.put("success", true)
        call.resolve(result)
    }
}
