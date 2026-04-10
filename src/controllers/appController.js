const { getLatestVersion } = require('../services/appVersionService');

exports.getAppVersion = async (req, res) => {
    try {
        const currentVersionCode = parseInt(req.query.versionCode || "0");

        const latest = await getLatestVersion();

        if (!latest) {
            return res.json({
                ok: false,
                error: "No hay versiones cargadas"
            });
        }

        return res.json({
            ok: true,
            latestVersionCode: latest.version_code,
            latestVersionName: latest.version_name,
            minSupportedVersionCode: latest.min_supported_version_code,
            forceUpdate: latest.force_update,
            apkUrl: latest.apk_url,
            message: latest.message,
            hasUpdate: currentVersionCode < latest.version_code
        });

    } catch (error) {
        console.error("Error en /app/version:", error);
        return res.status(500).json({
            ok: false,
            error: "Error interno"
        });
    }
};