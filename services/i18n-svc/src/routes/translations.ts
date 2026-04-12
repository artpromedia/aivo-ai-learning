import { FastifyInstance } from "fastify";

  const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "pt", "zh", "ja", "ko", "ar", "hi"];

  const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      "app.title": "AIVO Learning",
      "nav.home": "Home",
      "nav.dashboard": "Dashboard",
      "nav.login": "Sign In",
      "nav.signup": "Get Started",
      "tutor.start": "Start Session",
      "tutor.end": "End Session",
      "assessment.begin": "Begin Assessment",
      "brain.title": "Brain Profile",
      "learner.level": "Functioning Level",
    },
    es: {
      "app.title": "AIVO Aprendizaje",
      "nav.home": "Inicio",
      "nav.dashboard": "Panel",
      "nav.login": "Iniciar Sesión",
      "nav.signup": "Comenzar",
      "tutor.start": "Iniciar Sesión",
      "tutor.end": "Terminar Sesión",
      "assessment.begin": "Comenzar Evaluación",
      "brain.title": "Perfil Cerebral",
      "learner.level": "Nivel de Funcionamiento",
    },
  };

  export function registerTranslationRoutes(app: FastifyInstance, db: any) {
    app.get("/api/i18n/locales", async () => {
      return { locales: SUPPORTED_LOCALES, default: "en" };
    });

    app.get("/api/i18n/translations/:locale", async (request, reply) => {
      const { locale } = request.params as any;
      if (!SUPPORTED_LOCALES.includes(locale)) {
        return reply.code(404).send({ error: "Locale not supported", supported: SUPPORTED_LOCALES });
      }
      return { locale, translations: DEFAULT_TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS.en };
    });

    app.get("/api/i18n/translations/:locale/:namespace", async (request, reply) => {
      const { locale, namespace } = request.params as any;
      const all = DEFAULT_TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS.en;
      const filtered: Record<string, string> = {};
      for (const [key, val] of Object.entries(all)) {
        if (key.startsWith(namespace + ".")) filtered[key] = val;
      }
      return { locale, namespace, translations: filtered };
    });

    app.post("/api/i18n/detect", async (request) => {
      const { text } = request.body as any;
      return { detected: "en", confidence: 0.95, alternatives: [{ locale: "es", confidence: 0.03 }] };
    });

    app.get("/api/i18n/content/:contentId/:locale", async (request, reply) => {
      const { contentId, locale } = request.params as any;
      return { contentId, locale, status: "original", content: null };
    });
  }
