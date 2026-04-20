export const VI_TOKENS_CSS = `
  .vi-root {
    --visual-primary: 262 83% 58%;
    --visual-primary-light: 262 83% 92%;
    --visual-math: 340 82% 52%;
    --visual-reading: 199 89% 48%;
    --visual-science: 142 71% 45%;
    --visual-sel: 43 100% 50%;
    --visual-bg: 0 0% 98%;
    --visual-surface: 0 0% 100%;
    --visual-text: 220 20% 20%;
    font-family: var(--font-nunito), 'Nunito', sans-serif;
    background-color: hsl(var(--visual-bg));
    color: hsl(var(--visual-text));
  }
  .vi-root h1, .vi-root h2, .vi-root h3, .vi-root h4 {
    font-family: var(--font-fredoka), 'Quicksand', sans-serif;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .vi-card {
    background-color: hsl(var(--visual-surface));
    border-radius: 24px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.04);
    border: 2px solid rgba(0,0,0,0.02);
  }
`;

export function ViTokens() {
  return <style dangerouslySetInnerHTML={{ __html: VI_TOKENS_CSS }} />;
}
