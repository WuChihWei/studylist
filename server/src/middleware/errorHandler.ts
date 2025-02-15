import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    origin: req.headers.origin
  });

  if (err.name === 'CORSError') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      allowedOrigins: process.env.CLIENT_URL
    });
  }

  if (err instanceof Stripe.errors.StripeError) {
    return res.status(err.statusCode || 500).json({
      error: err.type,
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};