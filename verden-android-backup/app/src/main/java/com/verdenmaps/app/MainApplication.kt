package com.verdenmaps.app

import android.app.Application
import com.mapbox.common.MapboxOptions
import com.mapbox.navigation.base.options.NavigationOptions
import com.mapbox.navigation.core.lifecycle.MapboxNavigationApp

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        val token = getString(R.string.mapbox_access_token)
        MapboxOptions.accessToken = token

        if (!MapboxNavigationApp.isSetup()) {
            MapboxNavigationApp.setup {
                NavigationOptions.Builder(this)
                    .build()
            }
        }
    }
}
