/**
 * Wraps an async route handler so any thrown error (or rejected promise) is
 * forwarded to Express's error middleware — no try/catch needed in controllers.
 *
 *   export const register = asyncHandler(async (req, res) => {
 *     const result = await authService.register(req.body, req);
 *     res.status(201).json(result);
 *   });
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
