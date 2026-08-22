package com.verdenmaps.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.mapbox.api.directions.v5.DirectionsCriteria
import com.mapbox.api.directions.v5.models.DirectionsRoute
import com.mapbox.api.directions.v5.models.RouteOptions
import com.mapbox.common.MapboxOptions
import com.mapbox.geojson.LineString
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraOptions
import com.mapbox.maps.MapView
import com.mapbox.maps.Style
import com.mapbox.maps.extension.style.layers.addLayer
import com.mapbox.maps.extension.style.layers.generated.lineLayer
import com.mapbox.maps.extension.style.sources.addSource
import com.mapbox.maps.extension.style.sources.generated.geoJsonSource
import com.mapbox.maps.plugin.LocationPuck3D
import com.mapbox.maps.plugin.locationcomponent.location
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.base.route.NavigationRoute
import com.mapbox.navigation.base.route.NavigationRouterCallback
import com.mapbox.navigation.base.route.RouterFailure
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
        val profile = intent.getStringExtra("profile") ?: "driving"

        // Set access token programmatically
        val token = getString(R.string.mapbox_access_token)
        MapboxOptions.accessToken = token

        // Immediately set camera to origin to avoid blank world globe
        val origin = Point.fromLngLat(originLng, originLat)
        mapView.mapboxMap.setCamera(
            CameraOptions.Builder()
                .center(origin)
                .zoom(16.5)
                .pitch(55.0)
                .build()
        )

        initializeNavigation(originLat, originLng, destLat, destLng, profile)
    }

    private fun initializeNavigation(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        profile: String
    ) {
        val navigation = MapboxNavigationApp.current()
        if (navigation != null) {
            mapboxNavigation = navigation
            startTrip(originLat, originLng, destLat, destLng, profile)
        } else {
            // Fallback initialization if App setup was not run
            if (!MapboxNavigationApp.isSetup()) {
                MapboxNavigationApp.setup {
                    NavigationOptions.Builder(applicationContext)
                        .build()
                }
            }
            mapboxNavigation = MapboxNavigationApp.current()
            startTrip(originLat, originLng, destLat, destLng, profile)
        }
    }

    private fun startTrip(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        profile: String
    ) {
        val navigation = mapboxNavigation ?: return
        navigation.startTripSession()

        val origin = Point.fromLngLat(originLng, originLat)
        val destination = Point.fromLngLat(destLng, destLat)

        // Setup map style, 3D vehicle puck, and fetch route
        mapView.mapboxMap.loadStyle(Style.MAPBOX_STREETS) { style ->
            setupLocationPuck()
            fetchAndRenderRoute(origin, destination, profile, style)
        }
    }

    private fun setupLocationPuck() {
        try {
            val locationPuck = LocationPuck3D(
                modelUri = "asset://models/car.glb",
                modelScale = listOf(1.0f, 1.0f, 1.0f),
                modelRotation = listOf(0.0f, 0.0f, 0.0f)
            )
            mapView.location.updateSettings {
                enabled = true
                this.locationPuck = locationPuck
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun fetchAndRenderRoute(
        origin: Point,
        destination: Point,
        profile: String,
        style: Style
    ) {
        val routingProfile = when (profile) {
            "walking" -> DirectionsCriteria.PROFILE_WALKING
            "cycling" -> DirectionsCriteria.PROFILE_CYCLING
            else -> DirectionsCriteria.PROFILE_DRIVING_TRAFFIC
        }

        val routeOptions = RouteOptions.builder()
            .coordinatesList(listOf(origin, destination))
            .profile(routingProfile)
            .alternatives(false)
            .overview(DirectionsCriteria.OVERVIEW_FULL)
            .steps(true)
            .build()

        mapboxNavigation?.requestRoutes(
            routeOptions,
            object : NavigationRouterCallback {
                override fun onRoutesReady(routes: List<NavigationRoute>, routerOrigin: String) {
                    if (routes.isNotEmpty()) {
                        mapboxNavigation?.setNavigationRoutes(routes)
                        val primaryRoute = routes.first().directionsRoute
                        drawRouteLine(primaryRoute, style)
                    }
                }

                override fun onFailure(reasons: List<RouterFailure>, routeOptions: RouteOptions) {
                    val line = LineString.fromLngLats(listOf(origin, destination))
                    drawGeometryLine(line, style)
                }

                override fun onCanceled(routeOptions: RouteOptions, routerOrigin: String) {}
            }
        )
    }

    private fun drawRouteLine(route: DirectionsRoute, style: Style) {
        val geometry = route.geometry() ?: return
        val lineString = LineString.fromPolyline(geometry, 6)
        drawGeometryLine(lineString, style)
    }

    private fun drawGeometryLine(lineString: LineString, style: Style) {
        try {
            val sourceId = "nav-route-source"
            val casingLayerId = "nav-route-casing"
            val lineLayerId = "nav-route-line"

            if (style.styleSourceExists(sourceId)) {
                style.removeStyleSource(sourceId)
            }
            if (style.styleLayerExists(lineLayerId)) {
                style.removeStyleLayer(lineLayerId)
            }
            if (style.styleLayerExists(casingLayerId)) {
                style.removeStyleLayer(casingLayerId)
            }

            style.addSource(
                geoJsonSource(sourceId) {
                    geometry(lineString)
                }
            )

            style.addLayer(
                lineLayer(casingLayerId, sourceId) {
                    lineColor("#062b1c")
                    lineWidth(10.0)
                    lineOpacity(0.8)
                }
            )

            style.addLayer(
                lineLayer(lineLayerId, sourceId) {
                    lineColor("#22c55e")
                    lineWidth(6.0)
                    lineOpacity(1.0)
                }
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun cleanupAndFinish() {
        mapboxNavigation?.stopTripSession()
        finish()
    }

    override fun onStart() {
        super.onStart()
        mapView.onStart()
    }

    override fun onStop() {
        super.onStop()
        mapView.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
        mapView.onDestroy()
        try {
            unregisterReceiver(stopNavigationReceiver)
        } catch (e: Exception) {
            // Receiver might not be registered
        }
    }

    override fun onLowMemory() {
        super.onLowMemory()
        mapView.onLowMemory()
    }
}
