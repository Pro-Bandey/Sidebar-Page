'use strict';

const background = (() => {
  const listeners = {};

  chrome.runtime.onMessage.addListener((request) => {
    if (request && request.path === "background-to-page") {
      const callback = listeners[request.method];
      if (typeof callback === "function") {
        callback(request.data);
      }
    }
  });

  return {
    receive(id, callback) {
      if (id) {
        listeners[id] = callback;
      }
    },
    send(id, data) {
      chrome.runtime.sendMessage({
        method: id,
        data: data,
        path: "page-to-background"
      }, () => chrome.runtime.lastError);
    }
  };
})();

const config = {
  load() {
    background.send("scrollbar");
  },
  message(e) {
    if (e && e.data) {
      if (e.data.action) {
        if (e.data.action.back) {
          window.history.back();
        }
        if (e.data.action.forward) {
          window.history.forward();
        }
        if (e.data.action.reload) {
          document.location.reload();
        }
      }

      if (e.data.scrollbar && e.data.scrollbar.hide) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        const iframe = document.querySelector("iframe");
        if (iframe) {
          iframe.setAttribute("scrolling", "no");
        }
      }
    }
  }
};

window.addEventListener("load", config.load, false);
window.addEventListener("message", config.message, false);