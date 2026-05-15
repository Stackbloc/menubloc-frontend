import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyDocumentSocialMetadata } from "../components/share/shareUtils.js";
import { staticPageMeta } from "../seo/staticPageMeta.js";

export function usePageMeta(overrideMeta) {
  const location = useLocation();

  useEffect(() => {
    const meta = overrideMeta || staticPageMeta[location.pathname];
    if (!meta) return;

    const cleanup = applyDocumentSocialMetadata({
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
      image: meta.ogImage,
    });

    return cleanup;
  }, [location.pathname, overrideMeta]);
}
