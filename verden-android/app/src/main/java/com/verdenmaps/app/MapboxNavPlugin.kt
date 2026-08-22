package com.verdenmaps.app

import android.content.Intent
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.mapbox.common.MapboxOptions
import com.mapbox.geojson.Point
import com.mapbox.search.ResponseInfo
import com.mapbox.search.SearchEngine
import com.mapbox.search.SearchEngineSettings
import com.mapbox.search.SearchOptions
import com.mapbox.search.SearchSuggestionsCallback
import com.mapbox.search.result.SearchSuggestion

@CapacitorPlugin(name = "MapboxNav")
class MapboxNavPlugin : Plugin() {

    private var searchEngine: SearchEngine? = null

    private fun getOrCreateSearchEngine(): SearchEngine {
        if (searchEngine == null) {
            val token = context.getString(R.string.mapbox_access_token)
            MapboxOptions.accessToken = token
            searchEngine = SearchEngine.createSearchEngineWithBuiltInDataProviders(
                SearchEngineSettings()
            )
        }
        return searchEngine!!
    }

    @PluginMethod
    fun searchPlaces(call: PluginCall) {
        val query = call.getString("query")
        if (query.isNullOrBlank()) {
            call.reject("Query string is required.")
            return
        }

        val lat = call.getDouble("latitude")
        val lng = call.getDouble("longitude")

        val options = SearchOptions.Builder().apply {
            if (lat != null && lng != null) {
                proximity(Point.fromLngLat(lng, lat))
            }
        }.build()

        val engine = getOrCreateSearchEngine()
        engine.search(query, options, object : SearchSuggestionsCallback {
            override fun onSuggestions(suggestions: List<SearchSuggestion>, responseInfo: ResponseInfo) {
                val jsArray = JSArray()
                for (suggestion in suggestions) {
                    val item = JSObject()
                    item.put("id", suggestion.id)
                    item.put("name", suggestion.name)
                    item.put("description", suggestion.descriptionText ?: suggestion.fullAddress)
                    item.put("address", suggestion.fullAddress)
                    val coord = suggestion.coordinate
                    if (coord != null) {
                        item.put("latitude", coord.latitude())
                        item.put("longitude", coord.longitude())
                    }
                    jsArray.put(item)
                }
                val result = JSObject()
                result.put("results", jsArray)
                call.resolve(result)
            }

            override fun onError(e: Exception) {
                call.reject("Search failed: ${e.message}", e)
            }
        })
    }

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
