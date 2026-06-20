'use strict';

const background = (() => {
  const listeners = {};

  chrome.runtime.onMessage.addListener((request) => {
    if (request && request.path === "background-to-options") {
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
      if (id) {
        chrome.runtime.sendMessage({
          method: id,
          data: data,
          path: "options-to-background"
        }, () => chrome.runtime.lastError);
      }
    }
  };
})();

const config = {
  prefMap: {},

  set(o) {
    if (o && o.pref && config.prefMap[o.pref]) {
      config.prefMap[o.pref].value = o.value;
    }
  },

  load() {
    const prefs = [...document.querySelectorAll("*[data-pref]")];
    prefs.forEach((elem) => {
      const pref = elem.getAttribute("data-pref");
      if (pref) {
        config.prefMap[pref] = config.connect(elem);
      }
    });

    window.removeEventListener("load", config.load, false);
  },

  connect(elem) {
    let propName = "value";
    if (elem) {
      if (elem.type === "checkbox") propName = "checked";
      if (elem.localName === "span") propName = "textContent";
      if (elem.localName === "select") propName = "selectedIndex";

      const pref = elem.getAttribute("data-pref");
      background.send("get", pref);

      elem.addEventListener("change", function () {
        background.send("changed", {
          pref: pref,
          value: this[propName]
        });
      });
    }

    return {
      get value() {
        return elem ? elem[propName] : undefined;
      },
      set value(val) {
        if (!elem || elem.type === "file") return;
        elem[propName] = val;
      }
    };
  }
};

background.receive("set", config.set);
window.addEventListener("load", config.load, false);