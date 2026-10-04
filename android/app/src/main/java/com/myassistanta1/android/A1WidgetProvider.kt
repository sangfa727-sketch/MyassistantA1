package com.myassistanta1.android

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class A1WidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        manager: AppWidgetManager,
        widgetIds: IntArray
    ) {
        widgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.a1_widget)
            val launchIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                widgetId,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.a1_widget_root, pendingIntent)
            manager.updateAppWidget(widgetId, views)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        onUpdate(
            context,
            AppWidgetManager.getInstance(context),
            AppWidgetManager.getInstance(context)
                .getAppWidgetIds(ComponentName(context, A1WidgetProvider::class.java))
        )
    }
}
