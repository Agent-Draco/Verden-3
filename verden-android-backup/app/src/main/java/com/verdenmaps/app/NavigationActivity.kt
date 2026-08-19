package com.verdenmaps.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.mapbox.common.MapboxOptions
import com.mapbox.geojson.Point
import com.mapbox.maps.MapView
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.core.MapboxNavigation
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp

class NavigationActivity : AppCompatActivity() {

    private lateinit var mapView: MapView
    private lateinit var btnExit: Button
    private var mapboxNavigation: MapboxNavigation? = null

    private val stopNavigationReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            cleanupAndFinish()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_navigation)

        mapView = findViewById(R.id.mapView)
        btnExit = findViewById(R.id.btnExit)

        btnExit.setOnClickListener {
            cleanupAndFinish()
        }

        // Register Stop Navigation Broadcast
        registerReceiver(stopNavigationReceiver, IntentFilter("com.verdenmaps.app.ACTION_STOP_NAVIGATION"))

        // Extract origin and destination from bundle
        val originLat = intent.getDoubleExtra("origin_lat", 0.0)
        val originLng = intent.getDoubleExtra("origin_lng", 0.0)
        val destLat = intent.getDoubleExtra("dest_lat", 0.0)
        val destLng = intent.getDoubleExtra("dest_lng", 0.0)

        // Set access token programmatically
        val token = getString(R.string.mapbox_access_token)
        MapboxOptions.accessToken = token

        initializeNavigation(originLat, originLng, destLat, destLng)
    }

    private fun initializeNavigation(originLat: Double, originLng: Double, destLat: Double, destLng: Double) {
        val navigation = MapboxNavigationApp.current()
        if (navigation != null) {
            mapboxNavigation = navigation
            startTrip(originLat, originLng, destLat, destLng)
        } else {
            // Fallback initialization if App setup was not run
            if (!MapboxNavigationApp.isSetup()) {
                MapboxNavigationApp.setup {
                    NavigationOptions.Builder(applicationContext)
                        .build()
                }
            }
            mapboxNavigation = MapboxNavigationApp.current()
            startTrip(originLat, originLng, destLat, destLng)
        }
    }

    private fun startTrip(originLat: Double, originLng: Double, destLat: Double, destLng: Double) {
        val navigation = mapboxNavigation ?: return
        navigation.startTripSession()

        val origin = Point.fromLngLat(originLng, originLat)
        val destination = Point.fromLngLat(destLng, destLat)
        
        // Setup map style and render basic components
        mapView.mapboxMap.loadStyle(com.mapbox.maps.Style.MAPBOX_STREETS) {
            // Draw points, camera transition or logic can be initialized here
        }
    }

    private fun cleanupAndFinish() {
        mapboxNavigation?.stopTripSession()
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(stopNavigationReceiver)
        } catch (e: Exception) {
            // Receiver might not be registered
        }
    }
}
