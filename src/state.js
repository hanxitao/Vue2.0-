import { observe } from './observer/index';

export function initState(vm) {
    const opts = vm.$options;

    if (opts.props) {
        // initProps(vm);
    }

    if (opts.methods) {
        // initMethod(vm);
    }

    if (opts.data) {
        initData(vm);
    }

    if (opts.computed) {
        // initComputed(vm);
    }

    if (opts.watch) {
        initWatch(vm);
    }
}

function initData(vm) {
    let data = vm.$options.data;

    data = vm._data = typeof data === 'function' ? data.call(vm) : data || {};
    for (let key in data) {
        proxy(vm, '_data', key);
    }
    observe(data);
}

function proxy(object, sourceKey, key) {
    Object.defineProperty(object, key, {
        get() {
            return object[sourceKey][key];
        },
        set(newValue) {
            object[sourceKey][key] = newValue;
        }
    })
}

// 初始化watch
function initWatch(vm) {
    let watch = vm.$options.watch;

    for (let k in watch) {
        const handler = watch[k]; // 用户自定义watch的写法可能是数组、对象、函数、字符串
        if (Array.isArray(handler)) {
            // 如果是数组就遍历进行创建
            handler.forEach((handle) => {
                createWatcher(vm, k, handle);
            });
        } else {
            createWatcher(vm, k, handler);
        }
    }
}

// 创建watcher核心
function createWatcher(vm, exprOrFn, handler, options = {}) {
    if (typeof handler === 'object') {
        options = handler; // 保存用户传入的对象
        handler = handler.handler; // 这个代表真正用户传入的函数
    }

    if (typeof handler === 'string') {
        // 代表传入的是定义好的methods方法
        handler = vm[handler];
    }

    // 调用vm.$watch创建用户watcher
    return vm.$watch(exprOrFn, handler, options);
}