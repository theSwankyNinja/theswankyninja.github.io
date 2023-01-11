var VueDemi = (function (VueDemi, Vue, VueCompositionAPI) {
  if (VueDemi.install) {
    return VueDemi
  }
  if (!Vue) {
    console.error('[vue-demi] no Vue instance found, please be sure to import `vue` before `vue-demi`.')
    return VueDemi
  }

  // Vue 2.7
  if (Vue.version.slice(0, 4) === '2.7.') {
    for (var key in Vue) {
      VueDemi[key] = Vue[key]
    }
    VueDemi.isVue2 = true
    VueDemi.isVue3 = false
    VueDemi.install = function () {}
    VueDemi.Vue = Vue
    VueDemi.Vue2 = Vue
    VueDemi.version = Vue.version
    VueDemi.warn = Vue.util.warn
    function createApp(rootComponent, rootProps) {
      var vm
      var provide = {}
      var app = {
        config: Vue.config,
        use: Vue.use.bind(Vue),
        mixin: Vue.mixin.bind(Vue),
        component: Vue.component.bind(Vue),
        provide: function (key, value) {
          provide[key] = value
          return this
        },
        directive: function (name, dir) {
          if (dir) {
            Vue.directive(name, dir)
            return app
          } else {
            return Vue.directive(name)
          }
        },
        mount: function (el, hydrating) {
          if (!vm) {
            vm = new Vue(Object.assign({ propsData: rootProps }, rootComponent, { provide: Object.assign(provide, rootComponent.provide) }))
            vm.$mount(el, hydrating)
            return vm
          } else {
            return vm
          }
        },
        unmount: function () {
          if (vm) {
            vm.$destroy()
            vm = undefined
          }
        },
      }
      return app
    }
    VueDemi.createApp = createApp
  }
  // Vue 2.6.x
  else if (Vue.version.slice(0, 2) === '2.') {
    if (VueCompositionAPI) {
      for (var key in VueCompositionAPI) {
        VueDemi[key] = VueCompositionAPI[key]
      }
      VueDemi.isVue2 = true
      VueDemi.isVue3 = false
      VueDemi.install = function () {}
      VueDemi.Vue = Vue
      VueDemi.Vue2 = Vue
      VueDemi.version = Vue.version
    } else {
      console.error('[vue-demi] no VueCompositionAPI instance found, please be sure to import `@vue/composition-api` before `vue-demi`.')
    }
  }
  // Vue 3
  else if (Vue.version.slice(0, 2) === '3.') {
    for (var key in Vue) {
      VueDemi[key] = Vue[key]
    }
    VueDemi.isVue2 = false
    VueDemi.isVue3 = true
    VueDemi.install = function () {}
    VueDemi.Vue = Vue
    VueDemi.Vue2 = undefined
    VueDemi.version = Vue.version
    VueDemi.set = function (target, key, val) {
      if (Array.isArray(target)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
      }
      target[key] = val
      return val
    }
    VueDemi.del = function (target, key) {
      if (Array.isArray(target)) {
        target.splice(key, 1)
        return
      }
      delete target[key]
    }
  } else {
    console.error('[vue-demi] Vue version ' + Vue.version + ' is unsupported.')
  }
  return VueDemi
})(
  (this.VueDemi = this.VueDemi || (typeof VueDemi !== 'undefined' ? VueDemi : {})),
  this.Vue || (typeof Vue !== 'undefined' ? Vue : undefined),
  this.VueCompositionAPI || (typeof VueCompositionAPI !== 'undefined' ? VueCompositionAPI : undefined)
);
;
;(function (exports, vueDemi, core, shared) {
  'use strict';

  const OnClickOutside = vueDemi.defineComponent({
    name: "OnClickOutside",
    props: ["as", "options"],
    emits: ["trigger"],
    setup(props, { slots, emit }) {
      const target = vueDemi.ref();
      core.onClickOutside(target, (e) => {
        emit("trigger", e);
      }, props.options);
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default());
      };
    }
  });

  function unrefElement(elRef) {
    var _a;
    const plain = shared.resolveUnref(elRef);
    return (_a = plain == null ? void 0 : plain.$el) != null ? _a : plain;
  }

  const defaultWindow = shared.isClient ? window : void 0;

  function useEventListener(...args) {
    let target;
    let events;
    let listeners;
    let options;
    if (shared.isString(args[0]) || Array.isArray(args[0])) {
      [events, listeners, options] = args;
      target = defaultWindow;
    } else {
      [target, events, listeners, options] = args;
    }
    if (!target)
      return shared.noop;
    if (!Array.isArray(events))
      events = [events];
    if (!Array.isArray(listeners))
      listeners = [listeners];
    const cleanups = [];
    const cleanup = () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;
    };
    const register = (el, event, listener) => {
      el.addEventListener(event, listener, options);
      return () => el.removeEventListener(event, listener, options);
    };
    const stopWatch = vueDemi.watch(() => unrefElement(target), (el) => {
      cleanup();
      if (!el)
        return;
      cleanups.push(...events.flatMap((event) => {
        return listeners.map((listener) => register(el, event, listener));
      }));
    }, { immediate: true, flush: "post" });
    const stop = () => {
      stopWatch();
      cleanup();
    };
    shared.tryOnScopeDispose(stop);
    return stop;
  }

  function onClickOutside(target, handler, options = {}) {
    const { window = defaultWindow, ignore = [], capture = true, detectIframe = false } = options;
    if (!window)
      return;
    let shouldListen = true;
    let fallback;
    const shouldIgnore = (event) => {
      return ignore.some((target2) => {
        if (typeof target2 === "string") {
          return Array.from(window.document.querySelectorAll(target2)).some((el) => el === event.target || event.composedPath().includes(el));
        } else {
          const el = unrefElement(target2);
          return el && (event.target === el || event.composedPath().includes(el));
        }
      });
    };
    const listener = (event) => {
      window.clearTimeout(fallback);
      const el = unrefElement(target);
      if (!el || el === event.target || event.composedPath().includes(el))
        return;
      if (event.detail === 0)
        shouldListen = !shouldIgnore(event);
      if (!shouldListen) {
        shouldListen = true;
        return;
      }
      handler(event);
    };
    const cleanup = [
      useEventListener(window, "click", listener, { passive: true, capture }),
      useEventListener(window, "pointerdown", (e) => {
        const el = unrefElement(target);
        if (el)
          shouldListen = !e.composedPath().includes(el) && !shouldIgnore(e);
      }, { passive: true }),
      useEventListener(window, "pointerup", (e) => {
        if (e.button === 0) {
          const path = e.composedPath();
          e.composedPath = () => path;
          fallback = window.setTimeout(() => listener(e), 50);
        }
      }, { passive: true }),
      detectIframe && useEventListener(window, "blur", (event) => {
        var _a;
        const el = unrefElement(target);
        if (((_a = window.document.activeElement) == null ? void 0 : _a.tagName) === "IFRAME" && !(el == null ? void 0 : el.contains(window.document.activeElement)))
          handler(event);
      })
    ].filter(Boolean);
    const stop = () => cleanup.forEach((fn) => fn());
    return stop;
  }

  const vOnClickOutside = {
    [shared.directiveHooks.mounted](el, binding) {
      const capture = !binding.modifiers.bubble;
      if (typeof binding.value === "function") {
        el.__onClickOutside_stop = onClickOutside(el, binding.value, { capture });
      } else {
        const [handler, options] = binding.value;
        el.__onClickOutside_stop = onClickOutside(el, handler, Object.assign({ capture }, options));
      }
    },
    [shared.directiveHooks.unmounted](el) {
      el.__onClickOutside_stop();
    }
  };

  const createKeyPredicate = (keyFilter) => {
    if (typeof keyFilter === "function")
      return keyFilter;
    else if (typeof keyFilter === "string")
      return (event) => event.key === keyFilter;
    else if (Array.isArray(keyFilter))
      return (event) => keyFilter.includes(event.key);
    return () => true;
  };
  function onKeyStroke(...args) {
    let key;
    let handler;
    let options = {};
    if (args.length === 3) {
      key = args[0];
      handler = args[1];
      options = args[2];
    } else if (args.length === 2) {
      if (typeof args[1] === "object") {
        key = true;
        handler = args[0];
        options = args[1];
      } else {
        key = args[0];
        handler = args[1];
      }
    } else {
      key = true;
      handler = args[0];
    }
    const { target = defaultWindow, eventName = "keydown", passive = false } = options;
    const predicate = createKeyPredicate(key);
    const listener = (e) => {
      if (predicate(e))
        handler(e);
    };
    return useEventListener(target, eventName, listener, passive);
  }

  var __defProp$d = Object.defineProperty;
  var __getOwnPropSymbols$e = Object.getOwnPropertySymbols;
  var __hasOwnProp$e = Object.prototype.hasOwnProperty;
  var __propIsEnum$e = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$d = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$e.call(b, prop))
        __defNormalProp$d(a, prop, b[prop]);
    if (__getOwnPropSymbols$e)
      for (var prop of __getOwnPropSymbols$e(b)) {
        if (__propIsEnum$e.call(b, prop))
          __defNormalProp$d(a, prop, b[prop]);
      }
    return a;
  };
  const vOnKeyStroke = {
    [shared.directiveHooks.mounted](el, binding) {
      var _a, _b;
      const keys = (_b = (_a = binding.arg) == null ? void 0 : _a.split(",")) != null ? _b : true;
      if (typeof binding.value === "function") {
        onKeyStroke(keys, binding.value, {
          target: el
        });
      } else {
        const [handler, options] = binding.value;
        onKeyStroke(keys, handler, __spreadValues$d({
          target: el
        }, options));
      }
    }
  };

  const DEFAULT_DELAY = 500;
  function onLongPress(target, handler, options) {
    var _a, _b;
    const elementRef = vueDemi.computed(() => unrefElement(target));
    let timeout;
    function clear() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = void 0;
      }
    }
    function onDown(ev) {
      var _a2, _b2, _c, _d;
      if (((_a2 = options == null ? void 0 : options.modifiers) == null ? void 0 : _a2.self) && ev.target !== elementRef.value)
        return;
      clear();
      if ((_b2 = options == null ? void 0 : options.modifiers) == null ? void 0 : _b2.prevent)
        ev.preventDefault();
      if ((_c = options == null ? void 0 : options.modifiers) == null ? void 0 : _c.stop)
        ev.stopPropagation();
      timeout = setTimeout(() => handler(ev), (_d = options == null ? void 0 : options.delay) != null ? _d : DEFAULT_DELAY);
    }
    const listenerOptions = {
      capture: (_a = options == null ? void 0 : options.modifiers) == null ? void 0 : _a.capture,
      once: (_b = options == null ? void 0 : options.modifiers) == null ? void 0 : _b.once
    };
    useEventListener(elementRef, "pointerdown", onDown, listenerOptions);
    useEventListener(elementRef, "pointerup", clear, listenerOptions);
    useEventListener(elementRef, "pointerleave", clear, listenerOptions);
  }

  const OnLongPress = vueDemi.defineComponent({
    name: "OnLongPress",
    props: ["as", "options"],
    emits: ["trigger"],
    setup(props, { slots, emit }) {
      const target = vueDemi.ref();
      onLongPress(target, (e) => {
        emit("trigger", e);
      }, props.options);
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default());
      };
    }
  });

  const vOnLongPress = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function")
        onLongPress(el, binding.value, { modifiers: binding.modifiers });
      else
        onLongPress(el, ...binding.value);
    }
  };

  const UseActiveElement = vueDemi.defineComponent({
    name: "UseActiveElement",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        element: core.useActiveElement()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseBattery = vueDemi.defineComponent({
    name: "UseBattery",
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useBattery(props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseBrowserLocation = vueDemi.defineComponent({
    name: "UseBrowserLocation",
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useBrowserLocation());
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const _global = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  const globalKey = "__vueuse_ssr_handlers__";
  _global[globalKey] = _global[globalKey] || {};
  const handlers = _global[globalKey];
  function getSSRHandler(key, fallback) {
    return handlers[key] || fallback;
  }

  function guessSerializerType(rawInit) {
    return rawInit == null ? "any" : rawInit instanceof Set ? "set" : rawInit instanceof Map ? "map" : rawInit instanceof Date ? "date" : typeof rawInit === "boolean" ? "boolean" : typeof rawInit === "string" ? "string" : typeof rawInit === "object" ? "object" : !Number.isNaN(rawInit) ? "number" : "any";
  }

  var __defProp$c = Object.defineProperty;
  var __getOwnPropSymbols$d = Object.getOwnPropertySymbols;
  var __hasOwnProp$d = Object.prototype.hasOwnProperty;
  var __propIsEnum$d = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$c = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$d.call(b, prop))
        __defNormalProp$c(a, prop, b[prop]);
    if (__getOwnPropSymbols$d)
      for (var prop of __getOwnPropSymbols$d(b)) {
        if (__propIsEnum$d.call(b, prop))
          __defNormalProp$c(a, prop, b[prop]);
      }
    return a;
  };
  const StorageSerializers = {
    boolean: {
      read: (v) => v === "true",
      write: (v) => String(v)
    },
    object: {
      read: (v) => JSON.parse(v),
      write: (v) => JSON.stringify(v)
    },
    number: {
      read: (v) => Number.parseFloat(v),
      write: (v) => String(v)
    },
    any: {
      read: (v) => v,
      write: (v) => String(v)
    },
    string: {
      read: (v) => v,
      write: (v) => String(v)
    },
    map: {
      read: (v) => new Map(JSON.parse(v)),
      write: (v) => JSON.stringify(Array.from(v.entries()))
    },
    set: {
      read: (v) => new Set(JSON.parse(v)),
      write: (v) => JSON.stringify(Array.from(v))
    },
    date: {
      read: (v) => new Date(v),
      write: (v) => v.toISOString()
    }
  };
  function useStorage(key, defaults, storage, options = {}) {
    var _a;
    const {
      flush = "pre",
      deep = true,
      listenToStorageChanges = true,
      writeDefaults = true,
      mergeDefaults = false,
      shallow,
      window = defaultWindow,
      eventFilter,
      onError = (e) => {
        console.error(e);
      }
    } = options;
    const data = (shallow ? vueDemi.shallowRef : vueDemi.ref)(defaults);
    if (!storage) {
      try {
        storage = getSSRHandler("getDefaultStorage", () => {
          var _a2;
          return (_a2 = defaultWindow) == null ? void 0 : _a2.localStorage;
        })();
      } catch (e) {
        onError(e);
      }
    }
    if (!storage)
      return data;
    const rawInit = shared.resolveUnref(defaults);
    const type = guessSerializerType(rawInit);
    const serializer = (_a = options.serializer) != null ? _a : StorageSerializers[type];
    const { pause: pauseWatch, resume: resumeWatch } = shared.pausableWatch(data, () => write(data.value), { flush, deep, eventFilter });
    if (window && listenToStorageChanges)
      useEventListener(window, "storage", update);
    update();
    return data;
    function write(v) {
      try {
        if (v == null) {
          storage.removeItem(key);
        } else {
          const serialized = serializer.write(v);
          const oldValue = storage.getItem(key);
          if (oldValue !== serialized) {
            storage.setItem(key, serialized);
            if (window) {
              window == null ? void 0 : window.dispatchEvent(new StorageEvent("storage", {
                key,
                oldValue,
                newValue: serialized,
                storageArea: storage
              }));
            }
          }
        }
      } catch (e) {
        onError(e);
      }
    }
    function read(event) {
      const rawValue = event ? event.newValue : storage.getItem(key);
      if (rawValue == null) {
        if (writeDefaults && rawInit !== null)
          storage.setItem(key, serializer.write(rawInit));
        return rawInit;
      } else if (!event && mergeDefaults) {
        const value = serializer.read(rawValue);
        if (shared.isFunction(mergeDefaults))
          return mergeDefaults(value, rawInit);
        else if (type === "object" && !Array.isArray(value))
          return __spreadValues$c(__spreadValues$c({}, rawInit), value);
        return value;
      } else if (typeof rawValue !== "string") {
        return rawValue;
      } else {
        return serializer.read(rawValue);
      }
    }
    function update(event) {
      if (event && event.storageArea !== storage)
        return;
      if (event && event.key == null) {
        data.value = rawInit;
        return;
      }
      if (event && event.key !== key)
        return;
      pauseWatch();
      try {
        data.value = read(event);
      } catch (e) {
        onError(e);
      } finally {
        if (event)
          vueDemi.nextTick(resumeWatch);
        else
          resumeWatch();
      }
    }
  }

  function useSupported(callback, sync = false) {
    const isSupported = vueDemi.ref();
    const update = () => isSupported.value = Boolean(callback());
    update();
    shared.tryOnMounted(update, sync);
    return isSupported;
  }

  function useMediaQuery(query, options = {}) {
    const { window = defaultWindow } = options;
    const isSupported = useSupported(() => window && "matchMedia" in window && typeof window.matchMedia === "function");
    let mediaQuery;
    const matches = vueDemi.ref(false);
    const cleanup = () => {
      if (!mediaQuery)
        return;
      if ("removeEventListener" in mediaQuery)
        mediaQuery.removeEventListener("change", update);
      else
        mediaQuery.removeListener(update);
    };
    const update = () => {
      if (!isSupported.value)
        return;
      cleanup();
      mediaQuery = window.matchMedia(shared.resolveRef(query).value);
      matches.value = mediaQuery.matches;
      if ("addEventListener" in mediaQuery)
        mediaQuery.addEventListener("change", update);
      else
        mediaQuery.addListener(update);
    };
    vueDemi.watchEffect(update);
    shared.tryOnScopeDispose(() => cleanup());
    return matches;
  }

  function usePreferredDark(options) {
    return useMediaQuery("(prefers-color-scheme: dark)", options);
  }

  var __defProp$b = Object.defineProperty;
  var __getOwnPropSymbols$c = Object.getOwnPropertySymbols;
  var __hasOwnProp$c = Object.prototype.hasOwnProperty;
  var __propIsEnum$c = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$b = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$c.call(b, prop))
        __defNormalProp$b(a, prop, b[prop]);
    if (__getOwnPropSymbols$c)
      for (var prop of __getOwnPropSymbols$c(b)) {
        if (__propIsEnum$c.call(b, prop))
          __defNormalProp$b(a, prop, b[prop]);
      }
    return a;
  };
  function useColorMode(options = {}) {
    const {
      selector = "html",
      attribute = "class",
      initialValue = "auto",
      window = defaultWindow,
      storage,
      storageKey = "vueuse-color-scheme",
      listenToStorageChanges = true,
      storageRef,
      emitAuto
    } = options;
    const modes = __spreadValues$b({
      auto: "",
      light: "light",
      dark: "dark"
    }, options.modes || {});
    const preferredDark = usePreferredDark({ window });
    const preferredMode = vueDemi.computed(() => preferredDark.value ? "dark" : "light");
    const store = storageRef || (storageKey == null ? vueDemi.ref(initialValue) : useStorage(storageKey, initialValue, storage, { window, listenToStorageChanges }));
    const state = vueDemi.computed({
      get() {
        return store.value === "auto" && !emitAuto ? preferredMode.value : store.value;
      },
      set(v) {
        store.value = v;
      }
    });
    const updateHTMLAttrs = getSSRHandler("updateHTMLAttrs", (selector2, attribute2, value) => {
      const el = window == null ? void 0 : window.document.querySelector(selector2);
      if (!el)
        return;
      if (attribute2 === "class") {
        const current = value.split(/\s/g);
        Object.values(modes).flatMap((i) => (i || "").split(/\s/g)).filter(Boolean).forEach((v) => {
          if (current.includes(v))
            el.classList.add(v);
          else
            el.classList.remove(v);
        });
      } else {
        el.setAttribute(attribute2, value);
      }
    });
    function defaultOnChanged(mode) {
      var _a;
      const resolvedMode = mode === "auto" ? preferredMode.value : mode;
      updateHTMLAttrs(selector, attribute, (_a = modes[resolvedMode]) != null ? _a : resolvedMode);
    }
    function onChanged(mode) {
      if (options.onChanged)
        options.onChanged(mode, defaultOnChanged);
      else
        defaultOnChanged(mode);
    }
    vueDemi.watch(state, onChanged, { flush: "post", immediate: true });
    if (emitAuto)
      vueDemi.watch(preferredMode, () => onChanged(state.value), { flush: "post" });
    shared.tryOnMounted(() => onChanged(state.value));
    return state;
  }

  const UseColorMode = vueDemi.defineComponent({
    name: "UseColorMode",
    props: ["selector", "attribute", "modes", "onChanged", "storageKey", "storage", "emitAuto"],
    setup(props, { slots }) {
      const mode = useColorMode(props);
      const data = vueDemi.reactive({
        mode
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDark = vueDemi.defineComponent({
    name: "UseDark",
    props: ["selector", "attribute", "valueDark", "valueLight", "onChanged", "storageKey", "storage"],
    setup(props, { slots }) {
      const isDark = core.useDark(props);
      const data = vueDemi.reactive({
        isDark,
        toggleDark: shared.useToggle(isDark)
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDeviceMotion = vueDemi.defineComponent({
    name: "UseDeviceMotion",
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useDeviceMotion());
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDeviceOrientation = vueDemi.defineComponent({
    name: "UseDeviceOrientation",
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useDeviceOrientation());
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDevicePixelRatio = vueDemi.defineComponent({
    name: "UseDevicePixelRatio",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        pixelRatio: core.useDevicePixelRatio()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDevicesList = vueDemi.defineComponent({
    name: "UseDevicesList",
    props: ["onUpdated", "requestPermissions", "constraints"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useDevicesList(props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseDocumentVisibility = vueDemi.defineComponent({
    name: "UseDocumentVisibility",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        visibility: core.useDocumentVisibility()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  var __defProp$a = Object.defineProperty;
  var __defProps$8 = Object.defineProperties;
  var __getOwnPropDescs$8 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$b = Object.getOwnPropertySymbols;
  var __hasOwnProp$b = Object.prototype.hasOwnProperty;
  var __propIsEnum$b = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$a = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$b.call(b, prop))
        __defNormalProp$a(a, prop, b[prop]);
    if (__getOwnPropSymbols$b)
      for (var prop of __getOwnPropSymbols$b(b)) {
        if (__propIsEnum$b.call(b, prop))
          __defNormalProp$a(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$8 = (a, b) => __defProps$8(a, __getOwnPropDescs$8(b));
  const UseDraggable = vueDemi.defineComponent({
    name: "UseDraggable",
    props: [
      "storageKey",
      "storageType",
      "initialValue",
      "exact",
      "preventDefault",
      "stopPropagation",
      "pointerTypes",
      "as",
      "handle"
    ],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const handle = vueDemi.computed(() => {
        var _a;
        return (_a = props.handle) != null ? _a : target.value;
      });
      const initialValue = props.storageKey ? core.useStorage(props.storageKey, shared.resolveUnref(props.initialValue) || { x: 0, y: 0 }, core.isClient ? props.storageType === "session" ? sessionStorage : localStorage : void 0) : props.initialValue || { x: 0, y: 0 };
      const data = vueDemi.reactive(core.useDraggable(target, __spreadProps$8(__spreadValues$a({}, props), {
        handle,
        initialValue
      })));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target, style: `touch-action:none;${data.style}` }, slots.default(data));
      };
    }
  });

  const UseElementBounding = vueDemi.defineComponent({
    name: "UseElementBounding",
    props: ["box", "as"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive(core.useElementBounding(target));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  function useElementHover(el) {
    const isHovered = vueDemi.ref(false);
    useEventListener(el, "mouseenter", () => isHovered.value = true);
    useEventListener(el, "mouseleave", () => isHovered.value = false);
    return isHovered;
  }

  const vElementHover = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function") {
        const isHovered = useElementHover(el);
        vueDemi.watch(isHovered, (v) => binding.value(v));
      }
    }
  };

  const UseElementSize = vueDemi.defineComponent({
    name: "UseElementSize",
    props: ["width", "height", "box"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive(core.useElementSize(target, { width: props.width, height: props.height }, { box: props.box }));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  var __getOwnPropSymbols$a = Object.getOwnPropertySymbols;
  var __hasOwnProp$a = Object.prototype.hasOwnProperty;
  var __propIsEnum$a = Object.prototype.propertyIsEnumerable;
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp$a.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols$a)
      for (var prop of __getOwnPropSymbols$a(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum$a.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  function useResizeObserver(target, callback, options = {}) {
    const _a = options, { window = defaultWindow } = _a, observerOptions = __objRest(_a, ["window"]);
    let observer;
    const isSupported = useSupported(() => window && "ResizeObserver" in window);
    const cleanup = () => {
      if (observer) {
        observer.disconnect();
        observer = void 0;
      }
    };
    const stopWatch = vueDemi.watch(() => unrefElement(target), (el) => {
      cleanup();
      if (isSupported.value && window && el) {
        observer = new ResizeObserver(callback);
        observer.observe(el, observerOptions);
      }
    }, { immediate: true, flush: "post" });
    const stop = () => {
      cleanup();
      stopWatch();
    };
    shared.tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }

  function useElementSize(target, initialSize = { width: 0, height: 0 }, options = {}) {
    const { box = "content-box" } = options;
    const width = vueDemi.ref(initialSize.width);
    const height = vueDemi.ref(initialSize.height);
    useResizeObserver(target, ([entry]) => {
      const boxSize = box === "border-box" ? entry.borderBoxSize : box === "content-box" ? entry.contentBoxSize : entry.devicePixelContentBoxSize;
      if (boxSize) {
        width.value = boxSize.reduce((acc, { inlineSize }) => acc + inlineSize, 0);
        height.value = boxSize.reduce((acc, { blockSize }) => acc + blockSize, 0);
      } else {
        width.value = entry.contentRect.width;
        height.value = entry.contentRect.height;
      }
    }, options);
    vueDemi.watch(() => unrefElement(target), (ele) => {
      width.value = ele ? initialSize.width : 0;
      height.value = ele ? initialSize.height : 0;
    });
    return {
      width,
      height
    };
  }

  const vElementSize = {
    [shared.directiveHooks.mounted](el, binding) {
      var _a;
      const handler = typeof binding.value === "function" ? binding.value : (_a = binding.value) == null ? void 0 : _a[0];
      const options = typeof binding.value === "function" ? [] : binding.value.slice(1);
      const { width, height } = useElementSize(el, ...options);
      vueDemi.watch([width, height], ([width2, height2]) => handler({ width: width2, height: height2 }));
    }
  };

  const UseElementVisibility = vueDemi.defineComponent({
    name: "UseElementVisibility",
    props: ["as"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive({
        isVisible: core.useElementVisibility(target)
      });
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  function useElementVisibility(element, { window = defaultWindow, scrollTarget } = {}) {
    const elementIsVisible = vueDemi.ref(false);
    const testBounding = () => {
      if (!window)
        return;
      const document = window.document;
      const el = unrefElement(element);
      if (!el) {
        elementIsVisible.value = false;
      } else {
        const rect = el.getBoundingClientRect();
        elementIsVisible.value = rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth) && rect.bottom >= 0 && rect.right >= 0;
      }
    };
    vueDemi.watch(() => unrefElement(element), () => testBounding(), { immediate: true, flush: "post" });
    if (window) {
      useEventListener(scrollTarget || window, "scroll", testBounding, {
        capture: false,
        passive: true
      });
    }
    return elementIsVisible;
  }

  const vElementVisibility = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function") {
        const handler = binding.value;
        const isVisible = useElementVisibility(el);
        vueDemi.watch(isVisible, (v) => handler(v), { immediate: true });
      } else {
        const [handler, options] = binding.value;
        const isVisible = useElementVisibility(el, options);
        vueDemi.watch(isVisible, (v) => handler(v), { immediate: true });
      }
    }
  };

  const UseEyeDropper = vueDemi.defineComponent({
    name: "UseEyeDropper",
    props: {
      sRGBHex: String
    },
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useEyeDropper());
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseFullscreen = vueDemi.defineComponent({
    name: "UseFullscreen",
    props: ["as"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive(core.useFullscreen(target));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  const UseGeolocation = vueDemi.defineComponent({
    name: "UseGeolocation",
    props: ["enableHighAccuracy", "maximumAge", "timeout", "navigator"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useGeolocation(props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseIdle = vueDemi.defineComponent({
    name: "UseIdle",
    props: ["timeout", "events", "listenForVisibilityChange", "initialState"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useIdle(props.timeout, props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  function useAsyncState(promise, initialState, options) {
    const {
      immediate = true,
      delay = 0,
      onError = shared.noop,
      onSuccess = shared.noop,
      resetOnExecute = true,
      shallow = true,
      throwError
    } = options != null ? options : {};
    const state = shallow ? vueDemi.shallowRef(initialState) : vueDemi.ref(initialState);
    const isReady = vueDemi.ref(false);
    const isLoading = vueDemi.ref(false);
    const error = vueDemi.ref(void 0);
    async function execute(delay2 = 0, ...args) {
      if (resetOnExecute)
        state.value = initialState;
      error.value = void 0;
      isReady.value = false;
      isLoading.value = true;
      if (delay2 > 0)
        await shared.promiseTimeout(delay2);
      const _promise = typeof promise === "function" ? promise(...args) : promise;
      try {
        const data = await _promise;
        state.value = data;
        isReady.value = true;
        onSuccess(data);
      } catch (e) {
        error.value = e;
        onError(e);
        if (throwError)
          throw error;
      } finally {
        isLoading.value = false;
      }
      return state.value;
    }
    if (immediate)
      execute(delay);
    return {
      state,
      isReady,
      isLoading,
      error,
      execute
    };
  }

  var __defProp$9 = Object.defineProperty;
  var __getOwnPropSymbols$9 = Object.getOwnPropertySymbols;
  var __hasOwnProp$9 = Object.prototype.hasOwnProperty;
  var __propIsEnum$9 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$9 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$9.call(b, prop))
        __defNormalProp$9(a, prop, b[prop]);
    if (__getOwnPropSymbols$9)
      for (var prop of __getOwnPropSymbols$9(b)) {
        if (__propIsEnum$9.call(b, prop))
          __defNormalProp$9(a, prop, b[prop]);
      }
    return a;
  };
  async function loadImage(options) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const { src, srcset, sizes } = options;
      img.src = src;
      if (srcset)
        img.srcset = srcset;
      if (sizes)
        img.sizes = sizes;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  const useImage = (options, asyncStateOptions = {}) => {
    const state = useAsyncState(() => loadImage(shared.resolveUnref(options)), void 0, __spreadValues$9({
      resetOnExecute: true
    }, asyncStateOptions));
    vueDemi.watch(() => shared.resolveUnref(options), () => state.execute(asyncStateOptions.delay), { deep: true });
    return state;
  };

  const UseImage = vueDemi.defineComponent({
    name: "UseImage",
    props: [
      "src",
      "srcset",
      "sizes",
      "as"
    ],
    setup(props, { slots }) {
      const data = vueDemi.reactive(useImage(props));
      return () => {
        if (data.isLoading && slots.loading)
          return slots.loading(data);
        else if (data.error && slots.error)
          return slots.error(data.error);
        if (slots.default)
          return slots.default(data);
        return vueDemi.h(props.as || "img", props);
      };
    }
  });

  const ARRIVED_STATE_THRESHOLD_PIXELS = 1;
  function useScroll(element, options = {}) {
    const {
      throttle = 0,
      idle = 200,
      onStop = shared.noop,
      onScroll = shared.noop,
      offset = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      eventListenerOptions = {
        capture: false,
        passive: true
      },
      behavior = "auto"
    } = options;
    const internalX = vueDemi.ref(0);
    const internalY = vueDemi.ref(0);
    const x = vueDemi.computed({
      get() {
        return internalX.value;
      },
      set(x2) {
        scrollTo(x2, void 0);
      }
    });
    const y = vueDemi.computed({
      get() {
        return internalY.value;
      },
      set(y2) {
        scrollTo(void 0, y2);
      }
    });
    function scrollTo(_x, _y) {
      var _a, _b, _c;
      const _element = shared.resolveUnref(element);
      if (!_element)
        return;
      (_c = _element instanceof Document ? document.body : _element) == null ? void 0 : _c.scrollTo({
        top: (_a = shared.resolveUnref(_y)) != null ? _a : y.value,
        left: (_b = shared.resolveUnref(_x)) != null ? _b : x.value,
        behavior: shared.resolveUnref(behavior)
      });
    }
    const isScrolling = vueDemi.ref(false);
    const arrivedState = vueDemi.reactive({
      left: true,
      right: false,
      top: true,
      bottom: false
    });
    const directions = vueDemi.reactive({
      left: false,
      right: false,
      top: false,
      bottom: false
    });
    const onScrollEnd = shared.useDebounceFn((e) => {
      isScrolling.value = false;
      directions.left = false;
      directions.right = false;
      directions.top = false;
      directions.bottom = false;
      onStop(e);
    }, throttle + idle);
    const onScrollHandler = (e) => {
      const eventTarget = e.target === document ? e.target.documentElement : e.target;
      const scrollLeft = eventTarget.scrollLeft;
      directions.left = scrollLeft < internalX.value;
      directions.right = scrollLeft > internalY.value;
      arrivedState.left = scrollLeft <= 0 + (offset.left || 0);
      arrivedState.right = scrollLeft + eventTarget.clientWidth >= eventTarget.scrollWidth - (offset.right || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;
      internalX.value = scrollLeft;
      let scrollTop = eventTarget.scrollTop;
      if (e.target === document && !scrollTop)
        scrollTop = document.body.scrollTop;
      directions.top = scrollTop < internalY.value;
      directions.bottom = scrollTop > internalY.value;
      arrivedState.top = scrollTop <= 0 + (offset.top || 0);
      arrivedState.bottom = scrollTop + eventTarget.clientHeight >= eventTarget.scrollHeight - (offset.bottom || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;
      internalY.value = scrollTop;
      isScrolling.value = true;
      onScrollEnd(e);
      onScroll(e);
    };
    useEventListener(element, "scroll", throttle ? shared.useThrottleFn(onScrollHandler, throttle, true, false) : onScrollHandler, eventListenerOptions);
    return {
      x,
      y,
      isScrolling,
      arrivedState,
      directions
    };
  }

  var __defProp$8 = Object.defineProperty;
  var __defProps$7 = Object.defineProperties;
  var __getOwnPropDescs$7 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$8 = Object.getOwnPropertySymbols;
  var __hasOwnProp$8 = Object.prototype.hasOwnProperty;
  var __propIsEnum$8 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$8 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$8.call(b, prop))
        __defNormalProp$8(a, prop, b[prop]);
    if (__getOwnPropSymbols$8)
      for (var prop of __getOwnPropSymbols$8(b)) {
        if (__propIsEnum$8.call(b, prop))
          __defNormalProp$8(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$7 = (a, b) => __defProps$7(a, __getOwnPropDescs$7(b));
  function useInfiniteScroll(element, onLoadMore, options = {}) {
    var _a, _b;
    const direction = (_a = options.direction) != null ? _a : "bottom";
    const state = vueDemi.reactive(useScroll(element, __spreadProps$7(__spreadValues$8({}, options), {
      offset: __spreadValues$8({
        [direction]: (_b = options.distance) != null ? _b : 0
      }, options.offset)
    })));
    vueDemi.watch(() => state.arrivedState[direction], async (v) => {
      var _a2, _b2;
      if (v) {
        const elem = shared.resolveUnref(element);
        const previous = {
          height: (_a2 = elem == null ? void 0 : elem.scrollHeight) != null ? _a2 : 0,
          width: (_b2 = elem == null ? void 0 : elem.scrollWidth) != null ? _b2 : 0
        };
        await onLoadMore(state);
        if (options.preserveScrollPosition && elem) {
          vueDemi.nextTick(() => {
            elem.scrollTo({
              top: elem.scrollHeight - previous.height,
              left: elem.scrollWidth - previous.width
            });
          });
        }
      }
    });
  }

  const vInfiniteScroll = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function")
        useInfiniteScroll(el, binding.value);
      else
        useInfiniteScroll(el, ...binding.value);
    }
  };

  function useIntersectionObserver(target, callback, options = {}) {
    const {
      root,
      rootMargin = "0px",
      threshold = 0.1,
      window = defaultWindow
    } = options;
    const isSupported = useSupported(() => window && "IntersectionObserver" in window);
    let cleanup = shared.noop;
    const stopWatch = isSupported.value ? vueDemi.watch(() => ({
      el: unrefElement(target),
      root: unrefElement(root)
    }), ({ el, root: root2 }) => {
      cleanup();
      if (!el)
        return;
      const observer = new IntersectionObserver(callback, {
        root: root2,
        rootMargin,
        threshold
      });
      observer.observe(el);
      cleanup = () => {
        observer.disconnect();
        cleanup = shared.noop;
      };
    }, { immediate: true, flush: "post" }) : shared.noop;
    const stop = () => {
      cleanup();
      stopWatch();
    };
    shared.tryOnScopeDispose(stop);
    return {
      isSupported,
      stop
    };
  }

  const vIntersectionObserver = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function")
        useIntersectionObserver(el, binding.value);
      else
        useIntersectionObserver(el, ...binding.value);
    }
  };

  const UseMouse = vueDemi.defineComponent({
    name: "UseMouse",
    props: ["touch", "resetOnTouchEnds", "initialValue"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useMouse(props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseMouseInElement = vueDemi.defineComponent({
    name: "UseMouseElement",
    props: ["handleOutside", "as"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive(core.useMouseInElement(target, props));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  var __defProp$7 = Object.defineProperty;
  var __defProps$6 = Object.defineProperties;
  var __getOwnPropDescs$6 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$7 = Object.getOwnPropertySymbols;
  var __hasOwnProp$7 = Object.prototype.hasOwnProperty;
  var __propIsEnum$7 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$7 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$7.call(b, prop))
        __defNormalProp$7(a, prop, b[prop]);
    if (__getOwnPropSymbols$7)
      for (var prop of __getOwnPropSymbols$7(b)) {
        if (__propIsEnum$7.call(b, prop))
          __defNormalProp$7(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$6 = (a, b) => __defProps$6(a, __getOwnPropDescs$6(b));
  const UseMousePressed = vueDemi.defineComponent({
    name: "UseMousePressed",
    props: ["touch", "initialValue", "as"],
    setup(props, { slots }) {
      const target = vueDemi.ref();
      const data = vueDemi.reactive(core.useMousePressed(__spreadProps$6(__spreadValues$7({}, props), { target })));
      return () => {
        if (slots.default)
          return vueDemi.h(props.as || "div", { ref: target }, slots.default(data));
      };
    }
  });

  const UseNetwork = vueDemi.defineComponent({
    name: "UseNetwork",
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useNetwork());
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  var __defProp$6 = Object.defineProperty;
  var __defProps$5 = Object.defineProperties;
  var __getOwnPropDescs$5 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$6 = Object.getOwnPropertySymbols;
  var __hasOwnProp$6 = Object.prototype.hasOwnProperty;
  var __propIsEnum$6 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$6 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$6.call(b, prop))
        __defNormalProp$6(a, prop, b[prop]);
    if (__getOwnPropSymbols$6)
      for (var prop of __getOwnPropSymbols$6(b)) {
        if (__propIsEnum$6.call(b, prop))
          __defNormalProp$6(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$5 = (a, b) => __defProps$5(a, __getOwnPropDescs$5(b));
  const UseNow = vueDemi.defineComponent({
    name: "UseNow",
    props: ["interval"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useNow(__spreadProps$5(__spreadValues$6({}, props), { controls: true })));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseObjectUrl = vueDemi.defineComponent({
    name: "UseObjectUrl",
    props: [
      "object"
    ],
    setup(props, { slots }) {
      const object = vueDemi.toRef(props, "object");
      const url = core.useObjectUrl(object);
      return () => {
        if (slots.default && url.value)
          return slots.default(url);
      };
    }
  });

  var __defProp$5 = Object.defineProperty;
  var __defProps$4 = Object.defineProperties;
  var __getOwnPropDescs$4 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$5 = Object.getOwnPropertySymbols;
  var __hasOwnProp$5 = Object.prototype.hasOwnProperty;
  var __propIsEnum$5 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$5 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$5.call(b, prop))
        __defNormalProp$5(a, prop, b[prop]);
    if (__getOwnPropSymbols$5)
      for (var prop of __getOwnPropSymbols$5(b)) {
        if (__propIsEnum$5.call(b, prop))
          __defNormalProp$5(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$4 = (a, b) => __defProps$4(a, __getOwnPropDescs$4(b));
  const UseOffsetPagination = vueDemi.defineComponent({
    name: "UseOffsetPagination",
    props: [
      "total",
      "page",
      "pageSize",
      "onPageChange",
      "onPageSizeChange",
      "onPageCountChange"
    ],
    emits: [
      "page-change",
      "page-size-change",
      "page-count-change"
    ],
    setup(props, { slots, emit }) {
      const data = vueDemi.reactive(core.useOffsetPagination(__spreadProps$4(__spreadValues$5({}, props), {
        onPageChange(...args) {
          var _a;
          (_a = props.onPageChange) == null ? void 0 : _a.call(props, ...args);
          emit("page-change", ...args);
        },
        onPageSizeChange(...args) {
          var _a;
          (_a = props.onPageSizeChange) == null ? void 0 : _a.call(props, ...args);
          emit("page-size-change", ...args);
        },
        onPageCountChange(...args) {
          var _a;
          (_a = props.onPageCountChange) == null ? void 0 : _a.call(props, ...args);
          emit("page-count-change", ...args);
        }
      })));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseOnline = vueDemi.defineComponent({
    name: "UseOnline",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        isOnline: core.useOnline()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UsePageLeave = vueDemi.defineComponent({
    name: "UsePageLeave",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        isLeft: core.usePageLeave()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  var __defProp$4 = Object.defineProperty;
  var __defProps$3 = Object.defineProperties;
  var __getOwnPropDescs$3 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$4 = Object.getOwnPropertySymbols;
  var __hasOwnProp$4 = Object.prototype.hasOwnProperty;
  var __propIsEnum$4 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$4 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$4.call(b, prop))
        __defNormalProp$4(a, prop, b[prop]);
    if (__getOwnPropSymbols$4)
      for (var prop of __getOwnPropSymbols$4(b)) {
        if (__propIsEnum$4.call(b, prop))
          __defNormalProp$4(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$3 = (a, b) => __defProps$3(a, __getOwnPropDescs$3(b));
  const UsePointer = vueDemi.defineComponent({
    name: "UsePointer",
    props: [
      "pointerTypes",
      "initialValue",
      "target"
    ],
    setup(props, { slots }) {
      const el = vueDemi.ref(null);
      const data = vueDemi.reactive(core.usePointer(__spreadProps$3(__spreadValues$4({}, props), {
        target: props.target === "self" ? el : defaultWindow
      })));
      return () => {
        if (slots.default)
          return slots.default(data, { ref: el });
      };
    }
  });

  const UsePreferredColorScheme = vueDemi.defineComponent({
    name: "UsePreferredColorScheme",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        colorScheme: core.usePreferredColorScheme()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UsePreferredContrast = vueDemi.defineComponent({
    name: "UsePreferredContrast",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        contrast: core.usePreferredContrast()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UsePreferredDark = vueDemi.defineComponent({
    name: "UsePreferredDark",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        prefersDark: core.usePreferredDark()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UsePreferredLanguages = vueDemi.defineComponent({
    name: "UsePreferredLanguages",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        languages: core.usePreferredLanguages()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UsePreferredReducedMotion = vueDemi.defineComponent({
    name: "UsePreferredReducedMotion",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        motion: core.usePreferredReducedMotion()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  function useCssVar(prop, target, { window = defaultWindow, initialValue = "" } = {}) {
    const variable = vueDemi.ref(initialValue);
    const elRef = vueDemi.computed(() => {
      var _a;
      return unrefElement(target) || ((_a = window == null ? void 0 : window.document) == null ? void 0 : _a.documentElement);
    });
    vueDemi.watch([elRef, () => shared.resolveUnref(prop)], ([el, prop2]) => {
      var _a;
      if (el && window) {
        const value = (_a = window.getComputedStyle(el).getPropertyValue(prop2)) == null ? void 0 : _a.trim();
        variable.value = value || initialValue;
      }
    }, { immediate: true });
    vueDemi.watch(variable, (val) => {
      var _a;
      if ((_a = elRef.value) == null ? void 0 : _a.style)
        elRef.value.style.setProperty(shared.resolveUnref(prop), val);
    });
    return variable;
  }

  const topVarName = "--vueuse-safe-area-top";
  const rightVarName = "--vueuse-safe-area-right";
  const bottomVarName = "--vueuse-safe-area-bottom";
  const leftVarName = "--vueuse-safe-area-left";
  function useScreenSafeArea() {
    const top = vueDemi.ref("");
    const right = vueDemi.ref("");
    const bottom = vueDemi.ref("");
    const left = vueDemi.ref("");
    if (shared.isClient) {
      const topCssVar = useCssVar(topVarName);
      const rightCssVar = useCssVar(rightVarName);
      const bottomCssVar = useCssVar(bottomVarName);
      const leftCssVar = useCssVar(leftVarName);
      topCssVar.value = "env(safe-area-inset-top, 0px)";
      rightCssVar.value = "env(safe-area-inset-right, 0px)";
      bottomCssVar.value = "env(safe-area-inset-bottom, 0px)";
      leftCssVar.value = "env(safe-area-inset-left, 0px)";
      update();
      useEventListener("resize", shared.useDebounceFn(update));
    }
    function update() {
      top.value = getValue(topVarName);
      right.value = getValue(rightVarName);
      bottom.value = getValue(bottomVarName);
      left.value = getValue(leftVarName);
    }
    return {
      top,
      right,
      bottom,
      left,
      update
    };
  }
  function getValue(position) {
    return getComputedStyle(document.documentElement).getPropertyValue(position);
  }

  const UseScreenSafeArea = vueDemi.defineComponent({
    name: "UseScreenSafeArea",
    props: {
      top: Boolean,
      right: Boolean,
      bottom: Boolean,
      left: Boolean
    },
    setup(props, { slots }) {
      const {
        top,
        right,
        bottom,
        left
      } = useScreenSafeArea();
      return () => {
        if (slots.default) {
          return vueDemi.h("div", {
            style: {
              paddingTop: props.top ? top.value : "",
              paddingRight: props.right ? right.value : "",
              paddingBottom: props.bottom ? bottom.value : "",
              paddingLeft: props.left ? left.value : "",
              boxSizing: "border-box",
              maxHeight: "100vh",
              maxWidth: "100vw",
              overflow: "auto"
            }
          }, slots.default());
        }
      };
    }
  });

  var __defProp$3 = Object.defineProperty;
  var __defProps$2 = Object.defineProperties;
  var __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$3 = Object.getOwnPropertySymbols;
  var __hasOwnProp$3 = Object.prototype.hasOwnProperty;
  var __propIsEnum$3 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$3 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$3.call(b, prop))
        __defNormalProp$3(a, prop, b[prop]);
    if (__getOwnPropSymbols$3)
      for (var prop of __getOwnPropSymbols$3(b)) {
        if (__propIsEnum$3.call(b, prop))
          __defNormalProp$3(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
  const vScroll = {
    [shared.directiveHooks.mounted](el, binding) {
      if (typeof binding.value === "function") {
        const handler = binding.value;
        const state = useScroll(el, {
          onScroll() {
            handler(state);
          },
          onStop() {
            handler(state);
          }
        });
      } else {
        const [handler, options] = binding.value;
        const state = useScroll(el, __spreadProps$2(__spreadValues$3({}, options), {
          onScroll(e) {
            var _a;
            (_a = options.onScroll) == null ? void 0 : _a.call(options, e);
            handler(state);
          },
          onStop(e) {
            var _a;
            (_a = options.onStop) == null ? void 0 : _a.call(options, e);
            handler(state);
          }
        }));
      }
    }
  };

  function checkOverflowScroll(ele) {
    const style = window.getComputedStyle(ele);
    if (style.overflowX === "scroll" || style.overflowY === "scroll") {
      return true;
    } else {
      const parent = ele.parentNode;
      if (!parent || parent.tagName === "BODY")
        return false;
      return checkOverflowScroll(parent);
    }
  }
  function preventDefault(rawEvent) {
    const e = rawEvent || window.event;
    const _target = e.target;
    if (checkOverflowScroll(_target))
      return false;
    if (e.touches.length > 1)
      return true;
    if (e.preventDefault)
      e.preventDefault();
    return false;
  }
  function useScrollLock(element, initialState = false) {
    const isLocked = vueDemi.ref(initialState);
    let stopTouchMoveListener = null;
    let initialOverflow;
    vueDemi.watch(shared.resolveRef(element), (el) => {
      if (el) {
        const ele = el;
        initialOverflow = ele.style.overflow;
        if (isLocked.value)
          ele.style.overflow = "hidden";
      }
    }, {
      immediate: true
    });
    const lock = () => {
      const ele = shared.resolveUnref(element);
      if (!ele || isLocked.value)
        return;
      if (shared.isIOS) {
        stopTouchMoveListener = useEventListener(ele, "touchmove", (e) => {
          preventDefault(e);
        }, { passive: false });
      }
      ele.style.overflow = "hidden";
      isLocked.value = true;
    };
    const unlock = () => {
      const ele = shared.resolveUnref(element);
      if (!ele || !isLocked.value)
        return;
      shared.isIOS && (stopTouchMoveListener == null ? void 0 : stopTouchMoveListener());
      ele.style.overflow = initialOverflow;
      isLocked.value = false;
    };
    shared.tryOnScopeDispose(unlock);
    return vueDemi.computed({
      get() {
        return isLocked.value;
      },
      set(v) {
        if (v)
          lock();
        else
          unlock();
      }
    });
  }

  const onScrollLock = () => {
    let isMounted = false;
    const state = vueDemi.ref(false);
    return (el, binding) => {
      state.value = binding.value;
      if (isMounted)
        return;
      isMounted = true;
      const isLocked = useScrollLock(el, binding.value);
      vueDemi.watch(state, (v) => isLocked.value = v);
    };
  };
  const vScrollLock = onScrollLock();

  var __defProp$2 = Object.defineProperty;
  var __defProps$1 = Object.defineProperties;
  var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
  var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
  var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$2 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$2.call(b, prop))
        __defNormalProp$2(a, prop, b[prop]);
    if (__getOwnPropSymbols$2)
      for (var prop of __getOwnPropSymbols$2(b)) {
        if (__propIsEnum$2.call(b, prop))
          __defNormalProp$2(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
  const UseTimeAgo = vueDemi.defineComponent({
    name: "UseTimeAgo",
    props: ["time", "updateInterval", "max", "fullDateFormatter", "messages", "showSecond"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useTimeAgo(() => props.time, __spreadProps$1(__spreadValues$2({}, props), { controls: true })));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  var __defProp$1 = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
  var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
  var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$1 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    if (__getOwnPropSymbols$1)
      for (var prop of __getOwnPropSymbols$1(b)) {
        if (__propIsEnum$1.call(b, prop))
          __defNormalProp$1(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  const UseTimestamp = vueDemi.defineComponent({
    name: "UseTimestamp",
    props: ["immediate", "interval", "offset"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useTimestamp(__spreadProps(__spreadValues$1({}, props), { controls: true })));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  const UseVirtualList = vueDemi.defineComponent({
    name: "UseVirtualList",
    props: [
      "list",
      "options",
      "height"
    ],
    setup(props, { slots, expose }) {
      const { list: listRef } = vueDemi.toRefs(props);
      const { list, containerProps, wrapperProps, scrollTo } = core.useVirtualList(listRef, props.options);
      expose({ scrollTo });
      typeof containerProps.style === "object" && !Array.isArray(containerProps.style) && (containerProps.style.height = props.height || "300px");
      return () => vueDemi.h("div", __spreadValues({}, containerProps), [
        vueDemi.h("div", __spreadValues({}, wrapperProps.value), list.value.map((item) => vueDemi.h("div", { style: { overFlow: "hidden", height: item.height } }, slots.default ? slots.default(item) : "Please set content!")))
      ]);
    }
  });

  const UseWindowFocus = vueDemi.defineComponent({
    name: "UseWindowFocus",
    setup(props, { slots }) {
      const data = vueDemi.reactive({
        focused: core.useWindowFocus()
      });
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  const UseWindowSize = vueDemi.defineComponent({
    name: "UseWindowSize",
    props: ["initialWidth", "initialHeight"],
    setup(props, { slots }) {
      const data = vueDemi.reactive(core.useWindowSize(props));
      return () => {
        if (slots.default)
          return slots.default(data);
      };
    }
  });

  exports.OnClickOutside = OnClickOutside;
  exports.OnLongPress = OnLongPress;
  exports.UseActiveElement = UseActiveElement;
  exports.UseBattery = UseBattery;
  exports.UseBrowserLocation = UseBrowserLocation;
  exports.UseColorMode = UseColorMode;
  exports.UseDark = UseDark;
  exports.UseDeviceMotion = UseDeviceMotion;
  exports.UseDeviceOrientation = UseDeviceOrientation;
  exports.UseDevicePixelRatio = UseDevicePixelRatio;
  exports.UseDevicesList = UseDevicesList;
  exports.UseDocumentVisibility = UseDocumentVisibility;
  exports.UseDraggable = UseDraggable;
  exports.UseElementBounding = UseElementBounding;
  exports.UseElementSize = UseElementSize;
  exports.UseElementVisibility = UseElementVisibility;
  exports.UseEyeDropper = UseEyeDropper;
  exports.UseFullscreen = UseFullscreen;
  exports.UseGeolocation = UseGeolocation;
  exports.UseIdle = UseIdle;
  exports.UseImage = UseImage;
  exports.UseMouse = UseMouse;
  exports.UseMouseInElement = UseMouseInElement;
  exports.UseMousePressed = UseMousePressed;
  exports.UseNetwork = UseNetwork;
  exports.UseNow = UseNow;
  exports.UseObjectUrl = UseObjectUrl;
  exports.UseOffsetPagination = UseOffsetPagination;
  exports.UseOnline = UseOnline;
  exports.UsePageLeave = UsePageLeave;
  exports.UsePointer = UsePointer;
  exports.UsePreferredColorScheme = UsePreferredColorScheme;
  exports.UsePreferredContrast = UsePreferredContrast;
  exports.UsePreferredDark = UsePreferredDark;
  exports.UsePreferredLanguages = UsePreferredLanguages;
  exports.UsePreferredReducedMotion = UsePreferredReducedMotion;
  exports.UseScreenSafeArea = UseScreenSafeArea;
  exports.UseTimeAgo = UseTimeAgo;
  exports.UseTimestamp = UseTimestamp;
  exports.UseVirtualList = UseVirtualList;
  exports.UseWindowFocus = UseWindowFocus;
  exports.UseWindowSize = UseWindowSize;
  exports.VOnClickOutside = vOnClickOutside;
  exports.VOnLongPress = vOnLongPress;
  exports.vElementHover = vElementHover;
  exports.vElementSize = vElementSize;
  exports.vElementVisibility = vElementVisibility;
  exports.vInfiniteScroll = vInfiniteScroll;
  exports.vIntersectionObserver = vIntersectionObserver;
  exports.vOnClickOutside = vOnClickOutside;
  exports.vOnKeyStroke = vOnKeyStroke;
  exports.vOnLongPress = vOnLongPress;
  exports.vScroll = vScroll;
  exports.vScrollLock = vScrollLock;

})(this.VueUse = this.VueUse || {}, VueDemi, VueUse, VueUse);
