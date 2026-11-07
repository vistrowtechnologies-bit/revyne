package com.revyne.revyne_app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createReviewAlertsChannel()
    }

    /**
     * "Review alerts" channel used by every RevYne push (server sends channel_id
     * "reviews"). High importance so new reviews and messages pop up on screen.
     * Android keeps channels once created, so alerts work even when the app is
     * closed later; the owner can still change it in system settings.
     */
    private fun createReviewAlertsChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel("reviews", "Review alerts", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "New Google reviews and private messages from customers"
            enableVibration(true)
        }
        getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }
}
