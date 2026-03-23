"""Defines the django app config for the ``websocket`` app."""

import logging
import sys

from django.apps import AppConfig
from django.conf import settings
from django.utils.translation import gettext_lazy as _


logger = logging.getLogger(__name__)


class WebsocketConfig(AppConfig):
    """Django app config for the ``websocket`` app."""

    name = "marsha.websocket"
    verbose_name = _("Marsha websockets")

    def ready(self):
        """Configure a shared socket.io manager so app and celery share events."""
        # Import lazily to avoid side effects during Django app loading.
        # pylint: disable=import-outside-toplevel
        import socketio

        from django_peertube_runner_connector.socket import sio

        # Keep app websocket server and celery emitters on the same redis-backed
        # socket.io bus. Without this, celery emits "available-jobs" from another
        # process that connected runners never receive.
        if getattr(sio, "_marsha_redis_manager_configured", False):
            return

        redis_url = getattr(settings, "CELERY_BROKER_URL", None) or "redis://redis:6379/0"
        is_celery_process = any("celery" in arg for arg in sys.argv)

        try:
            manager = socketio.AsyncRedisManager(
                redis_url,
                write_only=is_celery_process,
            )
            sio.manager = manager
            manager.set_server(sio)
            sio._marsha_redis_manager_configured = True
            logger.info(
                "Configured socket.io redis manager",
                extra={
                    "redis_url": redis_url,
                    "write_only": is_celery_process,
                },
            )
        except Exception:  # pragma: no cover - defensive startup logging
            logger.exception("Failed to configure socket.io redis manager")
