import React from "react";
import { Link } from "react-router-dom";
import { clusterDirectoryPath, clusterPath } from "../../../lib/clusterUrl.js";
import AccountActionLink from "./AccountActionLink.jsx";
import { accountStyles as styles } from "./accountDashboardStyles.js";

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function clusterHref(cluster) {
  return (
    clusterPath({
      state: cluster.state,
      city: cluster.city,
      slug: cluster.slug,
    }) || clusterDirectoryPath()
  );
}

export default function WalletActivityTab({
  coinsWallet,
  likedMeals,
  onUnlikeMeal,
  unlikeBusyId,
  unlikeError,
  myClusters,
}) {
  const hasWalletActivity =
    Number(coinsWallet?.balance_cents || 0) > 0 ||
    Number(coinsWallet?.lifetime_earned_cents || 0) > 0;

  return (
    <div>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Mx Coins</h2>
        <p style={styles.sectionDesc}>
          Platform credit applied automatically toward qualifying Menuply Checkout orders.
        </p>
        {hasWalletActivity ? (
          <div style={styles.coinsRow}>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Available</span>
              <strong style={styles.coinValue}>{formatMoney(coinsWallet.balance_cents)}</strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Earned</span>
              <strong style={styles.coinValue}>
                {formatMoney(coinsWallet.lifetime_earned_cents)}
              </strong>
            </div>
            <div style={styles.coinTile}>
              <span style={styles.coinLabel}>Redeemed</span>
              <strong style={styles.coinValue}>
                {formatMoney(coinsWallet.lifetime_redeemed_cents)}
              </strong>
            </div>
          </div>
        ) : (
          <p style={styles.muted}>
            No Mx Coins yet. Qualifying Menuply Checkout activity will appear here.
          </p>
        )}
      </section>

      <section style={styles.section} id="meals-liked">
        <h2 style={styles.sectionTitle}>Liked meals</h2>
        <p style={styles.sectionDesc}>Dishes you liked from Menuply menus.</p>
        {unlikeError ? <p style={styles.statusErr}>{unlikeError}</p> : null}
        {likedMeals.length === 0 ? (
          <p style={{ margin: 0 }}>
            <span style={styles.muted}>No liked meals yet. </span>
            <Link to="/" style={styles.textBtn}>
              Browse menus
            </Link>
          </p>
        ) : (
          likedMeals.map((meal) => (
            <div key={meal.menu_item_id} style={styles.mealRow}>
              <Link
                to={`/menu-items/${meal.menu_item_id}`}
                style={{ ...styles.actionCopy, textDecoration: "none", color: "inherit" }}
              >
                <p style={styles.actionTitle}>{meal.item_name}</p>
                <p style={styles.muted}>{meal.restaurant_name}</p>
              </Link>
              <button
                type="button"
                style={styles.unlikeBtn}
                disabled={unlikeBusyId === meal.menu_item_id}
                onClick={() => onUnlikeMeal(meal.menu_item_id)}
              >
                {unlikeBusyId === meal.menu_item_id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Orders & food activity</h2>
        <AccountActionLink
          to="/account/feedback"
          title="Send Feedback"
          description="Tell a restaurant privately how a recent Menuply order went, within 45 days."
        />
        <AccountActionLink
          to="/account/im-eating"
          title="I'm Eating At"
          description="Share where you're eating, then optionally Join Me — I'm here now."
          actionLabel="Share"
        />
        <AccountActionLink
          to="/account/diner-status"
          title="Diner Status"
          description="Quick food signals like 🔥 — not star ratings."
          actionLabel="Post"
          last
        />
      </section>

      <section style={{ ...styles.section, ...styles.sectionLast }}>
        <h2 style={styles.sectionTitle}>My Clusters</h2>
        {myClusters.length === 0 ? (
          <p style={{ margin: 0 }}>
            <span style={styles.muted}>You have not created any clusters yet. </span>
            <Link to={clusterDirectoryPath()} style={styles.textBtn}>
              Explore clusters
            </Link>
          </p>
        ) : (
          myClusters.map((cluster, index) => (
            <AccountActionLink
              key={cluster.id}
              to={clusterHref(cluster)}
              title={cluster.name}
              description={`${cluster.visibility} · ${cluster.status} · ${cluster.restaurant_count || 0} restaurants`}
              actionLabel="Open"
              last={index === myClusters.length - 1}
            />
          ))
        )}
      </section>
    </div>
  );
}
