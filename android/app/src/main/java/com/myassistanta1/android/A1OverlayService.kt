package com.myassistanta1.android

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import kotlin.math.abs

class A1OverlayService : Service() {
    private lateinit var windowManager: WindowManager
    private var companionView: A1FloatingView? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(1001, notification())
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        companionView = A1FloatingView().also { view ->
            val type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            val params = WindowManager.LayoutParams(
                dp(86),
                dp(104),
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                android.graphics.PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = dp(18)
                y = dp(180)
            }
            windowManager.addView(view, params)
        }
    }

    override fun onDestroy() {
        companionView?.let {
            runCatching { windowManager.removeView(it) }
        }
        companionView = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            "a1_companion",
            "A1 Companion",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java)
            .createNotificationChannel(channel)
    }

    private fun notification(): Notification =
        Notification.Builder(this, "a1_companion")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("A1 companion is active")
            .setContentText("A1 is available on your screen.")
            .setOngoing(true)
            .build()

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()

    private inner class A1FloatingView : View(this@A1OverlayService) {
        private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        private var downX = 0f
        private var downY = 0f
        private var startX = 0
        private var startY = 0
        private var moved = false

        init {
            setLayerType(View.LAYER_TYPE_SOFTWARE, null)
            contentDescription = "A1 floating AI companion"
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val d = resources.displayMetrics.density
            val cx = width / 2f
            val head = RectF(12*d, 18*d, 74*d, 70*d)
            val body = RectF(23*d, 66*d, 63*d, 94*d)

            paint.color = 0xFF20272D.toInt()
            canvas.drawRoundRect(body, 12*d, 12*d, paint)

            paint.color = 0xFF9AA4AD.toInt()
            canvas.drawRoundRect(head, 17*d, 17*d, paint)

            paint.color = 0xFF10161B.toInt()
            canvas.drawRoundRect(
                RectF(19*d, 29*d, 67*d, 61*d),
                11*d, 11*d, paint
            )

            paint.color = 0xFFC9F5FF.toInt()
            canvas.drawCircle(cx - 12*d, 44*d, 5*d, paint)
            canvas.drawCircle(cx + 12*d, 44*d, 5*d, paint)

            paint.color = 0xFFFFAFC5.toInt()
            canvas.drawCircle(cx - 19*d, 53*d, 4*d, paint)
            canvas.drawCircle(cx + 19*d, 53*d, 4*d, paint)

            paint.color = 0xFFC9F5FF.toInt()
            canvas.drawRoundRect(
                RectF(cx - 7*d, 55*d, cx + 7*d, 58*d),
                2*d, 2*d, paint
            )

            paint.color = 0xFFD7DDE2.toInt()
            canvas.drawCircle(20*d, 23*d, 5*d, paint)
            canvas.drawCircle(66*d, 23*d, 5*d, paint)

            paint.color = 0xFF54D9FF.toInt()
            canvas.drawCircle(cx, 13*d, 3*d, paint)

            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 10*d
            paint.color = 0xFFEAFBFF.toInt()
            canvas.drawText("A1", cx - 7*d, 85*d, paint)
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            val params = companionView?.layoutParams as? WindowManager.LayoutParams
                ?: return true

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = event.rawX
                    downY = event.rawY
                    startX = params.x
                    startY = params.y
                    moved = false
                    return true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    if (abs(dx) > dp(5) || abs(dy) > dp(5)) moved = true
                    params.x = startX + dx.toInt()
                    params.y = startY + dy.toInt()
                    windowManager.updateViewLayout(this, params)
                    return true
                }
                MotionEvent.ACTION_UP -> {
                    if (!moved) {
                        startActivity(
                            Intent(this@A1OverlayService, MainActivity::class.java)
                                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        )
                    }
                    return true
                }
            }
            return true
        }
    }
}
