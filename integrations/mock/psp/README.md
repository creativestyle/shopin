# @integrations/mock-psp

⚠️ **DEMO ONLY** — For demonstration only; not for production.

The mock payment provider, in two parts:

- `.` (BFF): `MockPspModule` with the `PaymentService`. It offers invoice (the default) and prepayment, and links checkout to the demo payment page at `FRONTEND_URL`. No account needed.
- `./page` (storefront): `PaymentDemo`, the demo payment page the shopper lands on, with buttons that simulate payment outcomes. The storefront renders it at `/demo/mocked-payment-step/[paymentId]`.

## Removal

See [demo/README.md](../../../demo/README.md) for removal steps.

## License

OSL-3.0 — see [root LICENSE](../../../LICENSE).
