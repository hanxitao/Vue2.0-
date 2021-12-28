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

        // 如果表达式是一个函数
        if (typeof exprOrFn === 'function') {
            this.getter = exprOrFn;
        }

        // 实例化就会默认调用get方法
        this.get();
    }

    get() {
        pushTarget(this);
        this.getter();
        popTarget();
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
        // 每次watcher进行更新的时候，是否可以让他们先缓存起来，之后再一起调用
        // 异步队列机制
        queueWatcher(this);
    }

    run() {
        // 真正的触发更新
        this.get();
    }
}