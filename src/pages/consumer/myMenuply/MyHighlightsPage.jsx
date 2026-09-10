/**
 * Full My Highlights page — Instagram-style square grid of all diner media pins.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useConsumer } from "../../../context/ConsumerContext.jsx";
import {
  deleteConsumerProfileMedia,
  listConsumerProfileMedia,
  setConsumerProfileMediaHighlight,
  uploadConsumerProfileMedia,
} from "../../../lib/consumerApi.js";
import {
  MY_MENUPLY_HIGHLIGHTS_PATH,
  MY_MENUPLY_PROFILE_PATH,
} from "../../../lib/myMenuplyRoutes.js";
import MyHighlightsGrid from "./MyHighlightsGrid.jsx";
import ProfileGalleryComposeSheet from "./ProfileGalleryComposeSheet.jsx";
import { buildTopHighlights } from "./myMenuplyPresentation.js";
import * as s from "./myMenuplyStyles.js";

export default function MyHighlightsPage() {
  const { isAuthenticated } = useConsumer();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profileMedia, setProfileMedia] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaSource, setMediaSource] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await listConsumerProfileMedia();
      setProfileMedia(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err.message || "Unable to load highlights");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/account/login?next=${encodeURIComponent(MY_MENUPLY_HIGHLIGHTS_PATH)}`, {
        replace: true,
      });
      return;
    }
    load();
  }, [isAuthenticated, load, navigate]);

  useEffect(() => {
    if (searchParams.get("compose") === "add") {
      setPickerOpen(true);
      setMediaSource(null);
    }
  }, [searchParams]);

  const cards = useMemo(() => {
    const pinned = (profileMedia || []).filter((row) => row?.is_highlight);
    return buildTopHighlights({ profileHighlightMedia: pinned });
  }, [profileMedia]);

  async function onFile(file, opts = {}) {
    setPickerOpen(false);
    setMediaSource(null);
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await uploadConsumerProfileMedia(file, {
        is_highlight: opts.is_highlight !== false,
      });
      const item = data?.item;
      if (item) setProfileMedia((prev) => [...prev, item]);
    } catch (err) {
      setError(err.message || "Unable to upload");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(card) {
    if (!card?.media_id) return;
    setDeleteBusy(true);
    setError("");
    try {
      await setConsumerProfileMediaHighlight(card.media_id, false);
      setProfileMedia((prev) =>
        prev.map((row) =>
          Number(row.id) === Number(card.media_id) ? { ...row, is_highlight: false } : row
        )
      );
    } catch (err) {
      try {
        await deleteConsumerProfileMedia(card.media_id);
        setProfileMedia((prev) => prev.filter((row) => Number(row.id) !== Number(card.media_id)));
      } catch (inner) {
        setError(inner.message || err.message || "Unable to remove highlight");
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div style={pageStyles.page} data-testid="my-highlights-page">
      <div style={pageStyles.topBar}>
        <Link to={MY_MENUPLY_PROFILE_PATH} style={pageStyles.back} data-testid="my-highlights-back">
          ← Profile
        </Link>
      </div>
      {error ? <p style={s.errorText || pageStyles.error}>{error}</p> : null}
      {busy && !cards.length ? <p style={pageStyles.muted}>Loading…</p> : null}
      <MyHighlightsGrid
        cards={cards}
        readOnly={false}
        preview={false}
        onAdd={() => {
          setPickerOpen(true);
          setMediaSource(null);
        }}
        onDelete={onDelete}
        deleteBusy={deleteBusy}
      />
      <ProfileGalleryComposeSheet
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setMediaSource(null);
        }}
        mediaSource={mediaSource}
        onMediaSourceChange={setMediaSource}
        busy={busy}
        onFile={onFile}
        preferHighlight
      />
    </div>
  );
}

const pageStyles = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "16px 16px 96px",
  },
  topBar: {
    marginBottom: 8,
  },
  back: {
    fontSize: 14,
    fontWeight: 700,
    color: "#14532d",
    textDecoration: "none",
  },
  muted: { color: "#64748b", fontSize: 14 },
  error: { color: "#b91c1c", fontSize: 14 },
};
