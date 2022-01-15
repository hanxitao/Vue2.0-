import { patch } from './vdom/patch';
import Watcher from './observer/watcher';

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
        const vm = this;
        const preVnode = vm._vnode; // 保留上一次的vnode
        vm._vnode = vnode;
        if (!preVnode) {
            // 初次渲染时vm._vnode肯定不存在
            vm.$el = patch(vm.$el, vnode);
        } else {
            vm.$el = patch(preVnode, vnode);
        }
    }
}

export function mountComponent(vm, el) {
    vm.$el = el;

    // 引入watcher的概念，这里注册一个watcher，执行vm._update(vm._render())方法渲染视图
    let updateComponent = () => {
        vm._update(vm._render());
    };
    new Watcher(vm, updateComponent, null, true);
}