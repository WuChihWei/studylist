"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}
// 确保您的密钥使用环境变量
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia' // 使用 TypeScript 类型定义要求的版本
});
const router = (0, express_1.Router)();
// Stripe webhook handling
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is not defined');
        return res.status(500).send('Webhook secret not configured');
    }
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log(`Payment successful for: ${session.customer_email}`);
                // Add your payment success logic here
                break;
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log(`PaymentIntent success: ${paymentIntent.id}`);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Webhook Error:', error.message);
            return res.status(400).send(`Webhook Error: ${error.message}`);
        }
        console.error('Unknown webhook error');
        return res.status(400).send('Webhook Error: Unknown error occurred');
    }
});
exports.default = router;
