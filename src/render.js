import { createElement, createTextNode } from './vdom/index';
import { nextTick } from './util/next-tick';

export function renderMixin(Vue) {
    Vue.prototype.$nextTick = nextTick;

    Vue.prototype._render = function () {
        const vm = this,
            { render } = vm.$options,
            vnode = render.call(vm);

        return vnode;
    }

    Vue.prototype._c = function (...args) {
        return createElement(...args);
    }

    Vue.prototype._v = function (text) {
        return createTextNode(text);
    }

    Vue.prototype._s = function (val) {
        return val == null
        ? ''
        : typeof val === 'object'
        ? JSON.stringify(val)
        : val;
    }
}