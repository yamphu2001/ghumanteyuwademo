/* cspell:disable */

export type AdvancedDeviceReport = {
  deviceId: string;
  collectedAt: string;

  environment: {
    userAgent: string;
    platform: string;
    vendor: string;
    language: string;
    languages: string[];
    timezone: string;
    timeOffset: number;
    devicePixelRatio: number;
  };

  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    orientation?: string;
    multiMonitorHint: boolean;
  };

  hardware: {
    cores: number | null;
    memoryGB: number | null;
    maxTouchPoints: number;
    pointer: "coarse" | "fine";
    hover: boolean;
  };

  webgl: {
    vendor?: string;
    renderer?: string;
    maxTextureSize?: number;
    maxViewportDims?: readonly number[];
    antialias?: boolean;
    error?: string;
  };

  audioEntropy: {
    sampleRate: number;
    fftSize: number;
    frequencyBins: number;
  } | null;

  fonts: string[];

  storage: {
    quotaMB?: number;
    usageMB?: number;
    persistence?: boolean;
  };

  performance: {
    memoryJS: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    } | null;
    timingSupported: boolean;
  };

  network: {
    downlink?: number;
    rtt?: number;
    effectiveType?: string;
    saveData?: boolean;
    online: boolean;
  };

  uiPrefs: {
    darkMode: boolean;
    reducedMotion: boolean;
    contrast: boolean;
    hdr: boolean;
    displayMode: "standalone" | "browser";
  };

  permissions: Record<string, PermissionState>;

  behaviorHints: {
    prefersKeyboard: boolean;
    tabVisible: DocumentVisibilityState;
    historyLength: number;
  };
};

/* ----------------------------------
 * SAFE DEVICE ID GENERATOR
 * ---------------------------------- */
const generateDeviceId = (): string => {
  try {
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);

      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;

      const hex = [...buf].map(b =>
        b.toString(16).padStart(2, "0")
      );

      return `DEV-${hex.slice(0, 4).join("")}-${hex
        .slice(4, 6)
        .join("")}-${hex.slice(6, 8).join("")}-${hex
        .slice(8, 10)
        .join("")}-${hex.slice(10).join("")}`;
    }
  } catch {}

  return `DEV-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
};

/* ----------------------------------
 * MAIN COLLECTOR
 * ---------------------------------- */
export const getUltraDeviceProfile =
  async (): Promise<AdvancedDeviceReport> => {
    const nav = navigator as any;
    const win = window;

    /* DEVICE ID */
    let deviceId: string;
    try {
      deviceId = localStorage.getItem("device_id") || "";
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem("device_id", deviceId);
      }
    } catch {
      deviceId = generateDeviceId();
    }

    /* ENVIRONMENT */
    const environment = {
      userAgent: nav.userAgent,
      platform: nav.platform,
      vendor: nav.vendor,
      language: nav.language,
      languages: nav.languages || [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timeOffset: new Date().getTimezoneOffset(),
      devicePixelRatio: win.devicePixelRatio || 1,
    };

    /* SCREEN */
    const screenInfo = {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: screen.orientation?.type,
      multiMonitorHint: screen.availWidth > screen.width,
    };

    /* HARDWARE */
    const hardware: AdvancedDeviceReport["hardware"] = {
      cores: nav.hardwareConcurrency ?? null,
      memoryGB: nav.deviceMemory ?? null,
      maxTouchPoints: nav.maxTouchPoints ?? 0,
      pointer: win.matchMedia("(pointer: coarse)").matches
        ? "coarse"
        : "fine",
      hover: win.matchMedia("(hover: hover)").matches,
    };

    /* WEBGL */
    let webgl: AdvancedDeviceReport["webgl"] = {};
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;

      if (gl) {
        const debugInfo = gl.getExtension(
          "WEBGL_debug_renderer_info"
        ) as any;

        webgl = {
          vendor: debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            : "masked",
          renderer: debugInfo
            ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            : "masked",
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          antialias: gl.getContextAttributes()?.antialias ?? false,
        };
      }
    } catch {
      webgl = { error: "unavailable" };
    }

    /* AUDIO */
    let audioEntropy: AdvancedDeviceReport["audioEntropy"] = null;
    try {
      const ctx = new (win.AudioContext ||
        (win as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      osc.connect(analyser);

      audioEntropy = {
        sampleRate: ctx.sampleRate,
        fftSize: analyser.fftSize,
        frequencyBins: analyser.frequencyBinCount,
      };

      ctx.close();
    } catch {}

    /* FONTS */
    const knownFonts = [
      "Segoe UI",
      "Roboto",
      "Ubuntu",
      "San Francisco",
      "Noto Sans",
      "Arial",
    ];

    const fonts = document.fonts
      ? knownFonts.filter(f =>
          document.fonts.check(`12px "${f}"`)
        )
      : [];

    /* STORAGE */
    let storage: AdvancedDeviceReport["storage"] = {};
    if (nav.storage?.estimate) {
      const { quota, usage } = await nav.storage.estimate();
      storage = {
        quotaMB: quota ? Math.round(quota / 1024 / 1024) : undefined,
        usageMB: usage ? Math.round(usage / 1024 / 1024) : undefined,
        persistence: nav.storage.persisted
          ? await nav.storage.persisted()
          : false,
      };
    }

    /* PERFORMANCE */
    const performanceInfo: AdvancedDeviceReport["performance"] = {
      memoryJS: (performance as any).memory
        ? {
            jsHeapSizeLimit: (performance as any).memory
              .jsHeapSizeLimit,
            totalJSHeapSize: (performance as any).memory
              .totalJSHeapSize,
            usedJSHeapSize: (performance as any).memory
              .usedJSHeapSize,
          }
        : null,
      timingSupported: typeof performance.now === "function",
    };

    /* NETWORK */
    const network: AdvancedDeviceReport["network"] = {
      downlink: nav.connection?.downlink,
      rtt: nav.connection?.rtt,
      effectiveType: nav.connection?.effectiveType,
      saveData: nav.connection?.saveData,
      online: nav.onLine,
    };

    /* UI PREFS */
    const uiPrefs: AdvancedDeviceReport["uiPrefs"] = {
      darkMode: win.matchMedia("(prefers-color-scheme: dark)").matches,
      reducedMotion: win.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches,
      contrast: win.matchMedia("(prefers-contrast: more)").matches,
      hdr: win.matchMedia("(dynamic-range: high)").matches,
      displayMode: win.matchMedia("(display-mode: standalone)").matches
        ? "standalone"
        : "browser",
    };

    /* PERMISSIONS */
    const permissions: Record<string, PermissionState> = {};
    if (nav.permissions?.query) {
      const keys = [
        // "notifications",
        "camera",
        "microphone",
        "geolocation",
      ];
      for (const key of keys) {
        try {
          const p = await nav.permissions.query({ name: key });
          permissions[key] = p.state;
        } catch {}
      }
    }

    /* BEHAVIOR */
    const behaviorHints = {
      prefersKeyboard:
        !("ontouchstart" in window) || nav.maxTouchPoints === 0,
      tabVisible: document.visibilityState,
      historyLength: history.length,
    };

    return {
      deviceId,
      collectedAt: new Date().toISOString(),
      environment,
      screen: screenInfo,
      hardware,
      webgl,
      audioEntropy,
      fonts,
      storage,
      performance: performanceInfo,
      network,
      uiPrefs,
      permissions,
      behaviorHints,
    };
  };
