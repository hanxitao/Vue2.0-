import { initState } from './state';
import { compileToFunctions } from './compiler/index';
import { mountComponent } from './lifecycle';

export function initMixin(Vue) {
    Vue.prototype._init = function (options) {
        const vm = this;

        vm.$options = options;
        initState(vm);

        // 如果有el属性则进行模板渲染
        if (vm.$options.el) {
            vm.$mount(vm.$options.el);
        }
    }

    Vue.prototype.$mount = function (el) {
        const vm = this;
        const options = vm.$options;
        el = document.querySelector(el);

        // 如果不存在render属性
        if (!options.render) {
            // 如果存在template属性
            let template = options.template;
            
            if (!template && el) {
                template = el.outerHTML;
            }

            // 最终需把template模板转化成render函数
            if (template) {
                const render = compileToFunctions(template);
                options.render = render;
            }
        }

        return mountComponent(vm, el);
    }
}