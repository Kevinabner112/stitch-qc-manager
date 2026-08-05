export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0ea5e9",
        "on-primary": "#ffffff",
        "primary-container": "#bae6fd",
        "on-primary-container": "#0369a1",
        
        "primary-fixed": "#e0f2fe",
        "on-primary-fixed": "#0c4a6e",
        "primary-fixed-variant": "#7dd3fc",
        "on-primary-fixed-variant": "#0284c7",

        "secondary": "#38bdf8",
        "on-secondary": "#ffffff",
        "secondary-container": "#e0f2fe",
        "on-secondary-container": "#0369a1",
        
        "tertiary": "#06b6d4",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#cffafe",
        "on-tertiary-container": "#0891b2",

        "background": "#f0f9ff",
        "on-background": "#0f172a",
        
        "surface": "#ffffff",
        "on-surface": "#0f172a",
        "surface-variant": "#e2e8f0",
        "on-surface-variant": "#475569",
        
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8fafc",
        "surface-container": "#f1f5f9",
        "surface-container-high": "#e2e8f0",
        "surface-container-highest": "#cbd5e1",
        
        "outline": "#cbd5e1",
        "outline-variant": "#e2e8f0",
        
        "error": "#ef4444",
        "on-error": "#ffffff",
        "error-container": "#fee2e2",
        "on-error-container": "#b91c1c",
        
        "success": "#10b981",
        "on-success": "#ffffff",
        "success-container": "#d1fae5",
        "on-success-container": "#047857",
        
        "warning": "#f59e0b",
        "on-warning": "#ffffff",
        "warning-container": "#fef3c7",
        "on-warning-container": "#b45309"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        lg: "24px",
        sm: "8px",
        "container-margin": "16px",
        base: "4px",
        xs: "4px",
        gutter: "12px",
        xl: "32px",
        md: "16px"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "data-mono": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "data-mono": ["14px", { lineHeight: "20px", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "700" }]
      }
    }
  },
  plugins: [],
}
