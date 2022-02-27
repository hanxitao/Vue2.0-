import Dep from './observer/dep';
import { observe } from './observer/index';
import Watcher from './observer/watcher';

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
        initComputed(vm);
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

function initComputed(vm) {
    const computed = vm.$options.computed;
    const watchers = vm._computedWatchers = {};

    for (let k in computed) {
        const userDef = computed[k]; // 获取用户定义的计算属性
        const getter = typeof userDef === 'function' ? userDef : userDef.get;
        watchers[k] = new Watcher(vm, getter, () => {}, { lazy: true }); // 创建计算watcher，lazy设置为true
        defineComputed(vm, k, userDef);
    }
}

// 定义普通对象用来劫持计算属性
const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: () => {},
    set: () => {}
}

// 重新定义计算属性，使用get和set进行劫持
function defineComputed(target, key, userDef) {
    if (typeof userDef === 'function') {
        sharedPropertyDefinition.get = createComputedGetter(key);
    } else {
        sharedPropertyDefinition.get = createComputedGetter(key);
        sharedPropertyDefinition.set = userDef.set;
    }

    // 利用Object.defineProperty来对计算属性的get和set进行劫持
    Object.defineProperty(target, key, sharedPropertyDefinition);
}

// 重写计算属性的get方法来判断是否需要进行重新计算
function createComputedGetter(key) {
    return function () {
        const watcher = this._computedWatchers[key]; // 获取对应的计算属性watcher
        
        if (watcher) {
            if (watcher.dirty) {
                console.log('computed is dirty')
                watcher.evaluate(); // 计算属性取值的时候，如果是脏的，则需要重新计算

                if (Dep.target) {
                    // 如果Dep还存在target，这个时候一般为渲染watcher，计算属性依赖的数据也需要收集
                    watcher.depend();
                }
            }

            return watcher.value;
        }
    }
}