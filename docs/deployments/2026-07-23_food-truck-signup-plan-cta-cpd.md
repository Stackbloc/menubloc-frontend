# Food truck signup restaurant-parity wiring — CPD

**Date:** 2026-07-23  
**Commit:** `333b2bf` (`feature/mds-homepage-controls`)  
**Deploy:** `https://menubloc-frontend-gc6lwlq04-menuply.vercel.app`  
**Alias:** `npx vercel alias set menubloc-frontend-gc6lwlq04-menuply.vercel.app menuply.com`  
**Bundle:** `index-BDhlzC-Z.js`

## What shipped

- Plan card **Select Food Truck** CTA  
- Post-signup: persist onboarding → `/operator/verify-email` + `autoSend` → `/restaurant/pdf-upload?food_truck_onboarding=1`  
- Verify-email preserves food-truck upload query  

## Verification

| Check | Result |
|-------|--------|
| vitest menuplyCheckoutPlans | 18/18 PASS |
| Playwright local (Vite+Railway) wiring | 2/2 PASS |
| Bundle contains Select Food Truck + CTA testid + food_truck_onboarding=1 | PASS |
| Bundle API: menubloc-backend-production >> localhost:3001 (60 vs 6) | PASS |
| menuply.com alias points at this deploy | PASS |

## Human verify

Open https://menuply.com/foodtruck/signup — Select Food Truck → fill form → land on Verify your email with code auto-send.
