import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LEGAL_VERSIONS } from "../content/legal.js";
import {
  persistRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const PLAN_SELECTION_ROUTE = "/restaurant/subscription";

function describeError(err) {
  const msg = String(err?.message || "").trim();
  const status = Number(err?.status) || 0;
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return {
      title: "We could not reach Menuply right now.",
      detail: "Check your connection and try again. Your details are still here.",
    };
  }
  if (status === 400 || status === 409 || status === 422) {
    return {
      title: msg || "We need a few details corrected before we can create your account.",
      detail: "Review the fields above and try again.",
    };
  }
  return {
    title: msg || "Something went wrong.",
    detail: "Your entered information is still here — please retry.",
  };
}

function validate(form, agreements) {
  const errors = {};
  if (!form.restaurant_name.trim()) errors.restaurant_name = "Restaurant name is required.";
  if (!form.email.trim()) errors.email = "Email address is required.";
  if (!form.password) errors.password = "Password is required.";
  else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State is required.";
  if (!agreements.merchantTerms) errors.merchantTerms = "You must agree to the Merchant Terms of Service.";
  if (!agreements.privacyPolicy) errors.privacyPolicy = "You must agree to the Privacy Policy.";
  return errors;
}

/**
 * Manages all form state, validation, and API submission for the founders signup flow.
 *
 * @param {{ urlCity: string, urlState: string }} options - pre-fill values from URL params
 */
export function useFoundersSignupFlow({ urlCity = "", urlState = "" } = {}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    restaurant_name: "",
    contact_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: urlCity,
    state: urlState,
    phone: "",
  });
  const [agreements, setAgreements] = useState({
    merchantTerms: false,
    privacyPolicy: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [serverErrorDetail, setServerErrorDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleAgreementChange(event) {
    const { name, checked } = event.target;
    setAgreements((prev) => ({ ...prev, [name]: checked }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    setServerErrorDetail("");

    const errors = validate(form, agreements);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        restaurant_name: form.restaurant_name.trim(),
        manager_name: form.contact_name.trim() || null,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        phone: form.phone.trim() || null,
        signup_source: "founders_national",
        legal_acceptances: [
          { document_key: "merchant_terms", document_version: LEGAL_VERSIONS.merchantTerms },
          { document_key: "privacy_policy", document_version: LEGAL_VERSIONS.privacyPolicy },
        ],
      };

      const res = await fetch(`${API}/owner/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const err = new Error(data?.error || `Signup failed (${res.status})`);
        err.status = res.status;
        throw err;
      }

      const { restaurant, owner_token } = data;
      const baseState = persistRestaurantOnboardingState({
        restaurant_id: restaurant.id,
        restaurant_name: form.restaurant_name.trim(),
        email: form.email.trim(),
        owner_token,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        phone: form.phone.trim(),
        ingestion_method: "later",
        selected_plan: null,
      });

      const draftState = await syncRestaurantOnboardingProgress(baseState, {
        current_step_key: "choose_plan",
        completed_step_keys: ["create_operator_account", "public_restaurant_information"],
        intake_path: "founders_national",
        requested_location_count: 1,
        selected_plan_code: null,
        manual_review_required: false,
        draft_payload: {
          temporary_selections: {
            selected_plan_code: null,
            menu_upload_mode: "upload_later",
            onboarding_source: "founders_national",
          },
          optional_modules: {
            qr_starter_kit: { status: "not_started" },
          },
        },
      });

      navigate("/operator/verify-email", {
        replace: true,
        state: {
          ...draftState,
          nextPath: PLAN_SELECTION_ROUTE,
          autoSend: true,
        },
      });
    } catch (err) {
      const failure = describeError(err);
      setServerError(failure.title);
      setServerErrorDetail(failure.detail);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    agreements,
    fieldErrors,
    serverError,
    serverErrorDetail,
    submitting,
    handleChange,
    handleAgreementChange,
    handleSubmit,
  };
}
