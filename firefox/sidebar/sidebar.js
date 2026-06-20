'use strict';

const background = {
  port: null,
  message: {},
  receive(id, callback) {
    if (id) {
      this.message[id] = callback;
    }
  },
  send(id, data) {
    if (id) {
      chrome.runtime.sendMessage({
        method: id,
        data: data,
        path: "sidebar-to-background"
      }, () => chrome.runtime.lastError);
    }
  },
  connect(port) {
    chrome.runtime.onMessage.addListener(this.listener.bind(this));
    if (port) {
      this.port = port;
      this.port.onMessage.addListener(this.listener.bind(this));
      this.port.onDisconnect.addListener(() => {
        this.port = null;
      });
    }
  },
  post(id, data) {
    if (id && this.port) {
      this.port.postMessage({
        method: id,
        data: data,
        port: this.port.name,
        path: "sidebar-to-background"
      });
    }
  },
  listener(e) {
    if (e && e.path === "background-to-sidebar") {
      const callback = this.message[e.method];
      if (typeof callback === "function") {
        callback(e.data);
      }
    }
  }
};

const config = {
  scrollbar(e) {
    if (e && e.hide) {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.setAttribute("scrolling", "no");
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        iframe.contentWindow.postMessage({ scrollbar: { hide: e.hide } }, '*');
      }
    }
  },
  action: {
    back() {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.contentWindow.postMessage({ action: { back: true } }, '*');
      }
    },
    forward() {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.contentWindow.postMessage({ action: { forward: true } }, '*');
      }
    },
    reload() {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.contentWindow.postMessage({ action: { reload: true } }, '*');
      }
    }
  },
  render(e) {
    const iframe = document.querySelector("iframe");
    const footer = document.getElementById("footer");
    const loader = document.querySelector(".loader");
    const urlInput = document.getElementById("sidebar-url-input");

    document.documentElement.setAttribute("toolbar", e.toolbar ? "hide" : "show");

    if (e.url) {
      if (urlInput) {
        urlInput.value = e.url;
      }
      if (iframe) {
        if (iframe.src === "about:blank") {
          let rawUrl = e.url;
          if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            rawUrl = "https://" + rawUrl;
          }

          try {
            const validUrl = new URL(rawUrl);
            if (footer) footer.style.display = "none";
            if (loader) loader.style.display = "none";
            iframe.src = validUrl.href;
          } catch (err) {
            if (footer) {
              footer.textContent = `Error - ${err.message}`;
            }
          }
        }
      }
    }
  },
  load() {
    const bindClick = (id, handler) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("click", handler);
      }
    };

    bindClick("back", config.action.back);
    bindClick("reload", config.action.reload);
    bindClick("forward", config.action.forward);

    bindClick("open", () => background.send("openin"));
    bindClick("footer", () => background.send("options"));
    bindClick("options", () => background.send("options"));

    bindClick("hide", () => {
      document.documentElement.setAttribute("toolbar", "hide");
    });

    bindClick("refresh", () => {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.src = iframe.src;
      }
    });

    const urlInput = document.getElementById("sidebar-url-input");
    if (urlInput) {
      urlInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          let rawUrl = urlInput.value.trim();
          if (!rawUrl) return;
          if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            rawUrl = "https://" + rawUrl;
          }
          try {
            const validUrl = new URL(rawUrl);
            const iframe = document.querySelector("iframe");
            const footer = document.getElementById("footer");
            const loader = document.querySelector(".loader");

            if (iframe) {
              iframe.src = validUrl.href;
            }
            if (footer) footer.style.display = "none";
            if (loader) loader.style.display = "none";
            background.send("url-changed", { url: validUrl.href });
          } catch (err) {
            const footer = document.getElementById("footer");
            if (footer) {
              footer.style.display = "block";
              footer.textContent = "Error - Invalid web address structure.";
            }
          }
        }
      });
    }
    background.send("load");
    window.removeEventListener("load", config.load, false);
  }
};

background.receive("storage", config.render);
background.receive("scrollbar", config.scrollbar);
window.addEventListener("load", config.load, false);
background.connect(chrome.runtime.connect({ name: "sidebar" }));