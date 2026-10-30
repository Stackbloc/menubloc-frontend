/**
 * The app's icons (menuply-mobile src/components/icons/MenuplyIcon.tsx), same drawings, so menuply.com
 * and the app look like one product. Names: wishList, fav, invite, share, menu, more, home, deals,
 * search, basket, profile, pin, chevronDown, camera, check, arrowRight, food tiles (taco, pizza, burger,
 * salad, bowl, coffee, sushi, drumstick, cupcake, egg, boba, sandwich), fork, comment, upload…
 */
export default function AppIcon({ name, size = 18, color = "currentColor", filled = false, strokeWidth = 2, style = null }) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: "block", ...style }}>
      {name === 'soundOn' || name === 'soundOff' ? (
        // Speaker (sound on: waves; sound off: an X), as the website's 🔊 / 🔇.
        <>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...stroke} />
          {name === 'soundOn' ? (
            <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...stroke} />
          ) : (
            <path d="M16 9.5l5 5M21 9.5l-5 5" {...stroke} />
          )}
        </>
      ) : null}
      {name === 'pin' ? (
        <>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" {...stroke} />
          <circle cx="12" cy="10" r="2.4" {...stroke} />
        </>
      ) : null}
      {name === 'chevronDown' ? <path d="m6 9 6 6 6-6" {...stroke} /> : null}
      {name === 'camera' ? (
        <>
          <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" {...stroke} />
          <circle cx="12" cy="13" r="3.4" {...stroke} />
        </>
      ) : null}
      {name === 'check' ? <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} /> : null}
      {name === 'fork' ? <path d="M6 3v6a2 2 0 0 0 4 0V3M8 3v18M17 21V3c-2.2 1.3-3.5 3.8-3.5 7.5V13H17" {...stroke} /> : null}
      {name === 'comment' ? <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5ZM8 8.5h8M8 11.5h5" {...stroke} /> : null}
      {name === 'upload' ? <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" {...stroke} /> : null}
      {name === 'arrowRight' ? <path d="M5 12h14M13 6l6 6-6 6" {...stroke} /> : null}
      {name === 'taco' ? (
        <>
          <path d="M3 17a9 9 0 0 1 18 0Z" {...stroke} />
          <path d="M7 12.5c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0" {...stroke} />
        </>
      ) : null}
      {name === 'pizza' ? (
        <>
          <path d="M12 21 3.5 5.5a15 15 0 0 1 17 0Z" {...stroke} />
          <circle cx="10" cy="10" r="1.2" {...stroke} />
          <circle cx="13.5" cy="13.5" r="1.2" {...stroke} />
        </>
      ) : null}
      {name === 'burger' ? (
        <>
          <path d="M4 10a8 5 0 0 1 16 0Z" {...stroke} />
          <path d="M3.5 13.5h17M4.5 17h15a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2Z" {...stroke} />
        </>
      ) : null}
      {name === 'salad' ? (
        <>
          <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" {...stroke} />
          <path d="M8 11c0-3 1.5-5 4-6M12 11c0-2.5 1.5-4.5 4.5-5" {...stroke} />
        </>
      ) : null}
      {name === 'bowl' ? (
        <>
          <path d="M3 11h18a9 9 0 0 1-18 0Z" {...stroke} />
          <path d="M9 7.5c1-1.5 1-2.5 0-4M13.5 7.5c1-1.5 1-2.5 0-4" {...stroke} />
        </>
      ) : null}
      {name === 'sushi' ? (
        <>
          <path d="M4 13.5a8 3.5 0 0 0 16 0v-3a8 3.5 0 0 0-16 0Z" {...stroke} />
          <path d="M4 10.5a8 3.5 0 0 0 16 0" {...stroke} />
          <circle cx="12" cy="10.5" r="1.6" {...stroke} />
        </>
      ) : null}
      {name === 'drumstick' ? (
        <>
          <path d="M15.5 4a5 5 0 0 1 4.5 4.5c.3 3-2.6 5.6-5.5 6.5l-3.8 3.8" {...stroke} />
          <path d="M15.5 4c-3 0-5.8 2.7-6.5 5.5l3.8 3.8M10.7 18.8a1.8 1.8 0 1 1-2.5 2.5 1.8 1.8 0 1 1-2.5-2.5 1.8 1.8 0 1 1 2.5-2.5" {...stroke} />
        </>
      ) : null}
      {name === 'cupcake' ? (
        <>
          <path d="M6 12h12l-1.5 8h-9Z" {...stroke} />
          <path d="M5 12a7 5 0 0 1 14 0M12 4.5V6" {...stroke} />
        </>
      ) : null}
      {name === 'egg' ? (
        <>
          <path d="M12 3c3.5 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.5-10 6-10Z" {...stroke} />
          <circle cx="12" cy="14" r="2.4" {...stroke} />
        </>
      ) : null}
      {name === 'boba' ? (
        <>
          <path d="M6 8h12l-1.5 12.5h-9Z" {...stroke} />
          <path d="M13 8 15 2.5M9.5 17h.01M12 18h.01M14.5 16.5h.01" {...stroke} />
        </>
      ) : null}
      {name === 'sandwich' ? (
        <>
          <path d="M3 11 12 5l9 6Z" {...stroke} />
          <path d="M3.5 14h17M4 17.5h16v1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" {...stroke} />
        </>
      ) : null}
      {name === 'coffee' ? (
        <>
          <path d="M4.5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5Z" {...stroke} />
          <path d="M16.5 10.5h1.5a2.5 2.5 0 0 1 0 5h-1.5M8.5 3.5v2.5M12.5 3.5v2.5" {...stroke} />
        </>
      ) : null}
      {name === 'expand' ? (
        // FeedPipExpandButton.jsx: four corners, back to full screen.
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" {...stroke} strokeWidth={2.4} />
      ) : null}
      {name === 'wishList' ? (
        <>
          <path d="M3.5 3v4.5a2 2 0 0 0 4 0V3M5.5 9.5V21" {...stroke} />
          <circle cx="13.5" cy="12.5" r="4.6" fill={filled ? color : "none"} {...stroke} />
          <path d="M20.5 3c-1.4.9-1.9 2.9-1.9 5.2V12h1.9v9" {...stroke} />
        </>
      ) : null}
      {name === 'fav' ? (
        // FavHeartIcon.jsx: one Fav for restaurants and dishes (Andre 2026-10-24).
        <path
          d="M12 20.5s-7.6-4.6-9.4-9.3C1.4 7.9 3.5 4.5 7.1 4.5c2.1 0 3.6 1.1 4.9 2.9 1.3-1.8 2.8-2.9 4.9-2.9 3.6 0 5.7 3.4 4.5 6.7-1.8 4.7-9.4 9.3-9.4 9.3Z"
          fill={filled ? color : "none"}
          {...stroke}
        />
      ) : null}
      {name === 'like' ? (
        <path
          d="M7 22V11M2 13v7a2 2 0 0 0 2 2h12.5a2 2 0 0 0 2-1.6l1.3-6.5a2 2 0 0 0-2-2.4H15V5a3 3 0 0 0-3-3l-1 5-3.5 4.5H2Z"
          fill={filled ? color : "none"}
          {...stroke}
        />
      ) : null}
      {name === 'invite' ? (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke} />
          <circle cx="9" cy="7" r="4" {...stroke} />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" {...stroke} />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" {...stroke} />
        </>
      ) : null}
      {/* Share: the solid arrow bending right from the "Eating is Social" ad (Andre, 2026-10-25). */}
      {name === 'share' ? <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11Z" fill={color} /> : null}
      {name === 'menu' ? (
        <>
          <line x1="4" y1="7" x2="20" y2="7" {...stroke} />
          <line x1="4" y1="12" x2="20" y2="12" {...stroke} />
          <line x1="4" y1="17" x2="20" y2="17" {...stroke} />
        </>
      ) : null}
      {name === 'home' ? <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" {...stroke} /> : null}
      {name === 'deals' ? (
        <>
          <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" {...stroke} />
          <circle cx="7.5" cy="7.5" r="1.5" fill={color} />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <circle cx="11" cy="11" r="7" {...stroke} />
          <path d="m20 20-3.5-3.5" {...stroke} />
        </>
      ) : null}
      {name === 'basket' ? (
        <>
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" {...stroke} />
          <circle cx="10" cy="20" r="1.3" fill={color} />
          <circle cx="17" cy="20" r="1.3" fill={color} />
        </>
      ) : null}
      {name === 'profile' ? (
        <>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <circle cx="12" cy="10" r="3" {...stroke} />
          <path d="M6.5 18.5a6 6 0 0 1 11 0" {...stroke} />
        </>
      ) : null}
      {name === 'more' ? (
        <>
          <circle cx="5" cy="12" r="1.6" fill={color} />
          <circle cx="12" cy="12" r="1.6" fill={color} />
          <circle cx="19" cy="12" r="1.6" fill={color} />
        </>
      ) : null}
    </svg>
  );
}
