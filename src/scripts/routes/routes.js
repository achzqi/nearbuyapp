import UrlParser from "./url-parser.js";
import HomePage from "../pages/home/home-page.js";
import aboutPage from "../pages/about/about-page.js";
import nearby from "../pages/nearby/nearby-product.js";
import login from "../pages/user/login.js";
import regis from "../pages/user/regis.js";
import tambahBarang from "../pages/tambahBarang/tambah-product.js";
import saved from "../pages/saved/saved.js";

let lastRoute = "/";

export const router = () => {
  const app = document.querySelector("#app");
  const url = UrlParser.parseActiveUrlWithCombiner();
  let page;
  let transitionType = "slide";

  if (url === "/") page = HomePage;
  else if (url === "/about") page = aboutPage;
  else if (url === "/nearby") page = nearby;
  else if (url === "/tambahkan") page = tambahBarang;
  else if (url === "/login") page = login;
  else if (url === "/regis") page = regis;
  else if (url === "/saved") page = saved;
  else page = { render: () => "<h2>404 - Halaman tidak ditemukan</h2>" };

  lastRoute = url;
  app.dataset.transition = transitionType;

  const doTransition = (updateDOM) => {
    if (document.startViewTransition) {
      try {
        document.startViewTransition(() => {
          updateDOM();
        });
      } catch (e) {
        updateDOM();
      }
    } else {
      app.classList.remove("slide-in");
      app.classList.add("slide-out");
      setTimeout(() => {
        updateDOM();
        app.classList.remove("slide-out");
        app.classList.add("slide-in");
      }, 200);
    }
  };

  doTransition(async () => {
    app.innerHTML = await page.render();
    if (page.afterRender) await page.afterRender(); // pastikan ini async
    lastRoute = url;
  });
};
