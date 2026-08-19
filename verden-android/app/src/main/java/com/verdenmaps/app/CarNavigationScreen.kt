package com.verdenmaps.app

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarColor
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import androidx.car.app.navigation.model.RoutingInfo

class CarNavigationScreen(carContext: CarContext) : Screen(carContext) {
    override fun onGetTemplate(): Template {
        val actionStrip = ActionStrip.Builder()
            .addAction(
                Action.Builder()
                    .setTitle("Exit")
                    .setOnClickListener {
                        // Action listener left blank to comply with service lifecycle limits
                    }
                    .build()
            )
            .build()

        return NavigationTemplate.Builder()
            .setActionStrip(actionStrip)
            .setBackgroundColor(CarColor.PRIMARY)
            .setNavigationInfo(
                RoutingInfo.Builder()
                    .setLoading(true)
                    .build()
            )
            .build()
    }
}
