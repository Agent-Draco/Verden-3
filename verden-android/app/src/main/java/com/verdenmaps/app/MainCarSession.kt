package com.verdenmaps.app

import android.content.Intent
import androidx.car.app.Screen
import androidx.car.app.Session

class MainCarSession : Session() {
    override fun onCreateScreen(intent: Intent): Screen {
        return CarNavigationScreen(carContext)
    }
}
