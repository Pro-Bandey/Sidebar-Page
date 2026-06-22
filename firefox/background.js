'use strict';

const app = {};

const borwserApi = typeof browser !== "undefined" ? browser : chrotme;

app.error = () => borwserApi.runtime.lastError;

app.storage = {
    local: {},
    read(id) {
        return this.local[id];
    },
    update(callback) {
        borwserApi.storage.local.get(null, (e) => {
            this.local = e || {};
            if (callback) callback("update");
        });
    },
    write(id, data, callback) {
        this.local[id] = data;
        borwserApi.storage.local.set({ [id]: data }, (e) => {
            if (callback) callback(e);
        });
    },
    load(callback) {
        const keys = Object.keys(this.local);
        if (keys && keys.length) {
            if (callback) callback("cache");
        } else {
            this.update(() => {
                if (callback) callback("disk");
            });
        }
    }
};

const config = {
    log: false,
    welcome: {
        set lastupdate(val) { app.storage.write("lastupdate", val); },
        get lastupdate() { return app.storage.read("lastupdate") !== undefined ? app.storage.read("lastupdate") : 0; }
    },
    sidebar: {
        set unload(val) { app.storage.write("unload", val); },
        set url(val) { app.storage.write("website-url", val); },
        set toolbar(val) { app.storage.write("toolbar", val); },
        set iframe(val) { app.storage.write("popup-iframe", val); },
        set scrollbar(val) { app.storage.write("scrollbar", val); },
        set mobile(val) { app.storage.write("mobile-view-index", val); },
        get width() { return app.storage.read("width") !== undefined ? app.storage.read("width") : 600; },
        get height() { return app.storage.read("height") !== undefined ? app.storage.read("height") : 600; },
        get unload() { return app.storage.read("unload") !== undefined ? app.storage.read("unload") : false; },
        get toolbar() { return app.storage.read("toolbar") !== undefined ? app.storage.read("toolbar") : false; },
        get url() { return app.storage.read("website-url") !== undefined ? app.storage.read("website-url") : ''; },
        get scrollbar() { return app.storage.read("scrollbar") !== undefined ? app.storage.read("scrollbar") : false; },
        get iframe() { return app.storage.read("popup-iframe") !== undefined ? app.storage.read("popup-iframe") : true; },
        get mobile() { return app.storage.read("mobile-view-index") !== undefined ? app.storage.read("mobile-view-index") : 0; },
        set width(val) {
            let num = parseInt(val, 10);
            if (isNaN(num) || num < 200) num = 400;
            app.storage.write("width", num);
        },
        set height(val) {
            let num = parseInt(val, 10);
            if (isNaN(num) || num < 200) num = 500;
            app.storage.write("height", num);
        }
    },
    addon: {
        set xframe(val) { app.storage.write("xframe", val); },
        set ads(val) { app.storage.write("addon-ads", val); },
        get xframe() { return app.storage.read("xframe") !== undefined ? app.storage.read("xframe") : true; },
        get ads() { return app.storage.read("addon-ads") !== undefined ? app.storage.read("addon-ads") : false; },
        regexps: [
            "\\%22ad", "\\&adfmt\\=", "\\.atdmt\\.", "watch7ad\\_", "\\/api\\/ads", "\\.innovid\\.",
            "\\/adsales\\/", "\\/adserver\\/", "\\.fwmrm\\.net", "\\/stats\\/ads", "ad\\d-\\w*\\.swf$",
            "\\.doubleclick\\.", "flashtalking\\.com", "adservice\\.google\\.", "\\/www\\-advertise\\.",
            "s0\\.2mdn\\.net\\/ads", "google\\-analytics\\.", "\\.googleadservices\\.", "\\.googletagservices\\.",
            "\\.googlesyndication\\.", "\\.serving\\-sys\\.com\\/", "youtube\\.com\\/get_midroll_",
            "youtube\\.com\\/ptracking\\?", ":\\/\\/.*\\.google\\.com\\/uds\\/afs",
            "\\/csi\\?v\\=\\d+\\&s\\=youtube\\&action\\=",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]ad[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]ads[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]adid[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]adunit[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]adhost[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]adview[\\=\\&\\_\\-\\.\\/\\?\\s]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]pagead[\\=\\&\\_\\-\\.\\/\\?\\s\\d]",
            "[\\=\\&\\_\\-\\.\\/\\?\\s]googleads[\\=\\&\\_\\-\\.\\/\\?\\s]"
        ]
    },
    get(name) {
        return name.split('.').reduce((p, c) => p[c], config);
    },
    set(name, value) {
        const _set = function (path, val, scope) {
            const keys = path.split('.');
            if (keys.length > 1) {
                _set.call((scope || this)[keys.shift()], keys.join('.'), val);
            } else {
                this[keys[0]] = val;
            }
        };
        _set(name, value, config);
    }
};

