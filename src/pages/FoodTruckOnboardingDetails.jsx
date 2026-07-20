import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import RestaurantInformationForm from "../components/restaurant/RestaurantInformationForm.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  getOwnedRestaurantInformation,
  markOnboardingStage,
  updateOwnedRestaurantInformation,
} from "../lib/operatorApi.js";
import {
  buildRestaurantInformationPayload,
  emptyRestaurantInformationForm,
  restaurantToInformationForm,
  validateRestaurantInformationForm,
} from "../lib/restaurantInformationSchema.js";
import { isFoodTruckRestaurant } from "../lib/foodTruckOnboarding.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f6f3 0%, #eef5f2 100%)",
    fontFamily: FONT,
  },
  main: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "40px 20px 80px",
  },
  eyebrow: {
    marginTop: 28,
    fontSize: 11,
    fontWeight: 800,
    color: "#1F4E3D",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0",
    fontSize: "clamp(1.6rem, 3.5vw, 2.1rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    color: "#0B0F0C",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 1.55,
  },
  error: {
    marginBottom: 14,
    padding: 12,
    background: "#fff5f5",
    border: "1px solid #ffd2d2",
    borderRadius: 12,
    color: "#7f1d1d",
    fontSize: 14,
  },
  primary: {
    height: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: 0,
    background: "#1F4E3D",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: FONT,
  },
};

export default function FoodTruckOnboardingDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedRestaurant, restaurants, operator, refreshSession } = useOperator();
  const restaurant = selectedRestaurant || restaurants?.[0] || null;
  const restaurantId = Number(restaurant?.id || restaurant?.restaurant_id) || 0;
  const [showActivation, setShowActivation] = useState(() => searchParams.get("activated") === "1");
  const [form, setForm] = useState(emptyRestaurantInformationForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setError("No food-truck restaurant is linked to this account.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getOwnedRestaurantInformation(restaurantId)
      .then((data) => {
        if (cancelled) return;
        const loaded = data?.restaurant || restaurant || {};
        setForm(restaurantToInformationForm(loaded, operator?.email || ""));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Unable to load food-truck details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, operator?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showActivation) return undefined;
    const id = setTimeout(() => {
      setShowActivation(false);
      navigate("/foodtruck/onboarding/details", { replace: true });
    }, 5000);
    return () => clearTimeout(id);
  }, [showActivation, navigate]);

  async function handleComplete() {
    setError("");
    if (!restaurantId || !isFoodTruckRestaurant(restaurant)) {
      setError("This onboarding step is only available for food-truck accounts.");
      return;
    }
    const validation = validateRestaurantInformationForm(form, { complete: true });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setSaving(true);
    try {
      await updateOwnedRestaurantInformation(restaurantId, buildRestaurantInformationPayload(form, { complete: true }));
      await markOnboardingStage(restaurantId, {
        stage_id: "detailed_information_complete",
        status: "completed",
        append_completed_key: "detailed_information_complete",
        current_step_key: "complete",
        extra: { onboarding_kind: "food_truck" },
      });
      await refreshSession().catch(() => {});
      navigate("/operator", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to complete food-truck onboarding.");
    } finally {
      setSaving(false);
    }
  }

  if (showActivation) {
    return (
      <div style={styles.page}>
        <div style={styles.main}>
          <BrandLogo height={44} radius={12} matchPageBackground={false} />
          <div style={styles.eyebrow}>Food-truck onboarding</div>
          <h1 style={styles.title}>Congratulations! Welcome to Menuply.</h1>
          <p style={styles.subtitle}>
            Your Food Truck account is now active.
            <br />
            <br />
            Before entering your Restaurant Operator Panel, let's complete your public restaurant profile. This only takes a few minutes and helps customers discover your business.
            <br />
            <br />
            After your profile is complete, you'll have access to everything you need to manage and grow your business on Menuply.
          </p>
          <div style={{ ...styles.subtitle, color: "#101828" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Once you're in the Restaurant Operator Panel, you can:</div>
            <div>Review and edit your menu</div>
            <div>Review menu prices</div>
            <div>Choose your menu design</div>
            <div>Publish your menu</div>
            <div>Complete your Stripe merchant account setup</div>
            <div>Enable delivery services (optional)</div>
          </div>
          <button
            type="button"
            style={styles.primary}
            onClick={() => {
              setShowActivation(false);
              navigate("/foodtruck/onboarding/details", { replace: true });
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.main}>
          <BrandLogo height={44} radius={12} matchPageBackground={false} />
          <p style={{ marginTop: 28, color: "#6b7280" }}>Loading your public profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.main}>
        <BrandLogo height={44} radius={12} matchPageBackground={false} />
        <div style={styles.eyebrow}>Food-truck onboarding</div>
        <h1 style={styles.title}>Complete your public restaurant profile</h1>
        <p style={styles.subtitle}>
          Add the public details diners will see on your Menuply Food Truck profile. Your account is already active.
        </p>
        {error ? <div style={styles.error}>{error}</div> : null}
        <RestaurantInformationForm
          form={form}
          onChange={setForm}
          disabled={saving}
          emailReadOnly
        />
        <button type="button" style={styles.primary} disabled={saving} onClick={handleComplete}>
          {saving ? "Saving..." : "Save profile and enter Operator Panel"}
        </button>
      </div>
    </div>
  );
}
