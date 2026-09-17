export function success(res, data = null, message = null, status = 200) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
}

export function fail(res, message, status = 400, extra = {}) {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  });
}

export function validationFail(res, errors) {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

export function serverError(res, message, error) {
  const body = {
    success: false,
    message,
  };
  if (error) body.error = typeof error === 'string' ? error : error.message;
  return res.status(500).json(body);
}

export default { success, fail, validationFail, serverError };
