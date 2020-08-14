// This script is injected into every page.
import { isFirefox } from "./env";

export default func => {
  // inject the hook
  if (document instanceof HTMLDocument) {
    const source = ";(" + func.toString() + ")(window)";

    if (isFirefox) {
      // eslint-disable-next-line no-eval
      window.eval(source); // in Firefox, this evaluates on the content window
    } else {
      const script = document.createElement("script");
      script.textContent = source;
      document.documentElement.appendChild(script);
      script.parentNode.removeChild(script);
    }
  }
};
