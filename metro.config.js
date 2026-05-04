const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Opt-in serve-sim (iOS simulator framebuffer + WS control at /.sim).
// Metro binds to 0.0.0.0 by default, so the middleware also checks the
// request's remote address and only responds to loopback callers. Anyone
// else gets a 403.
if (process.env.EXPO_ENABLE_SIM === "1") {
  const connect = require("connect");
  const { simMiddleware } = require("serve-sim/middleware");

  const isLoopback = (req) => {
    const addr = req.socket && req.socket.remoteAddress;
    if (!addr) return false;
    return (
      addr === "127.0.0.1" ||
      addr === "::1" ||
      addr === "::ffff:127.0.0.1" ||
      addr.startsWith("127.")
    );
  };

  const guardedSimMiddleware = (() => {
    const sim = simMiddleware({ basePath: "/.sim" });
    return (req, res, next) => {
      if (req.url && req.url.startsWith("/.sim") && !isLoopback(req)) {
        res.statusCode = 403;
        res.end("serve-sim: loopback only");
        return;
      }
      sim(req, res, next);
    };
  })();

  config.server = config.server || {};
  const originalEnhanceMiddleware = config.server.enhanceMiddleware;
  config.server.enhanceMiddleware = (metroMiddleware, server) => {
    const middleware = originalEnhanceMiddleware
      ? originalEnhanceMiddleware(metroMiddleware, server)
      : metroMiddleware;
    const app = connect();
    app.use(guardedSimMiddleware);
    app.use(middleware);
    return app;
  };
}

module.exports = config;
