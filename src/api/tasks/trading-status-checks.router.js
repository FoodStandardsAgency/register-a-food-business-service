"use strict";

const { Router } = require("express");
const { success, fail } = require("../../utils/express/response");
const { logEmitter } = require("../../services/logging.service");

const {
  processTradingStatusChecksDue,
  processTradingStatusChecksForId,
  processFboConfirmedTrading,
  processFboStoppedTrading
} = require("./trading-status-checks.controller");

const tradingStatusRouter = () => {
  const router = Router();

  /**
   * POST /bulk/trading-status-checks
   *
   * Initiates the bulk trading status checks process.
   * Note that a success response indicates only that the request was processed,
   * not that the emails were all sent successfully.
   *
   * Query Parameters:
   *   - throttle (optional): A numeric value specifying the throttle for processing.
   *                            Defaults to 50 if not provided.
   */
  router.post("/bulk/trading-status-checks", async (req, res) => {
    logEmitter.emit("functionCall", "trading-status-checks.router", "bulk/trading-status-checks");
    let throttle = req.query && req.query.throttle ? req.query.throttle : 50;

    try {
      const results = await processTradingStatusChecksDue(req, res, throttle);
      await success(res, {
        message: `Processed trading status checks`,
        attempted: results,
        throttle
      });
    } catch (e) {
      logEmitter.emit("functionFail", "trading-status-checks.router", "bulk/trading-status-checks");
      await fail(500, res, e.message);
    }
    logEmitter.emit(
      "functionSuccess",
      "trading-status-checks.router",
      "bulk/trading-status-checks"
    );
  });

  /**
   * POST /trading-status-checks
   *
   * Initiates the trading status checks process for a single registration.
   * Note that a success response indicates only that the request was processed,
   * not that the emails were all sent successfully.
   */
  router.post("/trading-status-checks/:fsaId", async (req, res) => {
    logEmitter.emit("functionCall", "trading-status-checks.router", "trading-status-checks/:fsaId");
    const { fsaId = null } = req.params;
    try {
      await processTradingStatusChecksForId(fsaId, req, res);
      await success(res, {
        message: `Processed trading status checks for ${fsaId}`
      });
    } catch (e) {
      logEmitter.emit(
        "functionFail",
        "trading-status-checks.router",
        "trading-status-checks/:fsaId"
      );
      await fail(500, res, e.message);
    }
    logEmitter.emit(
      "functionSuccess",
      "trading-status-checks.router",
      "trading-status-checks/:fsaId"
    );
  });

  /**
   * POST /stopped-trading/:fsaId
   *
   * Updates the registration to indicate business stopped trading.
   */
  router.post("/stopped-trading/:fsaId", async (req, res) => {
    logEmitter.emit("functionCall", "trading-status-checks.router", "stopped-trading/:fsaId");
    try {
      const { fsaId = null } = req.params;
      const { id = null } = req.query;

      await processFboStoppedTrading(fsaId, id);
      await success(res, {
        message: `Marked business as no longer trading: ${fsaId}`
      });
    } catch (e) {
      logEmitter.emit("functionFail", "trading-status-checks.router", "stopped-trading/:fsaId");
      await fail(500, res, e.message);
    }
    logEmitter.emit("functionSuccess", "trading-status-checks.router", "stopped-trading/:fsaId");
  });

  /**
   * POST /confirmed-trading/:fsaId
   *
   * Updates the registration to indicate business confirmed still trading.
   */
  router.post("/confirmed-trading/:fsaId", async (req, res) => {
    logEmitter.emit("functionCall", "trading-status-checks.router", "confirmed-trading/:fsaId");
    try {
      const { fsaId = null } = req.params;
      const { id = null } = req.query;

      await processFboConfirmedTrading(fsaId, id);
      await success(res, {
        message: `Marked business as confirmed still trading: ${fsaId}`
      });
    } catch (e) {
      logEmitter.emit("functionFail", "trading-status-checks.router", "confirmed-trading/:fsaId");
      await fail(500, res, e.message);
    }
    logEmitter.emit("functionSuccess", "trading-status-checks.router", "confirmed-trading/:fsaId");
  });

  return router;
};

module.exports = { tradingStatusRouter };
