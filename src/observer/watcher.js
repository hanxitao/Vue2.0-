import { pushTarget, popTarget } from './dep';
import { queueWatcher } from './scheduler';
// 全局变量id，每次new Watcher都会自增
let id = 0;

export default class Watcher {
    constructor(vm, exprOrFn, cb, options) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        this.cb = cb; // 回调函数，比如在watcher更新之前可以执行beforeUpdate方法
        this.options = options; // 额外的选项，true代表渲染watcher
        this.id = id ++; // watcher的唯一标识
        this.deps = []; // 存放dep的容器
        this.depsId = new Set(); // 用来去重dep

        this.user = options.user; // 标识用户watcher
        this.lazy = options.lazy; // 标识计算属性watcher
        this.dirty = this.lazy; // dirty可变，表示计算watcher是否需要重新计算，默认值为true

        // 如果表达式是一个函数
        if (typeof exprOrFn === 'function') {
            this.getter = exprOrFn;
        } else {
            this.getter = function () {
                // 用户watcher传过来的可能是一个字符串，类似：a.a.b
                let path = exprOrFn.split('.');
                let obj = vm;
                for (let i = 0; i < path.length; i ++) {
                    obj = obj[path[i]]; // vm.a.a.b
                }
                return obj;
            }
        }

        // 实例化就进行一次取值操作，进行依赖收集过程
        this.value =  this.lazy ? undefined : this.get();
    }

    get() {
        pushTarget(this);
        const res = this.getter.call(this.vm);
        popTarget();

        return res;
    }

    addDep(dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }

    update() {
        // 计算属性依赖的值发生变化，只需要把dirty置为true，下次访问到了重新计算
        if (this.lazy) {
            this.dirty = true;
        } else {
            // 每次watcher进行更新的时候，是否可以让他们先缓存起来，之后再一起调用
            // 异步队列机制
            queueWatcher(this);
        }
    }

    // 计算属性重新进行计算，并且计算完成把dirty置为false
    evaluate() {
        this.value = this.get();
        this.dirty = false;
    }

    // 计算属性的watcher存储了依赖项的dep
    depend() {
        let i = this.deps.length;
        while (i --) {
            this.deps[i].depend();
        }
    }

    run() {
        const newVal = this.get(); // 新值
        const oldVal = this.value; // 旧值
        this.value = newVal; // 现在的新值将成为下一次的老值
        if (this.user) {
            const objToStr = Object.prototype.toString;
            // 如果两次的值不相同，或者是引用类型，因为引用类型新旧值是相等的
            if (newVal !== oldVal || objToStr.call(newVal) === '[object Object]') {
                this.cb.call(this.vm, newVal, oldVal);
            }
        } else {
            // 渲染watcher
            this.exprOrFn();
        }
    }
}