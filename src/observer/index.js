import { arrayMethods } from './array';
import Dep from './dep';

class Observer {
    constructor(value) {
        this.dep = new Dep();
        Object.defineProperty(value, '__ob__', {
            value: this,
            enumerable: false,
            writable: true,
            configurable: true
        });

        if (Array.isArray(value)) {
            value.__proto__ = arrayMethods;
            this.observeArray(value);
        } else {
            this.walk(value);
        }
    }

    walk(data) {
        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i ++) {
            let key = keys[i],
                value = data[key];
            
            defineReactive(data, key, value);
        }
    }

    observeArray(items) {
        for (let i = 0; i < items.length; i ++) {
            observe(items[i]);
        }
    }
}

function defineReactive(data, key, value) {
    let childOb = observe(value);

    let dep = new Dep();
    Object.defineProperty(data, key, {
        get() {
            if (Dep.target) {
                dep.depend();
                if (childOb) {
                    childOb.dep.depend();

                    if (Array.isArray(value)) {
                        dependArray(value);
                    }
                }
            }
            return value;
        },
        set(newValue) {
            if (newValue === value) return;
            // 如果赋值的新值也是一个对象，需要观测
            if (newValue instanceof Array) {
                defineReactive(data, key, newValue);
            } else {
                observe(newValue);
            }
            value = newValue;
            dep.notify();
        }
    })
}

function dependArray(value) {
    for (let e, i = 0, l = value.length; i < l; i ++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();

        if (Array.isArray(e)) {
            dependArray(e);
        }
    }
}

export function observe(value) {
    if (
        Object.prototype.toString.call(value) === "[object Object]" ||
        Array.isArray(value)
    ) {
        return new Observer(value);
    }
}