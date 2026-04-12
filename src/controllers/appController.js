const { getLatestVersion } = require('../services/appVersionService');

exports.getAppVersion = async (req, res) => {
    try {
        const latest = await getLatestVersion();

        if (!latest) {
            return res.json({
                ok: false,
                error: "No hay versiones cargadas"
            });
        }

        return res.json({
            ok: true,
            latestVersionName: latest.version_name,
            latestVersionCode: latest.version_code,
            apkUrl: latest.apk_url,
            message: latest.message,
            forceUpdate: true,
            minSupportedVersionCode: latest.version_code
        });

    } catch (error) {
        console.error("Error en /app/version:", error);
        return res.status(500).json({
            ok: false,
            error: "Error interno"
        });
    }
};
