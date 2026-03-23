"""Module configuring the websocket application used in the asgi module."""

from channels.routing import URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from marsha.websocket.middlewares import JWTMiddleware
from marsha.websocket.routing import websocket_urlpatterns


class SocketIOAllowedHostsBypass:
    """Bypass host/origin validation for internal PeerTube runner socket.io traffic."""

    def __init__(self, application):
        self.application = application
        self.validated_application = AllowedHostsOriginValidator(application)

    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket" and scope["path"] == "/socket.io/":
            return await self.application(scope, receive, send)

        return await self.validated_application(scope, receive, send)


base_application = JWTMiddleware(URLRouter(websocket_urlpatterns))

websocket_application = SocketIOAllowedHostsBypass(base_application)