app.options = {
    port: null,
    message: {},
    receive(id, callback) {
        if (id) this.message[id] = callback;
    },
    send(id, data) {
        if (id) {
            borwserApi.runtime.sendMessage({ data, method: id, path: "background-to-options" }, app.error);
        }
    },
    post(id, data) {
        if (id && this.port) {
            this.port.postMessage({ data, method: id, path: "background-to-options" });
        }
    }
};

app.sidebar = {
    port: null,
    message: {},
    receive(id, callback) {
        if (id) this.message[id] = callback;
    },
    send(id, data) {
        if (id) {
            borwserApi.runtime.sendMessage({ data, method: id, path: "background-to-sidebar" }, app.error);
        }
    },
    post(id, data) {
        if (id && this.port) {
            this.port.postMessage({ data, method: id, path: "background-to-sidebar" });
        }
    },
    behavior(e, callback) {
        if (borwserApi.sidePanel) {
            borwserApi.sidePanel.setPanelBehavior(e).catch((error) => {
                if (callback) callback(error);
            });
        }
    }
};

app.button = {
    icon(tabId, state) {
        const path = {
            "16": `icons/${state}/16.png`,
            "32": `icons/${state}/32.png`,
            "48": `icons/${state}/48.png`,
            "64": `icons/${state}/64.png`
        };
        const options = { path };
        if (tabId) options.tabId = tabId;
        borwserApi.action.setIcon(options, app.error);
    }
};

app.tab = {
    options() {
        borwserApi.runtime.openOptionsPage();
    },
    query: {
        index(callback) {
            borwserApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length) {
                    callback(tabs[0].index);
                } else {
                    callback(undefined);
                }
            });
        }
    },
    open(url, index, active, callback) {
        const properties = {
            url,
            active: active !== undefined ? active : true
        };
        if (index !== undefined && typeof index === "number") {
            properties.index = index + 1;
        }
        borwserApi.tabs.create(properties, (tab) => {
            if (callback) callback(tab);
        });
    }
};

app.page = {
    port: null,
    message: {},
    sender: {
        port: {}
    },
    receive(id, callback) {
        if (id) this.message[id] = callback;
    },
    post(id, data, tabId) {
        if (id) {
            if (tabId && this.sender.port[tabId]) {
                this.sender.port[tabId].postMessage({ data, method: id, path: "background-to-page" });
            } else if (this.port) {
                this.port.postMessage({ data, method: id, path: "background-to-page" });
            }
        }
    },
    send(id, data, tabId, frameId) {
        if (id) {
            borwserApi.tabs.query({}, (tabs) => {
                if (tabs && tabs.length) {
                    const message = {
                        method: id,
                        data: data || {},
                        path: "background-to-page"
                    };
                    tabs.forEach((tab) => {
                        if (tab) {
                            message.data.tabId = message.data.tabId !== undefined ? message.data.tabId : tab.id;
                            message.data.top = message.data.top !== undefined ? message.data.top : (tab.url || '');
                            message.data.title = message.data.title !== undefined ? message.data.title : (tab.title || '');
                            if (tabId !== null && tabId !== undefined) {
                                if (tabId === tab.id) {
                                    if (frameId !== null && frameId !== undefined) {
                                        borwserApi.tabs.sendMessage(tab.id, message, { frameId }, app.error);
                                    } else {
                                        borwserApi.tabs.sendMessage(tab.id, message, app.error);
                                    }
                                }
                            } else {
                                borwserApi.tabs.sendMessage(tab.id, message, app.error);
                            }
                        }
                    });
                }
            });
        }
    }
};

