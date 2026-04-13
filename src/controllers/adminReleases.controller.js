const {
  listReleases,
  createRelease,
  activateRelease,
  deleteRelease,
} = require("../repositories/release.repository");

function parseIdParam(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    res.status(400).json({ ok: false, error: "invalid_id" });
    return null;
  }
  return id;
}

async function getReleases(req, res) {
  try {
    const releases = await listReleases();
    return res.json({ ok: true, data: releases });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function postRelease(req, res) {
  try {
    const { version_name, version_code, apk_url, message } = req.body || {};

    if (
      typeof version_name !== "string" ||
      version_name.trim() === "" ||
      (typeof version_code !== "number" && typeof version_code !== "string") ||
      (typeof apk_url !== "string" || apk_url.trim() === "") ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        ok: false,
        error: "missing_or_invalid_fields",
        required: ["version_name", "version_code", "apk_url", "message"],
      });
    }

    const versionCode = parseInt(version_code, 10);
    if (!Number.isFinite(versionCode) || versionCode <= 0) {
      return res.status(400).json({ ok: false, error: "invalid_version_code" });
    }

    const created = await createRelease({
      versionName: version_name.trim(),
      versionCode,
      apkUrl: apk_url.trim(),
      message,
    });

    return res.status(201).json({ ok: true, data: created });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function activateReleaseById(req, res) {
  try {
    const id = parseIdParam(req, res);
    if (id === null) return;

    const updated = await activateRelease(id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: "release_not_found" });
    }

    return res.json({ ok: true, data: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

async function deleteReleaseById(req, res) {
  try {
    const id = parseIdParam(req, res);
    if (id === null) return;

    const deleted = await deleteRelease(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "release_not_found" });
    }

    return res.json({ ok: true, data: deleted });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

module.exports = {
  getReleases,
  postRelease,
  activateReleaseById,
  deleteReleaseById,
};
