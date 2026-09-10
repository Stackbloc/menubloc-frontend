# CPD — Feed video playback shuffle (2026-09-10)

## Ships
| Layer | Value |
|-------|-------|
| BE | `495b11b1` / health match |
| FE tip | `igjcnkj3l` / `index-D1Tfq38I.js` @ `5fb6260b` |

## Proof
- `E2E_FEED_SHUFFLE_RESULT=PASS` (prod DB via railway)
- `LIVE_FEED_SHUFFLE=PASS` (`playback_order=geo_then_shuffle`)
- `cpd-be.sh` + `cpd-fe.sh` RESULT=PASS; tip-gate apex+www PASS