app.netrequest = {
    display: {
        badge: {
            async text(enabled) {
                if (borwserApi.declarativeNetRequest && borwserApi.declarativeNetRequest.setExtensionActionOptions) {
                    const displayActionCountAsBadgeText = enabled !== undefined ? enabled : true;
                    await borwserApi.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText });
                }
            }
        }
    },
    engine: {
        rulesets: {
            update(options) {
                return new Promise((resolve, reject) => {
                    app.storage.load(() => {
                        if (borwserApi.declarativeNetRequest) {
                            borwserApi.declarativeNetRequest.updateEnabledRulesets(options).then(resolve).catch(reject);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        },
        rules: {
            get() {
                return new Promise((resolve, reject) => {
                    app.storage.load(() => {
                        if (borwserApi.declarativeNetRequest) {
                            if (app.netrequest.rules.scope === "dynamic") {
                                borwserApi.declarativeNetRequest.getDynamicRules().then(resolve).catch(reject);
                            } else {
                                borwserApi.declarativeNetRequest.getSessionRules().then(resolve).catch(reject);
                            }
                        } else {
                            resolve([]);
                        }
                    });
                });
            },
            update(options) {
                return new Promise((resolve, reject) => {
                    app.storage.load(() => {
                        if (borwserApi.declarativeNetRequest) {
                            if (app.netrequest.rules.scope === "dynamic") {
                                borwserApi.declarativeNetRequest.updateDynamicRules(options).then(resolve).catch(reject);
                            } else {
                                borwserApi.declarativeNetRequest.updateSessionRules(options).then(resolve).catch(reject);
                            }
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }
    },
    rules: {
        stack: [],
        set scope(val) { app.storage.write("rulescope", val); },
        get scope() { return app.storage.read("rulescope") !== undefined ? app.storage.read("rulescope") : "dynamic"; },
        async update() {
            const addRules = this.stack;
            if (addRules && addRules.length) {
                const removeRuleIds = addRules.map(e => e.id);
                if (removeRuleIds && removeRuleIds.length) {
                    await app.netrequest.engine.rules.update({ addRules, removeRuleIds });
                }
            }
        },
        push(e) {
            if (e && e.action && e.condition) {
                const id = e.id !== undefined ? e.id : this.find.next.available.id();
                if (id) {
                    const test = this.stack.filter(rule => rule.id === id);
                    if (test.length === 0) {
                        this.stack.push({
                            id,
                            action: e.action,
                            condition: e.condition,
                            priority: e.priority !== undefined ? e.priority : 1
                        });
                    }
                }
            }
        },
        find: {
            next: {
                available: {
                    id() {
                        let target = 1;
                        const addRules = app.netrequest.rules.stack;
                        if (addRules && addRules.length) {
                            const addRulesIds = addRules.map(e => e.id).sort((a, b) => a - b);
                            for (let index in addRulesIds) {
                                if (addRulesIds[index] > -1 && addRulesIds[index] === target) {
                                    target++;
                                }
                            }
                        }
                        return target;
                    }
                }
            }
        },
        remove: {
            by: {
                async ids(removeRuleIds) {
                    if (removeRuleIds && removeRuleIds.length) {
                        await app.netrequest.engine.rules.update({ removeRuleIds });
                        app.netrequest.rules.stack = await app.netrequest.engine.rules.get();
                    }
                },
                async scope(targetScope) {
                    let removeRuleIds = [];
                    if (targetScope === "dynamic") {
                        const dynamicRules = await borwserApi.declarativeNetRequest.getDynamicRules();
                        removeRuleIds = dynamicRules.map(e => e.id);
                        await borwserApi.declarativeNetRequest.updateDynamicRules({ removeRuleIds });
                    } else if (targetScope === "session") {
                        const sessionRules = await borwserApi.declarativeNetRequest.getSessionRules();
                        removeRuleIds = sessionRules.map(e => e.id);
                        await borwserApi.declarativeNetRequest.updateSessionRules({ removeRuleIds });
                    }
                    app.netrequest.rules.stack = app.netrequest.rules.stack.filter(e => !removeRuleIds.includes(e.id));
                },
                condition: {
                    async tabId(tabId) {
                        if (tabId) {
                            const rules = await app.netrequest.engine.rules.get();
                            if (rules && rules.length) {
                                const removeRuleIds = rules.filter(e => e && e.condition && e.condition.tabIds[0] === tabId).map(e => e.id);
                                await app.netrequest.rules.remove.by.ids(removeRuleIds);
                            }
                        }
                    }
                },
                action: {
                    async type(type, key) {
                        if (type) {
                            const rules = await app.netrequest.engine.rules.get();
                            if (rules && rules.length) {
                                const removeRuleIds = rules.filter(e => {
                                    if (e && e.action && e.action.type === type) {
                                        return key ? (key in e.action) : true;
                                    }
                                    return false;
                                }).map(e => e.id);
                                await app.netrequest.rules.remove.by.ids(removeRuleIds);
                            }
                        }
                    }
                }
            }
        }
    }
};

app.version = () => borwserApi.runtime.getManifest().version;
app.homepage = () => borwserApi.runtime.getManifest().homepage_url;

app.on = {
    management(callback) {
        borwserApi.management.getSelf(callback);
    },
    uninstalled(url) {
        borwserApi.runtime.setUninstallURL(url, () => { });
    },
    installed(callback) {
        borwserApi.runtime.onInstalled.addListener((e) => {
            app.storage.load(() => callback(e));
        });
    },
    startup(callback) {
        borwserApi.runtime.onStartup.addListener((e) => {
            app.storage.load(() => callback(e));
        });
    },
    connect(callback) {
        borwserApi.runtime.onConnect.addListener((e) => {
            app.storage.load(() => {
                if (callback) callback(e);
            });
        });
    },
    storage(callback) {
        borwserApi.storage.onChanged.addListener((changes, namespace) => {
            app.storage.update(() => {
                if (callback) callback(changes, namespace);
            });
        });
    },
    message(callback) {
        borwserApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
            app.storage.load(() => {
                callback(request, sender, sendResponse);
            });
            return true;
        });
    }
};

if (!navigator.webdriver) {
    app.on.uninstalled(app.homepage() + "?v=" + app.version() + "&type=uninstall");
    app.on.installed((e) => {
        app.on.management((result) => {
            if (result.installType === "normal") {
                app.tab.query.index((index) => {
                    const previous = e.previousVersion !== undefined && e.previousVersion !== app.version();
                    const doupdate = previous && parseInt((Date.now() - config.welcome.lastupdate) / (24 * 3600 * 1000)) > 45;
                    if (e.reason === "install" || (e.reason === "update" && doupdate)) {
                        const parameter = (e.previousVersion ? "&p=" + e.previousVersion : '') + "&type=" + e.reason;
                        const url = app.homepage() + "?v=" + app.version() + parameter;
                        app.tab.open(url, index, e.reason === "install");
                        config.welcome.lastupdate = Date.now();
                    }
                });
            }
        });
    });
}

app.on.connect((port) => {
    if (port) {
        if (port.name && port.name in app) {
            app[port.name].port = port;
        }
        port.onDisconnect.addListener((e) => {
            app.storage.load(() => {
                if (e && e.name && e.name in app) {
                    app[e.name].port = null;
                }
            });
        });
        port.onMessage.addListener((e) => {
            app.storage.load(() => {
                if (e && e.path && e.port && e.port in app) {
                    if (e.path === (e.port + "-to-background")) {
                        const callback = app[e.port].message[e.method];
                        if (typeof callback === "function") {
                            callback(e.data);
                        }
                    }
                }
            });
        });
    }
});

app.on.message((request, sender) => {
    if (request) {
        if (request.path === "sidebar-to-background") {
            const callback = app.sidebar.message[request.method];
            if (typeof callback === "function") {
                callback(request.data);
            }
        }
        if (request.path === "options-to-background") {
            const callback = app.options.message[request.method];
            if (typeof callback === "function") {
                callback(request.data);
            }
        }
        if (request.path === "page-to-background") {
            const callback = app.page.message[request.method];
            if (typeof callback === "function") {
                const a = request.data || {};
                if (sender) {
                    a.frameId = sender.frameId;
                    if (sender.tab) {
                        if (a.tabId === undefined) a.tabId = sender.tab.id;
                        if (a.title === undefined) a.title = sender.tab.title || '';
                        if (a.top === undefined) a.top = sender.tab.url || (sender.url || '');
                    }
                }
                callback(a);
            }
        }
    }
});

const core = {
    start() {
        core.load();
    },
    install() {
        core.load();
    },
    load() {
        core.netrequest.register();
        app.sidebar.behavior({ openPanelOnActionClick: true });
        app.button.icon(null, config.sidebar.url ? "ON" : "OFF");
    },
    action: {
        storage(changes, namespace) {
        },
        page: {
            scrollbar(e) {
                app.sidebar.send("scrollbar", {
                    hide: config.sidebar.scrollbar
                }, e ? e.tabId : null, e ? e.frameId : null);
            }
        },
        options: {
            get(pref) {
                app.options.send("set", {
                    pref,
                    value: config.get(pref)
                });
            },
            set(o) {
                config.set(o.pref, o.value);
                app.options.send("set", {
                    pref: o.pref,
                    value: config.get(o.pref)
                });
                setTimeout(core.load, 300);
            }
        },
        sidebar: {
            options() {
                app.tab.options();
            },
            openin() {
                if (config.sidebar.url) {
                    app.tab.open(config.sidebar.url);
                }
            },
            resize() {
                app.sidebar.send("resize", {
                    width: config.sidebar.width,
                    height: config.sidebar.height
                });
            },
            load(force) {
                app.sidebar.send("storage", {
                    force,
                    url: config.sidebar.url,
                    iframe: config.sidebar.iframe,
                    toolbar: config.sidebar.toolbar
                });
            }
        }
    },
    netrequest: {
        async register() {
            app.netrequest.rules.scope = "session";
            await app.netrequest.display.badge.text(false);

            await app.netrequest.rules.remove.by.action.type("block");
            await app.netrequest.rules.remove.by.action.type("modifyHeaders", "requestHeaders");
            await app.netrequest.rules.remove.by.action.type("modifyHeaders", "responseHeaders");

            if (config.addon.ads) {
                for (let i = 0; i < config.addon.regexps.length; i++) {
                    app.netrequest.rules.push({
                        action: { type: "block" },
                        condition: {
                            tabIds: [-1],
                            isUrlFilterCaseSensitive: false,
                            regexFilter: config.addon.regexps[i],
                            excludedResourceTypes: ["sub_frame", "main_frame"]
                        }
                    });
                }
            }

            if (config.addon.xframe) {
                app.netrequest.rules.push({
                    condition: {
                        tabIds: [-1],
                        resourceTypes: ["sub_frame"]
                    },
                    action: {
                        type: "modifyHeaders",
                        responseHeaders: [
                            { operation: "remove", header: "frame-options" },
                            { operation: "remove", header: "x-frame-options" }
                        ]
                    }
                });
            }
            const id = parseInt(config.sidebar.mobile, 10);
            if (id < 5) {
                let value = "Mozilla/5.0 (Linux; Android 17) AppleWebKit/537.36 (KHTML, like Gecko) borwserApi/150.0.7871.28 Mobile Safari/537.36";
                if (id === 0) value = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1";
                if (id === 1) value = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) borwserApi/114.0.5735.60 Mobile Safari/537.36";
                if (id === 2) value = "Mozilla/5.0 (Windows Phone 10.0; Android 4.4; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) borwserApi/52.0.2743.116 Mobile Safari/537.36 Edge/15.14977";
                if (id === 3) value = "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)";
                if (id === 4) value = "Mozilla/5.0 (Linux; U; Tizen 2.0; en-us) AppleWebKit/537.1 (KHTML, like Gecko) Mobile TizenBrowser/2.0";

                app.netrequest.rules.push({
                    condition: {
                        tabIds: [-1],
                        resourceTypes: ["sub_frame"]
                    },
                    action: {
                        type: "modifyHeaders",
                        requestHeaders: [
                            { value, operation: "set", header: "user-agent" }
                        ]
                    }
                });
            }

            await app.netrequest.rules.update();
        }
    }
};

app.page.receive("scrollbar", core.action.page.scrollbar);
app.options.receive("get", core.action.options.get);
app.options.receive("changed", core.action.options.set);

app.sidebar.receive("openin", core.action.sidebar.openin);
app.sidebar.receive("resize", core.action.sidebar.resize);
app.sidebar.receive("options", core.action.sidebar.options);
app.sidebar.receive("load", () => core.action.sidebar.load(false));
app.sidebar.receive("support", () => app.tab.open(app.homepage()));
app.sidebar.receive("donation", () => app.tab.open(app.homepage() + "?reason=support"));

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);


app.sidebar.receive("url-changed", (data) => {
    if (data && data.url) {
        config.sidebar.url = data.url;
        app.options.send("set", {
            pref: "sidebar.url",
            value: data.url
        });
        setTimeout(core.load, 300);
    }
});