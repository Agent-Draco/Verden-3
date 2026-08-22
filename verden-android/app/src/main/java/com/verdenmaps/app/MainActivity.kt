package com.verdenmaps.app

import android.graphics.Color
import android.os.Bundle
import android.webkit.WebView
import com.getcapacitor.BridgeActivity
import com.mapbox.common.MapboxOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.plugin.LocationPuck3D
import com.mapbox.maps.plugin.locationcomponent.location

class MainActivity : BridgeActivity() {

    private var mapView: MapView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(MapboxNavPlugin::class.java)
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(true)

        val token = getString(R.string.mapbox_access_token)
        MapboxOptions.accessToken = token

        // Make Capacitor WebView transparent to let native MapView show underneath
        bridge.webView?.setBackgroundColor(android.graphics.Color.TRANSPARENT)
        bridge.webView?.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)

        mapView = findViewById(R.id.mapView)
        mapView?.let { map ->
            map.mapboxMap.loadStyle(Style.MAPBOX_STREETS) {
                setupLocationPuck(map)
            }
        }
    }

    private fun setupLocationPuck(map: MapView) {
        try {
            val locationPuck = LocationPuck3D(
                modelUri = "asset://models/car.glb",
                modelScale = listOf(1.0f, 1.0f, 1.0f),
                modelRotation = listOf(0.0f, 0.0f, 0.0f)
            )
            map.location.updateSettings {
                enabled = true
                this.locationPuck = locationPuck
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStart() {
        super.onStart()
        mapView?.onStart()
    }

    override fun onStop() {
        super.onStop()
        mapView?.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
        mapView?.onDestroy()
    }

    override fun onLowMemory() {
        super.onLowMemory()
        mapView?.onLowMemory()
    }
}
