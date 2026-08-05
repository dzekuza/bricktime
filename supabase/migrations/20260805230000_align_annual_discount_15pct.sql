-- Annual billing discount was inconsistent: the plans table stored a 20% discount
-- (annual_price = price * 0.8) while the Subscriptions UI displayed a hardcoded
-- "-17%" (price * 0.83). Standardize on a 15% annual discount everywhere.

UPDATE plans
SET annual_price = ROUND(price * 0.85, 2);
