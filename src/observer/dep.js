let id = 0;
export default class Dep {
    constructor() {
        this.id = id ++;
        this.subs = [];
    }

    depend() {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }

    notify() {
        this.subs.forEach(watcher => watcher.update());
    }

    addSub(watcher) {
        this.subs.push(watcher);
    }
}

Dep.target = null;

const targetStack = [];

export function pushTarget(watcher) {
    targetStack.push(watcher);
    Dep.target = watcher;
}

export function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
}